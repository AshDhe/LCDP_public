(() => {
  'use strict';
  const cfg=window.SITE_CONFIG||{};
  const base=String(cfg.publicBaseUrl||window.SITE_BASE||'').replace(/\/$/,'');
  const url=p=>typeof cfg.publicUrl==='function'?cfg.publicUrl(p):base+p;
  const endpoint=String(cfg.workerEditingAdminUrl||cfg.WORKER_EDITING_ADMIN_URL||'').replace(/\/$/,'');
  function node(t,text,cls){const e=document.createElement(t);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
  function link(text,href,cls='lcdp-button lcdp-button-secondary'){const a=node('a',text,cls);a.href=href;return a;}
  const listeUrl=()=>url('/ESPACE-PUBLIC/actualites-liste.html');
  const articleUrl=id=>url('/ESPACE-PUBLIC/actualite.html?id='+encodeURIComponent(id));
  function imageUrl(p){return typeof cfg.objetUrl==='function'?cfg.objetUrl(p.replace(/^\/?OBJET\//,'')):url(p);}
  function image(a){const frame=node('div',null,'lcdp-box-carousel__viewport'),im=node('img',null,'lcdp-box-carousel__image');im.src=imageUrl(a.image);im.alt=a.alt||'';im.decoding='async';frame.append(im);return frame;}
  function texte(value){const box=node('div',null,'lcdp-boxtext__content');for(const paragraph of String(value||'').split(/\n\s*\n/)){const p=node('p');paragraph.split('\n').forEach((line,i)=>{if(i)p.append(node('br'));p.append(document.createTextNode(line));});box.append(p);}return box;}
  function contenu(a,popup=false){
    const article=node('article',null,'lcdp-stack');
    const title=node('h2',a.titre,'lcdp-box-carousel__title');
    if(popup)article.append(image(a),title);else {
      const more=link('derniers articles',listeUrl(),'lcdp-mention-connexion');
      // Les classes génériques fournissent la police et le corps secondaire.
      // Seuls l'alignement dans le titre et la couleur nécessitent ces valeurs.
      more.style.cssText='display:block;margin-top:.6rem;margin-bottom:1rem;font-family:var(--lcdp-font-main,Arial,sans-serif);font-size:1rem;font-weight:400;line-height:1.5;color:var(--lcdp-color-orange,#d97826);text-transform:none;letter-spacing:normal;text-decoration:none !important;border-bottom:0;box-shadow:none';
      title.append(more);
      article.append(title,image(a));
    }
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
    if(!articles.length)return;
    const slot=document.getElementById('lcdp-actualite-bandeau');if(!slot)return;
    const container=node('div',null,'lcdp-page-container'),width=node('div',null,'lcdp-page-content');
    const bar=node('nav',null,'lcdp-boxtext__text--center');bar.setAttribute('aria-label','Actualité');
    bar.style.cssText='display:flex;justify-content:center;align-items:center;text-align:center;min-height:2.5em;border:0;background:transparent;box-shadow:none';
    const a=link('',articleUrl(articles[0].id),'lcdp-link-secondary');
    a.style.cssText='display:block;max-width:100%;text-align:center;color:var(--lcdp-color-green,#57754c);border:0;outline-offset:4px;box-shadow:none;background:transparent;text-decoration:none;transform:none;animation:none;transition:none';
    const visible=node('span');visible.setAttribute('aria-hidden','true');a.append(visible);
    bar.append(a);width.append(bar);container.append(width);slot.replaceChildren(container);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let index=0,position=0,holding=false,timer,stopped=false;
    const letters=text=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('fr',{granularity:'grapheme'}).segment(text)].map(x=>x.segment):Array.from(text);
    let characters=[];
    function start(){
      const article=articles[index];characters=letters(String(article.titre));position=0;holding=false;
      a.href=articleUrl(article.id);a.setAttribute('aria-label',article.titre);visible.textContent='';
    }
    function tick(){
      if(stopped)return;
      if(document.hidden){timer=setTimeout(tick,100);return;}
      if(holding){index=(index+1)%articles.length;start();}
      if(reduced.matches){visible.textContent=characters.join('');position=characters.length;}
      else {position++;visible.textContent=characters.slice(0,position).join('');}
      holding=position>=characters.length;
      timer=setTimeout(tick,holding?1000:75);
    }
    start();tick();
    window.addEventListener('pagehide',()=>{stopped=true;clearTimeout(timer);},{once:true});
    window.addEventListener('pageshow',e=>{if(e.persisted){stopped=false;tick();}});
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
      if(!a){slot.append(node('p','Cette actualité n’est plus disponible.'),link('derniers articles',listeUrl(),'lcdp-link-secondary'));return;}
      const card=node('section',null,'lcdp-boxtext');card.append(contenu(a));slot.append(card);document.title='Actualité · '+a.titre+' - La Clé du Parc';
    }else{
      const list=node('div',null,'lcdp-stack');
      for(const a of articles.slice(0,10)){
        const row=node('div');row.append(link(a.titre,articleUrl(a.id),'lcdp-button lcdp-button-secondary'));
        row.firstChild.style.cssText='display:block;width:100%;box-sizing:border-box;text-align:center;justify-content:center;white-space:normal';list.append(row);
      }
      slot.append(list);
      if(!articles.length)slot.append(node('p','Aucune actualité publiée.'));
    }
    return;
  }
  bandeau(articles.slice(0,4));await popup(d,articles);
}
init().catch(e=>{console.error(e);const p=document.getElementById('lcdp-actualite-page');if(p)p.textContent='Les actualités sont momentanément indisponibles.';});
})();
