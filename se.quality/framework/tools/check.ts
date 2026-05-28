import fs from 'node:fs';
import path from 'node:path';

type Severity = 'must_fix' | 'should_fix';

type Finding = {
  id: string;
  ruleId: string;
  rule: string;
  severity: Severity;
  file?: string;
  line?: number;
  message: string;
  context: string;
  evidence?: string;
  suggestedAction: string;
};

type QualityConfig = {
  sourceRoots: {
    javaMain: string;
    moduleRoot: string;
  };
  moduleDependencies: Record<string, string[]>;
  fileSize: {
    javaHardLimit: number;
    javaWarningLimit?: number;
  };
  requiredPackageScripts: string[];
  testArchitectureFile: string;
  declaredTestDirPattern: string;
  forbiddenVocabulary: Array<{
    term: string;
    message: string;
  }>;
};

const workspaceRoot = process.cwd();
const qualityRoot = resolveQualityRoot();
const projectRoot = path.join(qualityRoot, 'project');
const reportsDir = path.join(projectRoot, 'reports');
const evidenceDir = path.join(projectRoot, 'evidence');
const historyDir = path.join(projectRoot, 'history');
const configPath = path.join(projectRoot, 'quality.config.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as QualityConfig;
const javaRoot = path.join(workspaceRoot, config.sourceRoots.javaMain);
const moduleRoot = path.join(workspaceRoot, config.sourceRoots.moduleRoot);

const allowedModuleDeps: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(config.moduleDependencies).map(([module, deps]) => [module, new Set(deps)]),
);

const rules: Record<string, string> = {
  QR001: 'stable-dependency-direction',
  QR002: 'single-responsibility-file-size',
  QR003: 'test-code-isolation',
  QR004: 'global-vocabulary',
  QR005: 'single-explicit-entrypoint',
};

const findings: Finding[] = [];

function resolveQualityRoot(): string {
  if (process.env.SE_QUALITY_HOME) {
    return path.resolve(process.env.SE_QUALITY_HOME);
  }
  const candidate = path.join(workspaceRoot, 'se.quality');
  if (fs.existsSync(candidate)) {
    return candidate;
  }
  const fromScript = path.resolve(__dirname, '..', '..');
  if (fs.existsSync(path.join(fromScript, 'project'))) {
    return fromScript;
  }
  throw new Error('Cannot resolve se.quality root. Set SE_QUALITY_HOME or run from the repository root.');
}

function walk(dir: string, predicate: (file: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, predicate, out);
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function rel(file: string): string {
  return path.relative(workspaceRoot, file).replaceAll(path.sep, '/');
}

function add(
  ruleId: string,
  severity: Severity,
  message: string,
  context: string,
  suggestedAction: string,
  file?: string,
  line?: number,
  evidence?: string,
) {
  const id = `${ruleId}-${String(findings.length + 1).padStart(3, '0')}`;
  findings.push({
    id,
    ruleId,
    rule: rules[ruleId],
    severity,
    message,
    context,
    suggestedAction,
    file: file ? rel(file) : undefined,
    line,
    evidence,
  });
}

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function validateModuleDeps(javaFiles: string[]) {
  const importPattern = /import\s+com\.fri\.modules\.([a-z]+)\./g;
  for (const file of javaFiles) {
    const relative = path.relative(moduleRoot, file).replaceAll(path.sep, '/');
    const ownerModule = relative.split('/')[0];
    if (!allowedModuleDeps[ownerModule]) {
      continue;
    }
    const content = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    while ((match = importPattern.exec(content)) !== null) {
      const targetModule = match[1];
      if (targetModule === ownerModule) {
        continue;
      }
      if (!allowedModuleDeps[ownerModule].has(targetModule)) {
        add(
          'QR001',
          'must_fix',
          `${ownerModule} 不应依赖 ${targetModule}`,
          `所属模块 ${ownerModule} 导入了目标模块 ${targetModule}，但该依赖不在 project/quality.config.json 的允许矩阵中。`,
          '将该依赖移动到允许的端口或共享边界之后；如果架构已经变化，则同步更新项目依赖矩阵。',
          file,
          lineOf(content, match.index),
          `import target module: ${targetModule}`,
        );
      }
    }
  }
}

function validateFileSize(javaFiles: string[]) {
  for (const file of javaFiles) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
    if (lines > config.fileSize.javaHardLimit) {
      add(
        'QR002',
        'must_fix',
        `Java 文件共有 ${lines} 行，超过必须修复阈值 ${config.fileSize.javaHardLimit} 行`,
        '该文件超过配置的硬性规模限制，可能承载了过多职责。',
        '按职责拆分文件，或将辅助逻辑移动到边界更清晰的协作者中。',
        file,
        undefined,
        `lines: ${lines}`,
      );
    } else if (config.fileSize.javaWarningLimit && lines > config.fileSize.javaWarningLimit) {
      add(
        'QR002',
        'should_fix',
        `Java 文件共有 ${lines} 行，超过建议修复阈值 ${config.fileSize.javaWarningLimit} 行`,
        '该文件正在接近配置的硬性规模限制。',
        '复核该文件是否仍然只有一个清晰职责。',
        file,
        undefined,
        `lines: ${lines}`,
      );
    }
  }
}

function validateTestPollution(javaFiles: string[]) {
  const testSupportName = /\b(TestSupport|Recording[A-Z]\w*|Fake[A-Z]\w*|Stub[A-Z]\w*|Seed[A-Z]\w*)\b/g;
  const forbiddenApplicationDependency = /import\s+com\.fri\.modules\.[a-z]+\.infrastructure\.(InMemory|Recording|Fake|Stub|Noop)\w+/g;

  for (const file of javaFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    while ((match = testSupportName.exec(content)) !== null) {
      add(
        'QR003',
        'must_fix',
        `src/main 中出现测试支撑风格命名 "${match[1]}"`,
        '生产代码中出现了通常保留给测试支撑或测试便利实现的命名。',
        '将测试支撑移动到测试源码中，或将生产概念重命名为领域术语。',
        file,
        lineOf(content, match.index),
        match[1],
      );
    }

    const relative = rel(file);
    if (relative.includes('/application/') || relative.includes('/domain/')) {
      while ((match = forbiddenApplicationDependency.exec(content)) !== null) {
        add(
          'QR003',
          'must_fix',
          'application/domain 不应导入 infrastructure 测试便利实现',
          '内层代码依赖了命名上指向测试或便利实现的 infrastructure 类。',
          '改为依赖 application/domain 端口，并在内层之外绑定 infrastructure 实现。',
          file,
          lineOf(content, match.index),
          match[0],
        );
      }
    }
  }
}

function validateEntrypoints() {
  const packageJsonFile = path.join(workspaceRoot, 'package.json');
  if (fs.existsSync(path.join(workspaceRoot, 'pom.xml')) && fs.existsSync(path.join(workspaceRoot, 'build.gradle'))) {
    add(
      'QR005',
      'must_fix',
      '同时存在 pom.xml 和 build.gradle，必须声明唯一构建权威入口',
      '项目存在多个构建入口，但质量项目配置中没有声明唯一权威入口。',
      '在 project/project.config.md 中记录一个权威构建入口，并说明另一个入口的辅助用途。',
    );
  }

  if (fs.existsSync(packageJsonFile)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8')) as { scripts?: Record<string, string> };
    const scripts = packageJson.scripts ?? {};
    for (const required of config.requiredPackageScripts) {
      if (!scripts[required]) {
        add(
          'QR005',
          'must_fix',
          `package.json 缺少 npm script "${required}"`,
          '项目入口契约要求该 npm script，以便本地、CI 和 Agent 能重复执行。',
          '添加该 script；如果它不再需要，则从 project/quality.config.json 中移除。',
          packageJsonFile,
        );
      }
    }
  }

  const testArchitectureFile = path.join(workspaceRoot, config.testArchitectureFile);
  if (fs.existsSync(testArchitectureFile)) {
    const content = fs.readFileSync(testArchitectureFile, 'utf8');
    const declaredDirs = [...content.matchAll(new RegExp(config.declaredTestDirPattern, 'g'))].map(match =>
      match[1].replace(/\/$/, ''),
    );
    for (const dir of new Set(declaredDirs)) {
      if (!fs.existsSync(path.join(workspaceRoot, dir))) {
        add(
          'QR005',
          'must_fix',
          `${config.testArchitectureFile} 声明了不存在的目录 ${dir}`,
          '测试架构文档声明了一个仓库中不存在的测试目录。',
          '创建该目录、修正文档，或移除过期声明。',
          testArchitectureFile,
          undefined,
          dir,
        );
      }
    }
  }
}

function validateVocabulary(javaFiles: string[]) {
  const forbiddenTerms = config.forbiddenVocabulary.map(term => ({
    pattern: new RegExp(`\\b${term.term}\\b`, 'g'),
    message: term.message,
  }));

  for (const file of javaFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const term of forbiddenTerms) {
      let match: RegExpExecArray | null;
      while ((match = term.pattern.exec(content)) !== null) {
        add(
        'QR004',
        'must_fix',
        term.message,
        '源码中出现了项目禁用或容易混淆的领域词汇。',
        '重命名该符号，或在 project/project.config.md 中登记明确例外。',
          file,
          lineOf(content, match.index),
          match[0],
        );
      }
    }
  }
}

function ensureReportDirs() {
  for (const dir of [reportsDir, evidenceDir, historyDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function nowStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function writeReports() {
  ensureReportDirs();
  const generatedAt = new Date().toISOString();
  const summary = {
    total: findings.length,
    mustFix: findings.filter(finding => finding.severity === 'must_fix').length,
    shouldFix: findings.filter(finding => finding.severity === 'should_fix').length,
  };
  const artifact = {
    generatedAt,
    workspaceRoot,
    qualityRoot,
    status: summary.mustFix > 0 ? 'fail' : 'pass',
    summary,
    findings,
  };

  const historyFile = path.join(historyDir, `${nowStamp()}.json`);
  fs.writeFileSync(historyFile, JSON.stringify(artifact, null, 2), 'utf8');
  fs.writeFileSync(path.join(evidenceDir, 'latest.json'), JSON.stringify(artifact, null, 2), 'utf8');
  fs.writeFileSync(path.join(evidenceDir, 'latest.md'), renderEvidenceMarkdown(artifact), 'utf8');
  fs.writeFileSync(path.join(reportsDir, 'QUALITY_REPORT.md'), renderSummaryMarkdown(artifact, historyFile), 'utf8');
}

function renderSummaryMarkdown(artifact: {
  generatedAt: string;
  status: string;
  summary: { total: number; mustFix: number; shouldFix: number };
  findings: Finding[];
}, historyFile: string): string {
  const topFindings = artifact.findings.slice(0, 10);
  const statusText = artifact.status === 'pass' ? '通过' : '未通过';
  return [
    '# 质量检查报告',
    '',
    `生成时间：${artifact.generatedAt}`,
    `状态：${statusText}`,
    '',
    '## 摘要',
    '',
    `- 问题总数：${artifact.summary.total}`,
    `- 必须修复：${artifact.summary.mustFix}`,
    `- 建议修复：${artifact.summary.shouldFix}`,
    '',
    '## 主要问题',
    '',
    ...(topFindings.length === 0
      ? ['无问题。']
      : topFindings.map(finding => {
          const location = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ''}` : 'project';
          return `- ${finding.id} [${finding.severity}] ${finding.ruleId} ${location}: ${finding.message}`;
        })),
    '',
    '## 证据',
    '',
    '- 详细报告：`se.quality/project/evidence/latest.md`',
    '- 机器报告：`se.quality/project/evidence/latest.json`',
    `- 原始历史产物：\`${rel(historyFile)}\``,
    '',
  ].join('\n');
}

function renderEvidenceMarkdown(artifact: {
  generatedAt: string;
  status: string;
  summary: { total: number; mustFix: number; shouldFix: number };
  findings: Finding[];
}): string {
  const statusText = artifact.status === 'pass' ? '通过' : '未通过';
  const lines = [
    '# 质量检查证据',
    '',
    `生成时间：${artifact.generatedAt}`,
    `状态：${statusText}`,
    '',
    '## 摘要',
    '',
    `- 问题总数：${artifact.summary.total}`,
    `- 必须修复：${artifact.summary.mustFix}`,
    `- 建议修复：${artifact.summary.shouldFix}`,
    '',
    '## 问题明细',
    '',
  ];

  if (artifact.findings.length === 0) {
    lines.push('无问题。', '');
    return lines.join('\n');
  }

  for (const finding of artifact.findings) {
    const location = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ''}` : 'project';
    lines.push(
      `### ${finding.id} ${finding.ruleId} ${finding.severity}`,
      '',
      `- 规则：${finding.rule}`,
      `- 位置：${location}`,
      `- 问题：${finding.message}`,
      `- 上下文：${finding.context}`,
      `- 证据：${finding.evidence ?? '无'}`,
      `- 建议动作：${finding.suggestedAction}`,
      '',
    );
  }
  return lines.join('\n');
}

function printReport() {
  if (findings.length === 0) {
    console.log('Quality check passed.');
    return;
  }

  console.error(`Quality check found ${findings.length} issue(s):`);
  for (const finding of findings) {
    const location = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ''}` : 'project';
    const evidence = finding.evidence ? ` (${finding.evidence})` : '';
    console.error(`- [${finding.severity}] [${finding.ruleId}/${finding.rule}] ${location} - ${finding.message}${evidence}`);
  }
}

const javaFiles = walk(javaRoot, file => file.endsWith('.java'));
const moduleJavaFiles = javaFiles.filter(file => rel(file).startsWith(config.sourceRoots.moduleRoot));

validateModuleDeps(moduleJavaFiles);
validateFileSize(javaFiles);
validateTestPollution(javaFiles);
validateVocabulary(javaFiles);
validateEntrypoints();
writeReports();
printReport();

process.exit(findings.some(finding => finding.severity === 'must_fix') ? 1 : 0);
