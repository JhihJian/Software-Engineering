import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const architectureRoot = fs.existsSync(path.join(root, 'se.architecture'))
  ? path.join(root, 'se.architecture')
  : process.cwd();

const requiredFiles = [
  'README.md',
  'framework/meta/ARCHITECTURE_SPEC.md',
  'framework/meta/DOCUMENT_MODEL.md',
  'framework/meta/INVARIANT_RULES.md',
  'framework/meta/AGENT_RULES.md',
  'framework/prompts/architecture.md',
  'framework/guides/workflow.md',
  'framework/guides/build.md',
  'framework/guides/maintenance.md',
  'framework/guides/checklist.md',
  'project.template/ARCHITECTURE.md',
  'project.template/glossary.md',
  'project.template/source-map.md',
  'project.template/decisions/README.md',
];

const projectRequiredHeadings = [
  'Project Overview',
  'Core Domain Model',
  'Core Flows',
  'Security And Permissions',
  'Module Boundaries',
  'Invariants',
  'Related Files',
];

const moduleRequiredHeadings = [
  '模块定位与边界',
  '核心实体',
  '功能清单',
  '业务规则',
  '用户交互流程',
];

function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(architectureRoot, relativePath));
}

function hasHeading(markdown: string, heading: string): boolean {
  return new RegExp(`^\\s*(?:[-*+]\\s+|\\d+\\.\\s+)?#{1,4}\\s+${escapeRegExp(heading)}(?:\\s|$)`, 'm').test(markdown);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectMarkdownFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractMarkdownLinks(markdown: string): string[] {
  const links: string[] = [];
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of markdown.matchAll(linkPattern)) {
    links.push(match[1].split('#')[0]);
  }

  return links
    .map((link) => link.trim())
    .filter((link) => link.length > 0)
    .filter((link) => !/^[a-z]+:\/\//i.test(link))
    .filter((link) => !link.startsWith('#'));
}

function resolveLink(fromFile: string, link: string): string {
  const cleanLink = decodeURI(link.replace(/^<|>$/g, ''));
  if (cleanLink.startsWith('/')) {
    return path.join(root, cleanLink);
  }
  if (cleanLink.startsWith('se.architecture/')) {
    return path.join(root, cleanLink);
  }
  if (cleanLink.startsWith('docs/')) {
    return path.join(root, cleanLink);
  }
  return path.resolve(path.dirname(fromFile), cleanLink);
}

const errors: string[] = [];

for (const file of requiredFiles) {
  if (!exists(file)) {
    errors.push(`missing required file: se.architecture/${file}`);
  }
}

const projectDir = path.join(architectureRoot, 'project');
const instanceDir = fs.existsSync(projectDir) ? 'project' : 'project.template';
const projectArchitecture = path.join(architectureRoot, instanceDir, 'ARCHITECTURE.md');
if (fs.existsSync(projectArchitecture) && instanceDir === 'project') {
  const markdown = readText(projectArchitecture);
  for (const heading of projectRequiredHeadings) {
    if (!hasHeading(markdown, heading)) {
      errors.push(`${instanceDir}/ARCHITECTURE.md missing heading: ${heading}`);
    }
  }
}

const modulesDir = path.join(architectureRoot, instanceDir, 'modules');
if (!fs.existsSync(modulesDir)) {
  errors.push(`missing required directory: se.architecture/${instanceDir}/modules`);
} else {
  const moduleFiles = fs.readdirSync(modulesDir).filter((file) => file.endsWith('.md'));
  if (instanceDir === 'project') {
    if (moduleFiles.length === 0) {
      errors.push(`se.architecture/${instanceDir}/modules has no module documents`);
    }
    for (const file of moduleFiles) {
      const relative = `${instanceDir}/modules/${file}`;
      const markdown = readText(path.join(modulesDir, file));
      for (const heading of moduleRequiredHeadings) {
        if (!hasHeading(markdown, heading)) {
          errors.push(`${relative} missing heading: ${heading}`);
        }
      }
    }
  }
}

if (fs.existsSync(architectureRoot)) {
  for (const file of collectMarkdownFiles(architectureRoot)) {
    const markdown = readText(file);
    for (const link of extractMarkdownLinks(markdown)) {
      const target = resolveLink(file, link);
      if (!fs.existsSync(target)) {
        errors.push(`broken link in ${path.relative(root, file)}: ${link}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Architecture check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Architecture check passed.');
