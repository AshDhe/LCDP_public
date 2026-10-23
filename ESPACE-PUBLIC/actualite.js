(() => {
  'use strict';
  const cfg=window.SITE_CONFIG||{};
  const base=String(cfg.publicBaseUrl||window.SITE_BASE||'').replace(/\/$/,'');
  const url=p=>typeof cfg.publicUrl==='function'?cfg.publicUrl(p):base+p;
  const endpoint=String(cfg.workerEditingAdminUrl||cfg.WORKER_EDITING_ADMIN_URL||'').replace(/\/$/,'');
  function node(t,text,cls){const e=document.createElement(t);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
  function link(text,href,cls='lcdp-button lcdp-button-secondary'){const a=node('a',text,cls);a.href=href;return a;}
  const articleUrl=id=>url('/ESPACE-PUBLIC/actualite.html?id='+encodeURIComponent(id));
  function imageUrl(p){return typeof cfg.objetUrl==='function'?cfg.objetUrl(p.replace(/^\/?OBJET\//,'')):url(p);}
  function image(a){const frame=node('div',null,'lcdp-box-carousel__viewport'),im=node('img',null,'lcdp-box-carousel__image');im.src=imageUrl(a.image);im.alt=a.alt||'';im.decoding='async';frame.append(im);return frame;}
  function texte(value){const box=node('div',null,'lcdp-boxtext__content');for(const paragraph of String(value||'').split(/\n\s*\n/)){const p=node('p');paragraph.split('\n').forEach((line,i)=>{if(i)p.append(node('br'));p.append(document.createTextNode(line));});box.append(p);}return box;}
  function contenu(a,popup=false){
    const article=node('article',null,'lcdp-stack');
    const title=node('h2',a.titre,'lcdp-box-carousel__title');
    if(popup)article.append(image(a),title);else article.append(title,image(a));
    article.append(texte(a.texte));
    if(!popup && a.contact)article.append(node('p',a.contact,'lcdp-text-strong-left'));
    return article;
  }
  async function modal(content,onClose){
    const previous=document.activeElement,dialog=node('dialog',null,'lcdp-contact-info');
    dialog.setAttribute('aria-label','Actualité');
    const close=node('button','×','lcdp-box-dialogue-bouton__close');close.type='button';close.setAttribute('aria-label','Fermer');
    const inner=node('div',null,'lcdp-box-formulaire-page lcdp-box-formulaire-page--compact');
    const card=node('div',null,'lcdp-box-formulaire-page__inner lcdp-stack');card.append(content);inner.append(card);dialog.append(close,inner);
    let finished=false;
    function finish(){if(finished)return;finished=true;dialog.close();dialog.remove();previous?.focus();onClose?.();}
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)finish();}});
    close.onclick=finish;document.body.append(dialog);dialog.showModal();close.focus();return finish;
  }
  async function rappel(){
    const box=node('div',null,'lcdp-stack'),p=node('p','Ouvrez un compte dans l’application et ne réaffichez plus les pop-up','lcdp-box-dialogue-bouton__text'),actions=node('div',null,'lcdp-box-formulaire__actions'),ok=node('button','OK','lcdp-button');ok.type='button';actions.append(ok);box.append(p,actions);const close=await modal(box);ok.onclick=close;
  }
  function bandeau(articles){
    if(!articles.length)return;const slot=document.getElementById('lcdp-actualite-bandeau');if(!slot)return;
    const container=node('div',null,'lcdp-page-container'),width=node('div',null,'lcdp-page-content'),bar=node('nav',null,'lcdp-stack-small');bar.setAttribute('aria-label','Actualité');
    const a=link(articles[0].titre+' ↗',articleUrl(articles[0].id));a.setAttribute('aria-label',articles[0].titre);bar.append(a);width.append(bar);container.append(width);slot.replaceChildren(container);
    let i=0,transition=false;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    async function avancer(){
      if(transition||document.hidden||bar.matches(':hover')||bar.contains(document.activeElement)||document.querySelector('dialog[open]'))return;
      if(reduced.matches)return;
      transition=true;
      try{
        await a.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-65%)',opacity:0}],{duration:260,easing:'ease-in'}).finished;
        i=(i+1)%articles.length;a.textContent=articles[i].titre+' ↗';a.href=articleUrl(articles[i].id);a.setAttribute('aria-label',articles[i].titre);
        await a.animate([{transform:'translateY(65%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:320,easing:'ease-out'}).finished;
      }catch(_){}finally{transition=false;}
    }
    if(articles.length>1){const timer=setInterval(avancer,6000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});}
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
 if(document.querySelector('dialog[open], [role="dialog"], [aria-modal="true"]'))return;
 await modal(contenu(a,true),()=>{if(!ctx.userapp)rappel();});
 if(ctx.userapp){try{localStorage.setItem(key,'1');}catch(_){}}
}
async function init(){
  if(!endpoint)throw Error('API Actualité non configurée.');
  const r=await fetch(endpoint+'/public/actualite',{cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Actualité indisponible.');const d=await r.json();
  const articles=(d.slides||[]).filter(a=>a.active&&a.titre&&a.texte).sort((a,b)=>Date.parse(b.datepublication||0)-Date.parse(a.datepublication||0)||a.id.localeCompare(b.id));
  const slot=document.getElementById('lcdp-actualite-page');
  if(slot){
    const id=new URLSearchParams(location.search).get('id');slot.replaceChildren();slot.className='lcdp-stack-large';
    if(id){
      const a=articles.find(a=>a.id===id);
      const actions=node('nav',null,'lcdp-box-formulaire__actions');actions.setAttribute('aria-label','Navigation Actualité');actions.append(link('Sommaire',url('/ESPACE-PUBLIC/actualite.html')));
      if(!a){slot.append(node('p','Cette actualité n’est plus disponible.'),actions);return;}
      const card=node('section',null,'lcdp-boxtext');card.append(contenu(a),actions);slot.append(card);document.title='Actualité · '+a.titre+' - La Clé du Parc';
    }else{
      for(const a of articles){const card=node('article',null,'lcdp-boxtext'),h=node('h2',a.titre,'lcdp-boxtext__title'),actions=node('div',null,'lcdp-box-formulaire__actions');actions.append(link('Lire l’article',articleUrl(a.id)));card.append(h,actions);slot.append(card);}
      if(!articles.length)slot.append(node('p','Aucune actualité publiée.'));
    }
    return;
  }
  bandeau(articles.slice(0,4));await popup(d,articles);
}
init().catch(e=>{console.error(e);const p=document.getElementById('lcdp-actualite-page');if(p)p.textContent='Les actualités sont momentanément indisponibles.';});
})();
