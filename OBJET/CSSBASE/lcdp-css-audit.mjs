/**
 * LA CLÉ DU PARC — Audit anti-régression de la cascade CSS.
 * En développement uniquement : Node.js + postcss pour l’audit (npm install --no-save postcss). L’assemblage principal n’en dépend pas.
 * Aucun de ces outils n'est chargé dans le navigateur.
 *
 * Vérifications : CSS syntaxiquement valide, imports source dans l'ordre,
 * source DA unique, recouvrement entre propriétaires, nouveaux conflits de cascade,
 * régressions sur !important. Les conflits existants figurent dans le registre.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let postcss;
try { postcss = require('postcss'); }
catch { console.error('Installez postcss pour l\'audit : npm install --no-save postcss'); process.exit(2); }
const folder=path.dirname(fileURLToPath(import.meta.url));
const load=name=>fs.readFileSync(path.join(folder,name),'utf8');
const owner=JSON.parse(load('lcdp-css-ownership.json'));
const files=['lcdp-central-mobile-first','lcdp-da-membre','lcdp-mon-compte'];
const records={};const errors=[];
const normalized = value => value.replace(/\s+/g,' ').trim();
for(const filename of files){
 let root;
 try{root=postcss.parse(load(filename+'.css'),{from:filename+'.css'});}catch(err){errors.push(filename+': syntaxe invalide '+err.message);continue;}
 const selectors =new Map(), repeatedValues =new Set(), conflicts=new Set();
 const important={count:0};let declarations=0,rules=0;
 root.walkRules(rule=>{
  let ctx=[];
  for(let p=rule.parent;p&&p.type!=='root';p=p.parent)
   ctx.unshift(p.type==='atrule'?('@'+p.name+' '+normalized(p.params)):p.type+':'+p.selector);
  if(ctx.some(x=>x.includes('keyframes')))return;
  rules++;
  rule.walkDecls(decl=>{
   if(decl.parent!==rule)return;
   declarations++;if(decl.important)important.count++;
   const k=JSON.stringify([ctx,normalized(rule.selector),decl.prop.toLowerCase(),!!decl.important]);
   const entry=selectors.get(k);
   if(entry){
    if(entry!==normalized(decl.value))conflicts.add(JSON.stringify([k,entry,normalized(decl.value)]));
    else repeatedValues.add(k);
   }
   selectors.set(k,normalized(decl.value));
  });
 });
 records[filename]={rules,declarations,important:important.count,selectorKeys:new Set(selectors.keys()),conflicts, repeatedValues};
}
const expectedImports=owner.modules_central.map(x=>x.source);
const actualImports=expectedImports;
if(actualImports.length!==16)errors.push('16 modules attendus dans le registre de version');
if(actualImports.filter(x=>x==='lcdp-da-membre.css').length!==1)errors.push('source DA doit être incluse exactement une fois dans le registre');
for(const m of owner.modules_central){
 if(!fs.existsSync(path.join(folder,m.source)))errors.push('source manquante '+m.source);
 if(m.source!=='lcdp-da-membre.css'&&load(m.source).includes('#lcdp-da-membre-overlay-slot'))errors.push('DA dupliquée dans '+m.source);
}
// L'assemblage source est la validation de référence du CSS central.
const license='/*! tailwindcss v4.1.10 | MIT License | https://tailwindcss.com */\n';
const assembled=license+owner.modules_central.map(m=>m.source_unique?load(m.source).slice(license.length):load(m.source)).join('');
if(assembled!==load('lcdp-central-mobile-first.css'))errors.push("le CSS central ne correspond pas à l'assemblage des modules");
const overlapping={};
for(const name of ['lcdp-da-membre','lcdp-mon-compte']){
 const central=records['lcdp-central-mobile-first']?.selectorKeys||new Set();
 const other=records[name]?.selectorKeys||new Set();
 overlapping[name]=[...other].filter(key=>central.has(key)).sort();
}
const current={
  version:'2026-11-05-phase2',
  modules_central:actualImports.length,
  selectors_by_owner:Object.fromEntries(files.map(f=>[f,{rules:records[f]?.rules, declarations:records[f]?.declarations, important:records[f]?.important, duplicatedIdentical:records[f]?.repeatedValues.size, conflictingKeys:records[f]?.conflicts.size}])),
  conflict_keys:Object.fromEntries(files.map(f=>[f,[...(records[f]?.conflicts||[])].sort()])),
  overlaps:overlapping
};
const baselineName='lcdp-css-baseline.json';
if(process.argv.includes('--snapshot')){
 fs.writeFileSync(path.join(folder,baselineName),JSON.stringify(current,null,2)+'\n');
 console.log('Baseline enregistrée. Vérifier son contenu avant de l\'adopter.');
}else{
 if(!fs.existsSync(path.join(folder,baselineName)))errors.push('baseline manquante');
 else{
  const baseline=JSON.parse(load(baselineName));
  for(const f of files){
   const already=new Set(baseline.conflict_keys[f]||[]);
   const newConflicts=current.conflict_keys[f].filter(x=>!already.has(x));
   if(newConflicts.length)errors.push(f+': '+newConflicts.length+' nouveau(x) conflit(s) de cascade');
   if((current.selectors_by_owner[f].important||0)>(baseline.selectors_by_owner[f]?.important||0))errors.push(f+': augmentation de !important');
  }
  for(const f of ['lcdp-da-membre','lcdp-mon-compte']){
   const known=new Set(baseline.overlaps[f]||[]);
   const delta=overlapping[f].filter(x=>!known.has(x));
   if(delta.length)errors.push(f+': '+delta.length+' nouveau(x) chevauchement(s) avec le central');
  }
 }
}
for(const name of files){
 const r=records[name];if(!r)continue;
 console.log(`${name}.css : ${r.rules} règles, ${r.declarations} déclarations, ${r.important} !important, ${r.conflicts.size} conflits existants, ${r.repeatedValues.size} répétitions identiques`);
}
console.log(`Central : ${actualImports.length} sources CSS classiques dont la DA partagée ; CSS classique sans compilation Tailwind`);
if(errors.length){for(const e of errors) console.error('ÉCHEC : '+e);process.exit(1);}
console.log('AUDIT OK — aucun nouveau conflit, ordre des modules respecté.');
