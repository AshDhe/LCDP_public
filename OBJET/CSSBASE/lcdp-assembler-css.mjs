/**
 * LA CLÉ DU PARC — Assemblage CSS classique, sans dépendance npm ou Tailwind.
 * Les modules doivent rester dans l'ordre exact défini dans le registre.
 * Usage : node lcdp-assembler-css.mjs --check | --write
 * Sortie : lcdp-central-mobile-first.css, à servir aux pages existantes.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=path.dirname(fileURLToPath(import.meta.url));
const mode=process.argv[2] || '--check';
if(!['--check','--write'].includes(mode)){
  console.error('Usage : node lcdp-assembler-css.mjs --check|--write');
  process.exit(2);
}
const read=(name)=>fs.readFileSync(path.join(folder,name),'utf8');
const owner=JSON.parse(read('lcdp-css-ownership.json'));
const prefix='/*! tailwindcss v4.1.10 | MIT License | https://tailwindcss.com */\n';
// Mention de licence conservée car les déclarations proviennent de la première compilation.
const modules=owner.modules_central.map(item=>{
  const src=read(item.source);
  // La DA est également un CSS autonome, dont l'en-tête doit être omis
  // lorsqu'on insère la même source dans le CSS central de compatibilité.
  if(item.source_unique){
    if(item.source!=='lcdp-da-membre.css')throw Error('Source canonique non reconnue : '+item.source);
    if(!src.startsWith(prefix))throw Error('En-tête de licence DA inattendu');
    return src.slice(prefix.length);
  }
  if(src.startsWith(prefix))throw Error('Une source de module ne doit pas contenir un en-tête de compilation : '+item.source);
  return src;
});
const compiled=prefix+modules.join('');
const target=path.join(folder,'lcdp-central-mobile-first.css');
if(mode==='--check'){
  const existing=fs.existsSync(target)?read('lcdp-central-mobile-first.css'):null;
  if(existing!==compiled){console.error('ÉCHEC : le central ne correspond pas à ses modules CSS.');process.exit(1)}
  console.log(`OK : ${modules.length} modules / central conforme, ${Buffer.byteLength(compiled)} octets.`);
}else{
  // Sécurité : la version centrale publiée contient des règles historiques qui
  // ne figurent pas toutes dans les modules extraits. Ne JAMAIS les écraser.
  // Avant un nouvel assemblage complet, réconcilier les sources et le central.
  const existing=fs.existsSync(target)?read('lcdp-central-mobile-first.css'):null;
  if(existing!==null && existing!==compiled){
    console.error('ÉCRITURE BLOQUÉE : le central contient des règles absentes de l’assemblage. Aucune modification du fichier.');
    process.exit(1);
  }
  const tmp=target+'.tmp';
  fs.writeFileSync(tmp,compiled,'utf8');
  fs.renameSync(tmp,target);
  console.log(`GÉNÉRÉ : lcdp-central-mobile-first.css (${modules.length} sources, aucun outil CSS externe).`);
}
