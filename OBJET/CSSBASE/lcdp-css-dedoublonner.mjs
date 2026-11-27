/** Déduplication prudente du CSS : aucun changement de valeurs ni réordonnancement.
 * Analyse autonome, sans dépendance. Par défaut : --check (aucune écriture).
 * --write : suppression des seules déclarations dont la couverture ultérieure est démontrée.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
function dedoublonner(s) {
  function parse(s) {
    const nodes=[], stack=[{nodes,st:0,decls:[]}]; let par=0,br=0,q="";
    function add(f,end){let a=f.st;while(a<end&&/\s/.test(s[a]))a++;const str=s.slice(a,end).trimEnd();if(!str||str.startsWith("/*"))return;f.decls.push({a,b:end,raw:str});}
    for(let i=0;i<s.length;i++){
      const c=s[i],n=s[i+1],f=stack.at(-1);
      if(q){if(c==="\\")i++;else if(c===q)q="";continue;}
      if(c==="/"&&n==="*"){const e=s.indexOf("*/",i+2);if(e<0)throw Error("Commentaire non fermé");if(!s.slice(f.st,i).trim())f.st=e+2;i=e+1;continue;}
      if(c==="'"||c==='"'){q=c;continue;} if(c==="\\"){i++;continue;}
      if(c==="(")par++;else if(c===")")par--;else if(c==="[")br++;else if(c==="]")br--;
      else if(!par&&!br){
        if(c==="{"){let a=f.st;while(a<i&&/\s/.test(s[a]))a++;const node={a,open:i,header:s.slice(a,i).trim(),nodes:[],decls:[]};f.nodes.push(node);stack.push({nodes:node.nodes,decls:node.decls,st:i+1,node});}
        else if(c==="}"){if(stack.length===1)throw Error("Accolade inattendue");add(f,i);f.node.b=i+1;stack.pop();stack.at(-1).st=i+1;}
        else if(c===";"){add(f,i+1);f.st=i+1;}
      }
      if(par<0||br<0)throw Error("Délimiteur inattendu");
    }
    if(stack.length!==1||q||par||br)throw Error("CSS non équilibré");
    return nodes;
  }
  function splitSelectors(s) {
    let a=0,par=0,br=0,q="",res=[];
    for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==="\\")i++;else if(c===q)q="";continue;}if(c==="\\"){i++;continue;}if(c==="\""||c==="'"){q=c;continue;}if(c==="(")par++;else if(c===")")par--;else if(c==="[")br++;else if(c==="]")br--;else if(c===","&&!par&&!br){res.push(s.slice(a,i).trim());a=i+1;}}
    res.push(s.slice(a).trim());return res;
  }
  // Une déclaration n'est supprimée que si une déclaration ultérieure de même
  // propriété et valeur exacte, même importance, couvre tous ses sélecteurs
  // dans les mêmes conditions ou des conditions moins restrictives.
  // Aucun raccourci sur les valeurs de repli, les variables, les animations,
  // les couches, les règles imbriquées ou les sélecteurs à spécificité différente.
  const nodes=parse(s), seen=new Map(), edits=[], proofs=[];
  let removedRules=0, removedDeclarations=0;
  const key=(sels,p,v)=>JSON.stringify([sels,p,v]);
  const match=(sels,p,v,ctx)=> (seen.get(key(sels,p,v))||[]).find(x=>x.ctx.every(c=>ctx.includes(c)));
  function visit(ns,ctx){
    for(let i=ns.length-1;i>=0;i--){
      const n=ns[i];
      if(/^@(media|supports)\b/.test(n.header)){visit(n.nodes,[...ctx,n.header.trim()]);continue;}
      if(n.header.startsWith("@")||n.nodes.length||!n.header||n.header.includes("/*"))continue;
      const sels=splitSelectors(n.header);if(sels.some(x=>!x))continue;
      const dead=[];
      for(let j=n.decls.length-1;j>=0;j--){
        const d=n.decls[j],m=d.raw.match(/^([-\w]+)\s*:\s*([\s\S]*?)\s*;?$/);
        if(!m||m[1].startsWith("--")||m[2].includes("/*"))continue;
        const p=m[1],v=m[2].trim();
        const identical=match(sels,p,v,ctx);
        const covering=identical?[identical]:sels.map(sel=>{
          const plain=sel.replace(/^:where\(html\[data-lcdp-css~="[^"]+"\]\)\s+/,"");
          return match([sel],p,v,ctx)||(plain!==sel&&!/^[>+~]/.test(plain)?match([plain],p,v,ctx):undefined);
        });
        if(covering.every(Boolean)){
          dead.push(d);removedDeclarations++;
          proofs.push({selector:n.header,property:p,value:v,at:d.a,coveredBy:covering.map(x=>x.at)});
        }else{
          const k=key(sels,p,v),list=seen.get(k)||[];
          list.push({ctx,at:d.a});seen.set(k,list);
        }
      }
      const body=s.slice(n.open+1,n.b-1);
      if(dead.length&&dead.length===n.decls.length&&!body.includes("/*")){
        edits.push([n.a,n.b]);removedRules++;
      }else for(const d of dead)edits.push([d.a,d.b]);
    }
  }
  visit(nodes,[]);
  edits.sort((a,b)=>a[0]-b[0]);let pos=0,out="";
  for(const [a,b] of edits){if(a<pos||b<a)throw Error("Suppressions chevauchantes");out+=s.slice(pos,a);pos=b;}
  out+=s.slice(pos);
  parse(out);
  return {css:out,removedDeclarations,removedRules,proofs,edits};
}
const mode=process.argv[2]||'--check';
if(!['--check','--write'].includes(mode))throw Error('Usage : node lcdp-css-dedoublonner.mjs --check|--write [fichier CSS]');
const file=process.argv[3]||path.join(path.dirname(fileURLToPath(import.meta.url)),'lcdp-central-mobile-first.css');
const source=fs.readFileSync(file,'utf8'), result=dedoublonner(source);
const twice=dedoublonner(result.css);
if(twice.removedDeclarations||twice.css!==result.css||result.proofs.some(p=>p.coveredBy.some(at=>at<=p.at)))throw Error('Contrôle de déduplication non satisfait');
console.log(JSON.stringify({fichier:file,declarations:result.removedDeclarations,regles:result.removedRules,octets_avant:Buffer.byteLength(source),octets_apres:Buffer.byteLength(result.css)},null,2));
if(mode==='--write'){if(result.css!==source){fs.writeFileSync(file+'.tmp',result.css,'utf8');fs.renameSync(file+'.tmp',file);}}else if(result.removedDeclarations){process.exitCode=1;}
