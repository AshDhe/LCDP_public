/**
 * LA CLÉ DU PARC — compilation Tailwind CSS v4.1.10.
 * Usage depuis OBJET/CSSBASE :
 *   npm install --no-save tailwindcss@4.1.10
 *   node lcdp-build-tailwind.mjs --check   (vérifie sans modifier)
 *   node lcdp-build-tailwind.mjs --write   (compile et remplace les 3 CSS livrés)
 * Le site continue de charger exclusivement les CSS classiques compilés.
 * Aucun reset Tailwind ni utilisation de CDN côté navigateur.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { compile } = require('tailwindcss');
const directory = path.dirname(fileURLToPath(import.meta.url));
const names = ['lcdp-central-mobile-first', 'lcdp-da-membre', 'lcdp-mon-compte'];
const action = process.argv[2] || '--check';
if (!['--check','--write'].includes(action)) {
  console.error('Utilisation : node lcdp-build-tailwind.mjs --check|--write');
  process.exit(2);
}
async function loadStylesheet(id, base) {
  const filename = id === 'tailwindcss'
    ? require.resolve('tailwindcss/index.css')
    : id.startsWith('tailwindcss/')
      ? require.resolve(id)
      : path.resolve(base, id);
  return { content: fs.readFileSync(filename, 'utf8'), base: path.dirname(filename) };
}
let errors = 0;
for (const name of names) {
  const sourcePath = path.join(directory, `${name}.tailwind.css`);
  const outputPath = path.join(directory, `${name}.css`);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const compiled = await compile(source, { base: directory, loadStylesheet });
  const css = compiled.build([]);
  if (action === '--check') {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    const equal = existing === css;
    console.log(`${equal ? 'OK' : 'DIFF'}  ${name}.css`);
    if (!equal) errors++;
  } else {
    const tmp = `${outputPath}.tmp`;
    fs.writeFileSync(tmp, css, 'utf8');
    fs.renameSync(tmp, outputPath);
    console.log(`GÉNÉRÉ  ${name}.css`);
  }
}
if (errors) process.exit(1);
