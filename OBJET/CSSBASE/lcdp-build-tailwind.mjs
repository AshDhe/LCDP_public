/**
 * Compatibilité avec la commande historique de compilation.
 * Depuis la phase 2, la source officielle est constituée des modules CSS
 * classiques et l'assemblage n'utilise plus Tailwind ni de paquet npm.
 * Ce relais empêche l'ancien workflow de réécraser les correctifs modulaires.
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const filename=fileURLToPath(import.meta.url);
const assembler=path.join(path.dirname(filename),'lcdp-assembler-css.mjs');
const argument=process.argv[2]||'--check';
console.warn('LCDP : commande historique redirigée vers l’assemblage CSS standard (sans Tailwind).');
const result=spawnSync(process.execPath,[assembler,argument],{stdio:'inherit'});
if(result.error){console.error(result.error);process.exit(1);}
process.exit(result.status===null?1:result.status);
