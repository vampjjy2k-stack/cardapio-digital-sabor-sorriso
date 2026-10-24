import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const version = (process.env.CF_PAGES_COMMIT_SHA || execFileSync(
  'git',
  ['rev-parse', 'HEAD'],
  { cwd: projectRoot, encoding: 'utf8' },
)).trim();

if (!/^[a-f0-9]{40}$/i.test(version)) {
  throw new Error('O identificador do build deve ser um SHA Git completo de 40 caracteres hexadecimais.');
}

const outputDir = process.env.SABOR_BUILD_OUTPUT_DIR
  ? path.resolve(process.env.SABOR_BUILD_OUTPUT_DIR)
  : path.join(projectRoot, 'public');
await mkdir(outputDir, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDir, 'build-info.js'), `window.SABOR_APP_VERSION = ${JSON.stringify(version)};\n`),
  writeFile(path.join(outputDir, 'version.json'), `${JSON.stringify({ version })}\n`),
]);

console.log(`Versão do site preparada: ${version}`);
