import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const root = process.cwd();
const testingProjectRoot = path.join(root, '.se', 'project', 'testing');
const intentionsDir = path.join(testingProjectRoot, 'intentions');
const specDirs = [
  path.join(testingProjectRoot, 'specs', 'api'),
  path.join(testingProjectRoot, 'specs', 'contract'),
  path.join(testingProjectRoot, 'specs', 'e2e'),
];
const requiredFields = ['name', 'version', 'priority', 'status', 'precondition', 'steps', 'assertions', 'edge_cases'];

type Intention = {
  name: string;
  version: number;
  priority: string;
  status: string;
  precondition: string;
  steps: string[];
  assertions: string[];
  edge_cases: string[];
};

function listFiles(dir: string, suffix: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(fullPath, suffix);
    }
    return entry.name.endsWith(suffix) ? [fullPath] : [];
  });
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const intentions = new Map<string, Intention>();
for (const file of listFiles(intentionsDir, '.yaml')) {
  const parsed = YAML.parse(fs.readFileSync(file, 'utf8')) as Partial<Intention>;
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      fail(`${file} missing required field ${field}`);
    }
  }
  if (!['P0', 'P1', 'P2'].includes(parsed.priority ?? '')) {
    fail(`${file} has invalid priority`);
  }
  if (!['draft', 'reviewed', 'active', 'needs_update', 'deprecated'].includes(parsed.status ?? '')) {
    fail(`${file} has invalid status`);
  }
  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    fail(`${file} must include steps`);
  }
  if (!Array.isArray(parsed.assertions) || parsed.assertions.length === 0) {
    fail(`${file} must include assertions`);
  }
  const basename = path.basename(file);
  intentions.set(basename, parsed as Intention);
}

const specFiles = specDirs.flatMap((dir) => listFiles(dir, '.ts'));
const boundIntentions = new Set<string>();
const headerPattern = /^\/\/ intention: ([\w.-]+\.yaml) \(v(\d+)\)/m;
for (const spec of specFiles) {
  const content = fs.readFileSync(spec, 'utf8');
  const match = content.match(headerPattern);
  if (!match) {
    fail(`${spec} missing intention header`);
  }
  const intention = intentions.get(match[1]);
  if (!intention) {
    fail(`${spec} references missing intention ${match[1]}`);
  }
  if (Number(match[2]) !== intention.version) {
    fail(`${spec} intention version mismatch: spec v${match[2]}, intention v${intention.version}`);
  }
  boundIntentions.add(match[1]);
}

for (const [file, intention] of intentions) {
  if (intention.status === 'active' && !boundIntentions.has(file)) {
    fail(`${file} is active but has no execution spec intention header`);
  }
}

console.log(`Validated ${intentions.size} intentions and ${specFiles.length} specs.`);
