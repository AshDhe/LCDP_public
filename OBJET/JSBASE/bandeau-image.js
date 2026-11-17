(() => {
  'use strict';
  const BASE='/IMAG/BANDEAU-IMAGE/';
  const states=new WeakMap();
  const el=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e;};
  const objet=path=>{const cfg=window.SITE_CONFIG||{};return typeof cfg.objetUrl==='function'?cfg.objetUrl(path):'/OBJET'+path;};
  function nettoyer(zone){const state=states.get(zone);if(state){state.observer?.disconnect();states.delete(zone);}if(state?.dialogue?.open){state.dialogue.close();document.documentElement.classList.remove('lcdp-bandeau-galerie-ouverte');}zone.replaceChildren();}
  function ajouterGalerie(zone,images,commandes){
    if(!zone.hasAttribute('data-lcdp-bandeau-galerie'))return null;
    const bouton=el('button','lcdp-bandeau-image__galerie-bouton');bouton.type='button';bouton.textContent='Galerie';bouton.setAttribute('aria-haspopup','dialog');
    const dialogue=el('dialog','lcdp-bandeau-image__galerie');dialogue.setAttribute('aria-label','Galerie');
    const entete=el('div','lcdp-bandeau-image__galerie-entete'),titre=el('h2','lcdp-bandeau-image__galerie-titre'),fermer=el('button','lcdp-bandeau-image__galerie-fermer');
    titre.textContent='Galerie';fermer.type='button';fermer.textContent='×';fermer.setAttribute('aria-label','Fermer la galerie');entete.append(titre,fermer);
    const liste=el('div','lcdp-bandeau-image__galerie-liste');dialogue.append(entete,liste);zone.append(dialogue);commandes.prepend(bouton);
    let pauseAvant;
    bouton.addEventListener('click',()=>{
      if(dialogue.open)return;
      if(!liste.childElementCount)for(const im of images){
        const img=el('img','lcdp-bandeau-image__galerie-photo');img.src=im.src;img.alt=String(im.alt||'');img.loading='lazy';img.decoding='async';liste.append(img);
      }
      pauseAvant=zone.dataset.pause;zone.dataset.pause='true';
      dialogue.showModal();document.documentElement.classList.add('lcdp-bandeau-galerie-ouverte');liste.scrollTop=0;fermer.focus();
    });
    fermer.addEventListener('click',()=>dialogue.close());
    dialogue.addEventListener('close',()=>{document.documentElement.classList.remove('lcdp-bandeau-galerie-ouverte');zone.dataset.pause=pauseAvant||'false';bouton.focus();});
    return dialogue;
  }
  function rendre(zone,images){
    nettoyer(zone);zone.classList.add('lcdp-bandeau-image');
    zone.hidden=!images.length;if(!images.length)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    zone.dataset.pause=reduced?'true':'false';zone.dataset.mouvement='false';
    const fenetre=el('div','lcdp-bandeau-image__fenetre'),piste=el('div','lcdp-bandeau-image__piste');
    const groupe=el('div','lcdp-bandeau-image__groupe'),copie=el('div','lcdp-bandeau-image__groupe');
    copie.setAttribute('aria-hidden','true');
    const commandes=el('div','lcdp-bandeau-image__commandes'),pause=el('button','lcdp-bandeau-image__pause');pause.type='button';
    function label(){pause.textContent=zone.dataset.pause==='true'?'Reprendre le défilement':'Mettre le défilement en pause';}
    pause.onclick=()=>{const stop=zone.dataset.pause!=='true';zone.dataset.pause=String(stop);zone.dataset.mouvement='true';label();};
    label();commandes.append(pause);piste.append(groupe,copie);fenetre.append(piste);zone.append(fenetre,commandes);
    const faireImage=(im,decorative)=>{const img=el('img','lcdp-bandeau-image__image');img.src=im.src;img.alt=decorative?'':String(im.alt||'');img.decoding='async';img.draggable=false;return img;};
    groupe.append(faireImage(images[0],false));
    let repetitions=0;
    function remplir(){
      const size=parseFloat(getComputedStyle(zone).getPropertyValue('--lcdp-bandeau-espace'))||8;
      const sample=groupe.firstElementChild;
      const width=sample?.getBoundingClientRect().width||Math.max(72,Math.min(innerWidth*.12,144));
      const n=Math.max(1,Math.ceil(fenetre.clientWidth/(images.length*(width+size))));
      if(n!==repetitions){
        repetitions=n;groupe.replaceChildren();copie.replaceChildren();
        for(let k=0;k<n;k++)for(const im of images){
          const original=faireImage(im,k>0);if(k>0)original.setAttribute('aria-hidden','true');groupe.append(original);copie.append(faireImage(im,true));
        }
      }
      const distance=groupe.getBoundingClientRect().width;
      piste.style.setProperty('--lcdp-bandeau-duree',Math.max(8,distance/30)+'s');
    }
    remplir();
    const dialogue=ajouterGalerie(zone,images,commandes);
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(remplir):null;
    observer?.observe(fenetre);states.set(zone,{observer,dialogue});
  }
  async function init(){
    const zone=document.querySelector('[data-lcdp-bandeau-image-public]');if(!zone)return;
    try{
      const r=await fetch(objet(BASE+'bandeau-image.json'),{cache:'no-cache'});
      if(!r.ok)throw Error('Inventaire indisponible');
      const data=await r.json();if(data.schema!==1||!Array.isArray(data.images))throw Error('Inventaire invalide');
      if(data.images.length<8)return;
      rendre(zone,data.images.map((im,i)=>({src:objet(BASE+'IMAG_'+(i+1)+'.webp'),alt:im.alt})));
    }catch(e){zone.hidden=true;console.warn('Bandeau image LCDP :',e);}
  }
  window.LCDP_BANDEAU_IMAGE=Object.freeze({rendre,nettoyer});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
