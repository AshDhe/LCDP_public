(() => {
'use strict';
const cfg=window.SITE_CONFIG||{};
const base=String(cfg.publicBaseUrl||window.SITE_BASE||'').replace(/\/$/,'');
const url=p=>typeof cfg.publicUrl==='function'?cfg.publicUrl(p):base+p;
const endpoint=String(cfg.workerEditingAdminUrl||cfg.WORKER_EDITING_ADMIN_URL||'').replace(/\/$/,'');
function node(t,text){const e=document.createElement(t);if(text)e.textContent=text;return e;}
function link(text,href){const a=node('a',text);a.href=href;return a;}
const articleUrl=id=>url('/ESPACE-PUBLIC/actualite.html?id='+encodeURIComponent(id));
function imageUrl(p){return typeof cfg.objetUrl==='function'?cfg.objetUrl(p.replace(/^\/?OBJET\//,'')):url(p);}
function contenu(a){
 const article=node('article');article.className='lcdp-actu-article';
 const h=node('header');h.className='lcdp-actu-header';h.append(node('h2',a.titre));
 const frame=node('div');frame.className='lcdp-actu-image-frame';const im=node('img');im.className='lcdp-actu-image';im.src=imageUrl(a.image);im.alt=a.alt;im.decoding='async';frame.append(im);
 const text=node('div',a.texte);text.className='lcdp-actu-texte';
 article.append(h,frame,text,link('Contact',url('/ESPACE-PUBLIC/contact.html')));return article;
}
function modal(content,onClose){
 const previous=document.activeElement,root=node('div'),card=node('div'),close=node('button','×');root.className='lcdp-actu-modal';card.className='lcdp-actu-modal-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Actualité');close.className='lcdp-actu-fermer';close.type='button';close.setAttribute('aria-label','Fermer');card.append(close,content);root.append(card);
 const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 let closed=false;
 function finish(){if(closed)return;closed=true;document.removeEventListener('keydown',keyboard);root.remove();document.body.style.overflow=oldOverflow;previous?.focus();onClose?.();}
 function keyboard(e){if(e.key==='Escape'){e.preventDefault();finish();}if(e.key==='Tab'){const fs=[...card.querySelectorAll('button,a[href],input')].filter(x=>!x.disabled);const first=fs[0],last=fs[fs.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
 close.onclick=finish;root.onclick=e=>{if(e.target===root)finish();};document.addEventListener('keydown',keyboard);document.body.append(root);close.focus();return finish;
}
function rappel(){const box=node('div'),p=node('p','Ouvrez un compte dans l’application et ne réaffichez plus les pop-up'),ok=node('button','OK');ok.className='lcdp-button';box.append(p,ok);const close=modal(box);ok.onclick=close;}
function bandeau(articles){
 if(!articles.length)return;const slot=document.getElementById('lcdp-actualite-bandeau');if(!slot)return;
 const bar=node('nav');bar.className='lcdp-actu-bandeau';bar.setAttribute('aria-label','Dernières actualités');const a=link('',articleUrl(articles[0].id));bar.append(a);slot.append(bar);let i=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const display=()=>{a.textContent=articles[i].titre+' — Lire →';a.href=articleUrl(articles[i].id);bar.classList.remove('is-changing');void bar.offsetWidth;bar.classList.add('is-changing');};display();
 if(articles.length>1){const next=node('button','Suivante'),pause=node('button',paused?'Reprendre':'Pause');next.type=pause.type='button';next.onclick=()=>{i=(i+1)%articles.length;display();};pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Reprendre':'Pause';};bar.append(next,pause);const timer=setInterval(()=>{if(!paused&&!document.hidden&&!bar.matches(':hover')&&!bar.contains(document.activeElement)){i=(i+1)%articles.length;display();}},6000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});}
}
async function popup(data,articles){
 const a=articles.find(a=>a.id===data.popupId);if(!a)return;
 const response=await fetch(url('/__lcdp-public-context'),{credentials:'include',cache:'no-store'});if(!response.ok)return;const ctx=await response.json();if(typeof ctx.userapp!=='boolean')return;
 const key='lcdp-actualite-vue:'+a.id+':'+(data.popupRevision||a.datepublication);
 if(ctx.userapp){try{if(localStorage.getItem(key))return;}catch(_){}}
 else {
   const api=String(cfg.workerIndexMembreUrl||cfg.WORKER_INDEX_MEMBRE_URL||(typeof cfg.apiUrl==='function'?cfg.apiUrl('index-membre-api'):'')).replace(/\/$/,'');if(!api)return;
   const r=await fetch(api+'/index',{credentials:'include',cache:'no-store'});
   if(r.ok){const s=await r.json();if(s.connected===true)return;if(s.success!==true||s.connected!==false)return;}
   else if(r.status!==401)return;
 }
 // Ne pas écraser une interaction déjà ouverte pendant le chargement.
 if(document.querySelector('[role="dialog"], [aria-modal="true"]'))return;
 modal(contenu(a),()=>{if(!ctx.userapp)rappel();});
 if(ctx.userapp){try{localStorage.setItem(key,'1');}catch(_){}}
}
async function init(){
 if(!endpoint)throw Error('API Actualité non configurée.');
 const r=await fetch(endpoint+'/public/actualite',{cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Actualités indisponibles.');const d=await r.json();
 const articles=(d.slides||[]).filter(a=>a.active&&a.titre&&a.texte).sort((a,b)=>Date.parse(b.datepublication||0)-Date.parse(a.datepublication||0)||a.id.localeCompare(b.id));
 const slot=document.getElementById('lcdp-actualite-page');
 if(slot){const id=new URLSearchParams(location.search).get('id');slot.replaceChildren();if(id){const a=articles.find(a=>a.id===id);if(!a){slot.append(node('p','Cette actualité n’est plus disponible.'),link('Toutes les actualités',url('/ESPACE-PUBLIC/actualite.html')));return;}
 const content=contenu(a),header=content.querySelector('header'),title=header.querySelector('h2'),h1=node('h1',title.textContent);title.replaceWith(h1);header.append(link('Toutes les actualités',url('/ESPACE-PUBLIC/actualite.html')));slot.append(content);document.title=a.titre+' - La Clé du Parc';
 }else{slot.append(node('h1','Actualité'));const list=node('ul');list.className='lcdp-actu-liste';for(const a of articles){const li=node('li');li.append(link(a.titre,articleUrl(a.id)));list.append(li);}slot.append(list);if(!articles.length)slot.append(node('p','Aucune actualité publiée.'));}return;}
 bandeau(articles.slice(0,4));await popup(d,articles);
}
init().catch(e=>{console.error(e);const p=document.getElementById('lcdp-actualite-page');if(p)p.textContent='Les actualités sont momentanément indisponibles.';});
})();
