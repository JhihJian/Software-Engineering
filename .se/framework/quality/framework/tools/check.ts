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
  sourceRoots?: string[];
  requiredPackageScripts?: string[];
  fileSize?: {
    warningLimit?: number;
    hardLimit?: number;
  };
  forbiddenVocabulary?: Array<{
    term: string;
    message: string;
  }>;
};

const workspaceRoot = process.cwd();
const projectRoot = path.join(workspaceRoot, '.se', 'project', 'quality');
const reportsDir = path.join(projectRoot, 'reports');
const evidenceDir = path.join(projectRoot, 'evidence');
const historyDir = path.join(projectRoot, 'history');
const configPath = path.join(projectRoot, 'quality.config.json');

const rules: Record<string, string> = {
  QR001: 'quality-project-config-exists',
  QR002: 'required-package-scripts',
  QR003: 'file-size-threshold',
  QR004: 'forbidden-vocabulary',
};

const findings: Finding[] = [];

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

function readConfig(): QualityConfig {
  if (!fs.existsSync(projectRoot)) {
    add(
      'QR001',
      'must_fix',
      'Missing .se/project/quality directory',
      'The quality framework expects initialized project state under .se/project/quality.',
      'Initialize the project state from se.quality/project.template.',
    );
    return {};
  }

  if (!fs.existsSync(configPath)) {
    add(
      'QR001',
      'must_fix',
      'Missing .se/project/quality/quality.config.json',
      'The quality check needs a machine-readable project configuration.',
      'Create .se/project/quality/quality.config.json from se.quality/project.template.',
    );
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as QualityConfig;
  } catch (error) {
    add(
      'QR001',
      'must_fix',
      'Invalid quality.config.json',
      'The quality configuration could not be parsed as JSON.',
      'Fix .se/project/quality/quality.config.json so it is valid JSON.',
      configPath,
      undefined,
      error instanceof Error ? error.message : String(error),
    );
    return {};
  }
}

function walk(dir: string, predicate: (file: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules') {
        continue;
      }
      walk(full, predicate, out);
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function validateRequiredScripts(config: QualityConfig) {
  const required = config.requiredPackageScripts ?? [];
  if (required.length === 0) {
    return;
  }

  const packageJsonFile = path.join(workspaceRoot, 'package.json');
  if (!fs.existsSync(packageJsonFile)) {
    add(
      'QR002',
      'must_fix',
      'package.json is missing but required scripts are configured',
      'quality.config.json lists required npm scripts, but the repository has no package.json.',
      'Add package.json with the required scripts, or clear requiredPackageScripts if npm is not the project entrypoint.',
      packageJsonFile,
    );
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8')) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};
  for (const script of required) {
    if (!scripts[script]) {
      add(
        'QR002',
        'must_fix',
        `package.json is missing npm script "${script}"`,
        'The project quality configuration declares this script as a stable execution entrypoint.',
        'Add the script to package.json, or remove it from requiredPackageScripts.',
        packageJsonFile,
      );
    }
  }
}

function collectConfiguredFiles(config: QualityConfig): string[] {
  const sourceRoots = config.sourceRoots ?? [];
  return sourceRoots.flatMap((sourceRoot) => {
    const absolute = path.join(workspaceRoot, sourceRoot);
    if (!fs.existsSync(absolute)) {
      add(
        'QR001',
        'must_fix',
        `Configured source root does not exist: ${sourceRoot}`,
        'quality.config.json includes a source root that is not present in the repository.',
        'Create the directory or update .se/project/quality/quality.config.json.',
        configPath,
        undefined,
        sourceRoot,
      );
      return [];
    }
    return walk(absolute, file => /\.(ts|tsx|js|jsx|md|json|yaml|yml|sh)$/.test(file));
  });
}

function validateFileSize(config: QualityConfig, files: string[]) {
  const warningLimit = config.fileSize?.warningLimit;
  const hardLimit = config.fileSize?.hardLimit;
  if (!warningLimit && !hardLimit) {
    return;
  }

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
    if (hardLimit && lines > hardLimit) {
      add(
        'QR003',
        'must_fix',
        `File has ${lines} lines, exceeding hard limit ${hardLimit}`,
        'The configured file size hard limit is intended to catch files carrying too many responsibilities.',
        'Split the file or update the configured threshold if this file is an intentional exception.',
        file,
        undefined,
        `lines: ${lines}`,
      );
    } else if (warningLimit && lines > warningLimit) {
      add(
        'QR003',
        'should_fix',
        `File has ${lines} lines, exceeding warning limit ${warningLimit}`,
        'The file is approaching the configured hard limit.',
        'Review whether the file still has a clear single responsibility.',
        file,
        undefined,
        `lines: ${lines}`,
      );
    }
  }
}

function validateForbiddenVocabulary(config: QualityConfig, files: string[]) {
  const terms = config.forbiddenVocabulary ?? [];
  if (terms.length === 0) {
    return;
  }

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const term of terms) {
      const pattern = new RegExp(`\\b${escapeRegExp(term.term)}\\b`, 'g');
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        add(
          'QR004',
          'must_fix',
          term.message,
          'The file contains vocabulary that the project quality configuration forbids.',
          'Rename the term or document an explicit exception in .se/project/quality/project.config.md.',
          file,
          lineOf(content, match.index),
          match[0],
        );
      }
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    projectRoot,
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
  const statusText = artifact.status === 'pass' ? 'passed' : 'failed';
  return [
    '# Quality Report',
    '',
    `Generated at: ${artifact.generatedAt}`,
    `Status: ${statusText}`,
    '',
    '## Summary',
    '',
    `- Total findings: ${artifact.summary.total}`,
    `- Must fix: ${artifact.summary.mustFix}`,
    `- Should fix: ${artifact.summary.shouldFix}`,
    '',
    '## Main Findings',
    '',
    ...(topFindings.length === 0
      ? ['No findings.']
      : topFindings.map(finding => {
          const location = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ''}` : 'project';
          return `- ${finding.id} [${finding.severity}] ${finding.ruleId} ${location}: ${finding.message}`;
        })),
    '',
    '## Evidence',
    '',
    '- Detailed report: `.se/project/quality/evidence/latest.md`',
    '- Machine report: `.se/project/quality/evidence/latest.json`',
    `- Historical artifact: \`${rel(historyFile)}\``,
    '',
  ].join('\n');
}

function renderEvidenceMarkdown(artifact: {
  generatedAt: string;
  status: string;
  summary: { total: number; mustFix: number; shouldFix: number };
  findings: Finding[];
}): string {
  const statusText = artifact.status === 'pass' ? 'passed' : 'failed';
  const lines = [
    '# Quality Evidence',
    '',
    `Generated at: ${artifact.generatedAt}`,
    `Status: ${statusText}`,
    '',
    '## Summary',
    '',
    `- Total findings: ${artifact.summary.total}`,
    `- Must fix: ${artifact.summary.mustFix}`,
    `- Should fix: ${artifact.summary.shouldFix}`,
    '',
    '## Findings',
    '',
  ];

  if (artifact.findings.length === 0) {
    lines.push('No findings.', '');
    return lines.join('\n');
  }

  for (const finding of artifact.findings) {
    const location = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ''}` : 'project';
    lines.push(
      `### ${finding.id} ${finding.ruleId} ${finding.severity}`,
      '',
      `- Rule: ${finding.rule}`,
      `- Location: ${location}`,
      `- Message: ${finding.message}`,
      `- Context: ${finding.context}`,
      `- Evidence: ${finding.evidence ?? 'none'}`,
      `- Suggested action: ${finding.suggestedAction}`,
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

const config = readConfig();
const files = collectConfiguredFiles(config);

validateRequiredScripts(config);
validateFileSize(config, files);
validateForbiddenVocabulary(config, files);
writeReports();
printReport();

process.exit(findings.some(finding => finding.severity === 'must_fix') ? 1 : 0);
