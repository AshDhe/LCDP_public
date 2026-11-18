(() => {
  'use strict';
  const BASE='/IMAG/BANDEAU-IMAGE/';
  const MAX_IMAGES_BANDEAU=20;
  const states=new WeakMap();
  const el=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e;};
  const objet=path=>{const cfg=window.SITE_CONFIG||{};return typeof cfg.objetUrl==='function'?cfg.objetUrl(path):'/OBJET'+path;};
  function nettoyer(zone){const state=states.get(zone);if(state){state.observer?.disconnect();state.arreterChargement?.();states.delete(zone);}if(state?.dialogue?.open){state.dialogue.close();document.documentElement.classList.remove('lcdp-bandeau-galerie-ouverte');}zone.replaceChildren();delete zone.dataset.chargement;}
  function ajouterGalerie(zone,images,commandes){
    if(!zone.hasAttribute('data-lcdp-bandeau-galerie'))return null;
    const bouton=el('button','lcdp-bandeau-image__galerie-bouton public-home__more');bouton.type='button';bouton.textContent='Galerie ';bouton.setAttribute('aria-haspopup','dialog');
    const fleche=el('span');fleche.textContent='›';fleche.setAttribute('aria-hidden','true');bouton.append(fleche);
    const dialogue=el('dialog','lcdp-bandeau-image__galerie');dialogue.setAttribute('aria-label','Galerie');
    const entete=el('div','lcdp-bandeau-image__galerie-entete'),titre=el('h2','lcdp-bandeau-image__galerie-titre'),fermer=el('button','lcdp-bandeau-image__galerie-fermer');
    const titres=el('div','lcdp-bandeau-image__galerie-titres'),legende=el('p','lcdp-bandeau-image__galerie-legende lcdp-text-muted');
    titre.textContent='Galerie';legende.textContent='Illustrations IA';titres.append(titre,legende);
    fermer.type='button';fermer.textContent='×';fermer.setAttribute('aria-label','Fermer la galerie');entete.append(titres,fermer);
    const liste=el('div','lcdp-bandeau-image__galerie-liste');dialogue.append(entete,liste);zone.append(dialogue);commandes.prepend(bouton);
    let pauseAvant;
    bouton.addEventListener('click',()=>{
      if(dialogue.open)return;
      if(!liste.childElementCount)for(const im of images){
        const img=el('img','lcdp-bandeau-image__galerie-photo');img.alt=String(im.alt||'');img.loading='lazy';img.decoding='async';img.width=1672;img.height=941;img.src=im.src;liste.append(img);
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
    // Seul le défilement est limité ; la galerie conserve l’inventaire complet.
    const imagesBandeau=images.slice(0,MAX_IMAGES_BANDEAU);
    const progressif=zone.hasAttribute('data-lcdp-bandeau-image-public');
    const charges=new Map();
    if(progressif)zone.dataset.chargement='true';
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    zone.dataset.pause=reduced?'true':'false';zone.dataset.mouvement='false';
    const fenetre=el('div','lcdp-bandeau-image__fenetre'),piste=el('div','lcdp-bandeau-image__piste');
    const groupe=el('div','lcdp-bandeau-image__groupe'),copie=el('div','lcdp-bandeau-image__groupe');
    copie.setAttribute('aria-hidden','true');
    const commandes=el('div','lcdp-bandeau-image__commandes');
    if(!zone.hasAttribute('data-lcdp-bandeau-galerie')){
      const pause=el('button','lcdp-bandeau-image__pause');pause.type='button';
      function label(){pause.textContent=zone.dataset.pause==='true'?'Reprendre le défilement':'Mettre le défilement en pause';}
      pause.onclick=()=>{const stop=zone.dataset.pause!=='true';zone.dataset.pause=String(stop);zone.dataset.mouvement='true';label();};
      label();commandes.append(pause);
    }
    piste.append(groupe,copie);fenetre.append(piste);zone.append(fenetre,commandes);
    const faireImage=(im,decorative)=>{
      const img=el('img','lcdp-bandeau-image__image');
      img.alt=decorative?'':String(im.alt||'');img.decoding='async';img.draggable=false;
      img.width=1672;img.height=941;
      if(!progressif||charges.get(im)==='prete')img.src=im.src;
      if(progressif){
        img.dataset.indexBandeau=String(imagesBandeau.indexOf(im));
        if(charges.get(im)==='echec')img.dataset.imageEchec='true';
      }
      return img;
    };
    groupe.append(faireImage(imagesBandeau[0],false));
    let repetitions=0;
    function remplir(){
      const size=parseFloat(getComputedStyle(zone).getPropertyValue('--lcdp-bandeau-espace'))||8;
      const sample=groupe.firstElementChild;
      const width=sample?.getBoundingClientRect().width||Math.max(72,Math.min(innerWidth*.12,144))*1672/941;
      const n=Math.max(1,Math.ceil(fenetre.clientWidth/(imagesBandeau.length*(width+size))));
      if(n!==repetitions){
        repetitions=n;groupe.replaceChildren();copie.replaceChildren();
        for(let k=0;k<n;k++)for(const im of imagesBandeau){
          const original=faireImage(im,k>0);if(k>0)original.setAttribute('aria-hidden','true');groupe.append(original);copie.append(faireImage(im,true));
        }
      }
      const distance=groupe.getBoundingClientRect().width;
      piste.style.setProperty('--lcdp-bandeau-duree',Math.max(8,distance/30)+'s');
    }
    remplir();
    const dialogue=ajouterGalerie(zone,images,commandes);
    const arreterChargement=progressif
      ? chargerBandeauProgressif(zone,fenetre,groupe,piste,imagesBandeau,charges)
      : null;
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(remplir):null;
    observer?.observe(fenetre);states.set(zone,{observer,dialogue,arreterChargement});
  }
  // Charger par ordre d’apparition, sans faire attendre toute la page.
  // Les deux groupes du défilement partagent les mêmes URL et le cache du navigateur.
  function chargerBandeauProgressif(zone,fenetre,groupe,piste,images,charges){
    const PARALLELE=3,PARALLELE_SUITE=2,MARGE=40;
    let prochain=0,enCours=0,arrete=false,minInitial=1,timer=null,observation=null;
    function nombreInitial(){
      const espace=parseFloat(getComputedStyle(zone).getPropertyValue('--lcdp-bandeau-espace'))||8;
      const largeur=groupe.firstElementChild?.getBoundingClientRect().width||Math.max(72,Math.min(innerWidth*.12,144))*1672/941;
      return Math.min(images.length,Math.max(1,Math.ceil((fenetre.clientWidth||innerWidth)/(largeur+espace))+1));
    }
    function verifierDefilement(){
      if(arrete)return;
      const i=images.findIndex(im=>!['prete','echec'].includes(charges.get(im)));
      if(i<0){
        zone.dataset.chargement='false';
        if(timer!==null){clearInterval(timer);timer=null;}
        return;
      }
      // À 30 px/s, la marge évite d’atteindre une image encore en cours de chargement.
      const suivant=groupe.children[i];
      const marge=suivant?suivant.getBoundingClientRect().left-fenetre.getBoundingClientRect().right:-Infinity;
      zone.dataset.chargement=String(i<minInitial||marge<=MARGE);
    }
    function terminerImage(im,index,etat){
      if(arrete)return;
      charges.set(im,etat);
      for(const img of piste.querySelectorAll('[data-index-bandeau="'+index+'"]')){
        if(etat==='prete')img.src=im.src;
        else img.dataset.imageEchec='true';
      }
      enCours--;
      verifierDefilement();lancer();
    }
    function charger(im,index,priorite){
      charges.set(im,'chargement');enCours++;
      const image=new Image();
      image.decoding='async';image.fetchPriority=priorite;
      let termine=false;
      const fin=etat=>{if(termine)return;termine=true;terminerImage(im,index,etat);};
      image.onerror=()=>fin('echec');
      image.onload=()=>{
        if(typeof image.decode==='function')image.decode().then(()=>fin('prete'),()=>fin('echec'));
        else fin('prete');
      };
      image.src=im.src;
    }
    function lancer(){
      if(arrete)return;
      minInitial=nombreInitial();
      const ouverture=document.body?.classList.contains('public-home--loading');
      // Avant la fin du spinner : seulement la portion visible et son avance.
      const limite=ouverture?minInitial:images.length;
      const parallele=prochain<minInitial?PARALLELE:PARALLELE_SUITE;
      while(prochain<limite&&enCours<parallele){
        const index=prochain++;
        charger(images[index],index,index<minInitial?'auto':'low');
      }
    }
    if(typeof MutationObserver==='function'&&document.body){
      observation=new MutationObserver(()=>{lancer();verifierDefilement();});
      observation.observe(document.body,{attributes:true,attributeFilter:['class']});
    }
    minInitial=nombreInitial();
    timer=setInterval(()=>{lancer();verifierDefilement();},120);
    lancer();verifierDefilement();
    return ()=>{
      arrete=true;observation?.disconnect();if(timer!==null)clearInterval(timer);
    };
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
