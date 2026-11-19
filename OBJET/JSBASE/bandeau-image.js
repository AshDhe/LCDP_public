(() => {
  'use strict';
  const BASE='/IMAG/BANDEAU-IMAGE/';
  const MAX_IMAGES_BANDEAU=20;
  const states=new WeakMap();
  let inventaireEnCours, cssEnCours, ouvertureEnCours, galerieAutonome;
  const el=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e;};
  const objet=path=>{const cfg=window.SITE_CONFIG||{};return typeof cfg.objetUrl==='function'?cfg.objetUrl(path):'/OBJET'+path;};
  function nettoyer(zone){const state=states.get(zone);if(state){state.observer?.disconnect();state.arreterChargement?.();states.delete(zone);}if(state?.dialogue?.open){state.dialogue.close();document.documentElement.classList.remove('lcdp-bandeau-galerie-ouverte');}zone.replaceChildren();delete zone.dataset.chargement;}
  // Les emplacements sont réservés sans URL ; trois créneaux au maximum.
  function creerGalerie(images,zone=null,bouton=null){
    const MAX_SIMULTANES=3, AVANCE=.65;
    const dialogue=el('dialog','lcdp-bandeau-image__galerie');dialogue.setAttribute('aria-label','Galerie');
    const entete=el('div','lcdp-bandeau-image__galerie-entete'),titre=el('h2','lcdp-bandeau-image__galerie-titre'),fermer=el('button','lcdp-bandeau-image__galerie-fermer');
    const titres=el('div','lcdp-bandeau-image__galerie-titres'),legende=el('p','lcdp-bandeau-image__galerie-legende lcdp-text-muted');
    titre.textContent='Galerie';legende.textContent='Illustrations IA';titres.append(titre,legende);
    fermer.type='button';fermer.textContent='×';fermer.setAttribute('aria-label','Fermer la galerie');entete.append(titres,fermer);
    const liste=el('div','lcdp-bandeau-image__galerie-liste');dialogue.append(entete,liste);(zone||document.body).append(dialogue);
    let pauseAvant,focusAvant,emplacements=null,enCours=0,initial=false,quota=3,raf=null;
    function statut(message){
      const p=el('p','lcdp-bandeau-image__galerie-etat');p.setAttribute('role','status');p.textContent=message;liste.replaceChildren(p);
    }
    function definirImages(donnees){
      if(emplacements)return;
      if(!donnees.length){statut('Aucune image disponible.');return;}
      emplacements=donnees.map(im=>{
        const caseImage=el('div','lcdp-bandeau-image__galerie-emplacement');caseImage.dataset.etat='attente';
        return {im,caseImage,etat:'attente'};
      });
      liste.replaceChildren(...emplacements.map(item=>item.caseImage));
      if(dialogue.open)planifier();
    }
    function erreurInventaire(){if(!emplacements)statut('La galerie est momentanément indisponible.');}
    function planifier(){
      if(!dialogue.open||!emplacements||raf!==null)return;
      raf=window.requestAnimationFrame(()=>{raf=null;lancer();});
    }
    function lancer(){
      if(!dialogue.open||!emplacements||enCours>=MAX_SIMULTANES)return;
      let candidats;
      if(initial){
        const premiers=emplacements.slice(0,quota);
        if(premiers.every(item=>item.etat==='prete'||item.etat==='echec'))initial=false;
        else candidats=premiers.filter(item=>item.etat==='attente');
      }
      if(!initial){
        const cadre=liste.getBoundingClientRect(),hauteur=liste.clientHeight||cadre.height;
        if(!hauteur)return;
        const marge=hauteur*AVANCE;
        candidats=emplacements.filter(item=>item.etat==='attente').map(item=>{
          const r=item.caseImage.getBoundingClientRect();
          const visible=r.bottom>cadre.top&&r.top<cadre.bottom;
          const distance=Math.max(0,cadre.top-r.bottom,r.top-cadre.bottom);
          return {item,visible,distance};
        }).filter(c=>c.visible||c.distance<=marge)
          .sort((a,b)=>Number(b.visible)-Number(a.visible)||a.distance-b.distance).map(c=>c.item);
      }
      for(const item of candidats||[]){
        if(enCours>=MAX_SIMULTANES)break;
        charger(item);
      }
    }
    function charger(item){
      if(item.etat!=='attente')return;
      item.etat='chargement';item.caseImage.dataset.etat='chargement';enCours++;
      const img=el('img','lcdp-bandeau-image__galerie-photo');
      img.alt=String(item.im.alt||'');img.width=1672;img.height=941;
      // Seul le planificateur fixe les URL ; pas de requête native non contrôlée.
      img.loading='eager';img.decoding='async';img.fetchPriority='high';
      let termine=false;
      const fin=ok=>{
        if(termine)return;termine=true;img.onload=null;img.onerror=null;enCours--;
        item.etat=ok?'prete':'echec';item.caseImage.dataset.etat=item.etat;
        if(!ok){const texte=el('span');texte.textContent='Image indisponible';item.caseImage.replaceChildren(texte);}
        planifier();
      };
      img.onload=()=>fin(true);img.onerror=()=>fin(false);
      item.caseImage.replaceChildren(img);img.src=item.im.src;
    }
    function defilement(){initial=false;planifier();}
    function redimensionnement(){quota=window.matchMedia('(min-width: 1024px)').matches?6:3;initial=false;planifier();}
    liste.addEventListener('scroll',defilement,{passive:true});
    function ouvrir(focus=bouton||document.activeElement){
      if(dialogue.open)return;
      focusAvant=focus;
      if(zone){pauseAvant=zone.dataset.pause;zone.dataset.pause='true';}
      if(emplacements){
        for(const item of emplacements)if(item.etat==='echec'){
          item.etat='attente';item.caseImage.dataset.etat='attente';item.caseImage.replaceChildren();
        }
      }else statut('Chargement des images…');
      quota=window.matchMedia('(min-width: 1024px)').matches?6:3;initial=true;
      dialogue.showModal();document.documentElement.classList.add('lcdp-bandeau-galerie-ouverte');liste.scrollTop=0;fermer.focus();
      window.addEventListener('resize',redimensionnement,{passive:true});
      planifier();
    }
    fermer.addEventListener('click',()=>dialogue.close());
    dialogue.addEventListener('close',()=>{
      if(raf!==null){window.cancelAnimationFrame(raf);raf=null;}
      window.removeEventListener('resize',redimensionnement);
      document.documentElement.classList.remove('lcdp-bandeau-galerie-ouverte');
      if(zone)zone.dataset.pause=pauseAvant||'false';
      if(focusAvant?.isConnected)focusAvant.focus({preventScroll:true});
      // Les requêtes déjà lancées finissent, sans en lancer de nouvelles.
    });
    if(images)definirImages(images);
    return {dialogue,ouvrir,definirImages,erreurInventaire};
  }
  function ajouterGalerie(zone,images,commandes){
    if(!zone.hasAttribute('data-lcdp-bandeau-galerie'))return null;
    const bouton=el('button','lcdp-bandeau-image__galerie-bouton public-home__more');bouton.type='button';bouton.textContent='Galerie ';bouton.setAttribute('aria-haspopup','dialog');
    const fleche=el('span');fleche.textContent='›';fleche.setAttribute('aria-hidden','true');bouton.append(fleche);
    const galerie=creerGalerie(images,zone,bouton);
    commandes.prepend(bouton);bouton.addEventListener('click',()=>galerie.ouvrir(bouton));
    return galerie;
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
    const galerie=ajouterGalerie(zone,images,commandes);
    const arreterChargement=progressif
      ? chargerBandeauProgressif(zone,fenetre,groupe,piste,imagesBandeau,charges)
      : null;
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(remplir):null;
    observer?.observe(fenetre);states.set(zone,{observer,dialogue:galerie?.dialogue,galerie,arreterChargement});
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
      if(arrete||document.documentElement.classList.contains('lcdp-bandeau-galerie-ouverte'))return;
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
  function chargerInventaire(){
    if(!inventaireEnCours)inventaireEnCours=(async()=>{
      const r=await fetch(objet(BASE+'bandeau-image.json'),{cache:'no-cache'});
      if(!r.ok)throw Error('Inventaire indisponible');
      const data=await r.json();if(data.schema!==1||!Array.isArray(data.images))throw Error('Inventaire invalide');
      return data.images.map((im,i)=>({src:objet(BASE+'IMAG_'+(i+1)+'.webp'),alt:im.alt}));
    })().catch(e=>{inventaireEnCours=null;throw e;});
    return inventaireEnCours;
  }
  function chargerCssGalerie(){
    const href=new URL(objet('/CSSBASE/lcdp-bandeau-image.css?v=20261119-galerie-mobile'),document.baseURI);
    if([...document.querySelectorAll('link[rel="stylesheet"]')].some(lien=>{
      const url=new URL(lien.href,document.baseURI);
      return url.href===href.href&&lien.sheet;
    }))return Promise.resolve();
    if(!cssEnCours)cssEnCours=new Promise((resolve,reject)=>{
      const lien=el('link');lien.rel='stylesheet';lien.href=href.href;
      lien.onload=resolve;lien.onerror=()=>{lien.remove();reject(Error('Style de la galerie indisponible'));};
      document.head.append(lien);
    }).catch(e=>{cssEnCours=null;throw e;});
    return cssEnCours;
  }
  function ouvrirGalerie(focus=document.activeElement){
    if(ouvertureEnCours)return ouvertureEnCours;
    ouvertureEnCours=(async()=>{
      const zone=document.querySelector('[data-lcdp-bandeau-image-public][data-lcdp-bandeau-galerie]');
      let galerie=zone&&states.get(zone)?.galerie;
      if(!galerie){
        // CSS et inventaire en parallèle, sans attendre les images ni l'inventaire pour ouvrir.
        const inventaire=chargerInventaire();
        inventaire.catch(()=>{});
        await chargerCssGalerie();
        galerie=zone&&states.get(zone)?.galerie;
        if(!galerie){
          if(!galerieAutonome||!galerieAutonome.dialogue.isConnected)galerieAutonome=creerGalerie(null);
          galerie=galerieAutonome;
          galerie.ouvrir(focus);
          inventaire.then(galerie.definirImages,galerie.erreurInventaire);
          return;
        }
      }
      galerie.ouvrir(focus);
    })().finally(()=>{ouvertureEnCours=null;});
    return ouvertureEnCours;
  }
  async function init(){
    const zone=document.querySelector('[data-lcdp-bandeau-image-public]');if(!zone)return;
    try{
      const images=await chargerInventaire();
      if(images.length<8)return;
      rendre(zone,images);
    }catch(e){zone.hidden=true;console.warn('Bandeau image LCDP :',e);}
  }
  window.LCDP_BANDEAU_IMAGE=Object.freeze({rendre,nettoyer,ouvrirGalerie});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
