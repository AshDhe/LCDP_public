/* Objet partagé : envoi des formulaires publics protégés, sans style propre. */
(() => {
 'use strict';
 let chargementTurnstile;
 function chargerTurnstile(){
  if(window.turnstile)return Promise.resolve();
  if(!chargementTurnstile)chargementTurnstile=new Promise((resolve,reject)=>{
   const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;
   s.onload=()=>window.turnstile?resolve():reject(new Error('Vérification indisponible.'));
   s.onerror=()=>{s.remove();chargementTurnstile=null;reject(new Error('Vérification indisponible. Réessayez.'));};document.head.appendChild(s);
  });return chargementTurnstile;
 }
 async function message(texte, options = {}) {
  const slot = document.getElementById('lcdp-lightbox-slot');
  const retourAccueil = options.retourAccueil === true;
  let zone;
  let dialog;
  const focusInitial = document.activeElement;
  try {
   if (!slot) throw new Error('Emplacement du dialogue indisponible.');
   const config = window.SITE_CONFIG || {};
   const base = String(config.objetBaseUrl || config.OBJET_BASE || ((window.SITE_BASE || '') + '/OBJET')).replace(/\/$/,'');
   const objet = chemin => base ? base + chemin : '../OBJET' + chemin;
   const css = objet('/CSSBASE/lcdp-lightbox-convergence.css');
   if (![...document.querySelectorAll('link[rel="stylesheet"]')]
    .some(lien => lien.href === new URL(css, document.baseURI).href)) {
    await new Promise((resolve,reject) => {
     const lien = document.createElement('link');
     lien.rel = 'stylesheet';
     lien.href = css;
     lien.onload = resolve;
     lien.onerror = () => {lien.remove();reject(new Error('CSS de convergence indisponible.'));};
     document.head.appendChild(lien);
    });
   }
   const chemin = retourAccueil ? '/HTMLBASE/02-dialogue-reference-choix.html'
                               : '/HTMLBASE/02-dialogue-reference-information.html';
   const r = await fetch(objet(chemin), { credentials:'same-origin' });
   if (!r.ok) throw new Error('Dialogue de confirmation indisponible.');
   const template = document.createElement('template');
   template.innerHTML = (await r.text()).trim();
   // Le dialogue reste superposé au formulaire sans détruire son contenu.
   zone = document.createElement('div');
   zone.append(template.content.cloneNode(true));
   dialog = zone.querySelector(retourAccueil
    ? '[data-lcdp-dialogue-reference="choix"]'
    : '[data-lcdp-dialogue-reference="information"]');
   const titre = dialog?.querySelector('[data-lcdp-dialogue-titre]');
   const cible = dialog?.querySelector('[data-lcdp-dialogue-message]');
   const boutonOk = dialog?.querySelector(retourAccueil
    ? '[data-lcdp-dialogue-action="confirmer"]'
    : '[data-lcdp-dialogue-action="compris"]');
   const boutonFermer = retourAccueil ? dialog?.querySelector('[data-lcdp-dialogue-action="annuler"]') : null;
   if (!dialog || !titre || !cible || !boutonOk || (retourAccueil && !boutonFermer)) {
    throw new Error('Structure du dialogue de référence incomplète.');
   }
   titre.textContent = 'Demande enregistrée';
   cible.textContent = texte || '';
   boutonOk.textContent = 'OK';
   if (boutonFermer) boutonFermer.textContent = 'Fermer';
   slot.append(zone);
   return await new Promise(resolve => {
    let termine = false;
    const fermer = valeur => {
     if (termine) return;
     termine = true;
     document.removeEventListener('keydown',clavier);
     zone.remove();
     if (focusInitial?.isConnected && typeof focusInitial.focus === 'function') focusInitial.focus();
     resolve(valeur);
    };
    const clavier = event => {
     if (event.key === 'Escape') {event.preventDefault();fermer(false);}
     if (retourAccueil && event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === boutonFermer) {
       event.preventDefault();boutonOk.focus();
      } else if (!event.shiftKey && document.activeElement === boutonOk) {
       event.preventDefault();boutonFermer.focus();
      }
     }
    };
    boutonOk.addEventListener('click',()=>fermer(true),{once:true});
    boutonFermer?.addEventListener('click',()=>fermer(false),{once:true});
    dialog.addEventListener('click',event=>{if(event.target===dialog)fermer(false);});
    document.addEventListener('keydown',clavier);
    boutonOk.focus();
   });
  } catch (erreur) {
   zone?.remove();
   console.error('Dialogue de confirmation formulaire indisponible :',erreur);
   window.alert(texte);
   // Une ressource indisponible ne déclenche jamais de redirection sans validation.
   return false;
  }
 }
 window.LCDP_brancherFormulaireProtege=async function(form,config){
  if(form.dataset.protege==='true')return;form.dataset.protege='true';
  const bouton=form.querySelector('[type="submit"]');if(!bouton)throw new Error('Bouton absent.');
  for(const champ of config.champs){
   const field=form.elements.namedItem(champ.name);if(!field)continue;
   field.required=true;
   if(/^(?:nomresp|prenomresp|nomcoach|prenomcoach|nom|prenom)$/.test(champ.name))field.pattern="[\\p{L}\\p{M}][\\p{L}\\p{M} '\u2019.\\-]*";
  }
  const statut=document.createElement('p');statut.className='lcdp-box-formulaire__note';statut.setAttribute('role','status');form.append(statut);
  const widget=document.createElement('div');form.querySelector('[data-lcdp-formulaire-actions]')?.before(widget);
  if(!widget.isConnected)bouton.before(widget);
  // Indicateur limité aux contacts parc et coach, sans changement des autres formulaires.
  let attenteVerification=null,delaiVerification=null,libelleVerification=null;
  const ariaLabelInitial=bouton.getAttribute('aria-label');
  if(['coach','resparc'].includes(config.type)){
   libelleVerification=document.createElement('span');
   while(bouton.firstChild)libelleVerification.append(bouton.firstChild);
   bouton.append(libelleVerification);
   bouton.style.position='relative';
   attenteVerification=document.createElement('span');
   attenteVerification.style.position='absolute';
   attenteVerification.style.left='50%';
   attenteVerification.style.top='50%';
   attenteVerification.style.transform='translate(-50%, -50%)';
   attenteVerification.style.lineHeight='0';
   attenteVerification.style.pointerEvents='none';
   attenteVerification.setAttribute('role','status');
   attenteVerification.setAttribute('aria-label','Vérification du formulaire en cours');
   const image=document.createElement('img');
   image.width=24;image.height=24;image.alt='';image.setAttribute('aria-hidden','true');
   const c=window.SITE_CONFIG||{};
   const base=String(c.objetBaseUrl||c.OBJET_BASE||((window.SITE_BASE||'..')+'/OBJET')).replace(/\/$/,'');
   image.src=typeof c.objetUrl==='function'?c.objetUrl('/IMAG/PICTO/pictowait.gif'):base+'/IMAG/PICTO/pictowait.gif';
   attenteVerification.append(image);bouton.append(attenteVerification);
  }
  function afficherAttenteVerification(active){
   if(!attenteVerification)return;
   clearTimeout(delaiVerification);
   attenteVerification.hidden=!active;
   libelleVerification.style.visibility=active?'hidden':'';
   if(active)bouton.setAttribute('aria-label','Vérification du formulaire en cours');
   else if(ariaLabelInitial===null)bouton.removeAttribute('aria-label');
   else bouton.setAttribute('aria-label',ariaLabelInitial);
   if(active)delaiVerification=setTimeout(()=>{
    afficherAttenteVerification(false);
    statut.textContent='La vérification prend plus de temps que prévu. Si une case de vérification est affichée, cochez-la. Sinon, rechargez la page pour réessayer.';
   },30000);
  }
  // Pictogramme SVG dédié à la soumission (distinct de la vérification Turnstile).
  // Overlay retiré avant la boîte de confirmation ou le message d'erreur.
  let attenteEnvoi = null;
  if (['coach', 'resparc'].includes(config.type)) {
   attenteEnvoi = document.createElement('div');
   attenteEnvoi.hidden = true;
   attenteEnvoi.setAttribute('role', 'status');
   attenteEnvoi.setAttribute('aria-label', 'Envoi de votre demande en cours');
   attenteEnvoi.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:var(--lcdp-color-surface,#fff);display:none;align-items:center;justify-content:center;';
   const icone = document.createElement('img');
   const site = window.SITE_CONFIG || {};
   const objet = String(site.objetBaseUrl || site.OBJET_BASE || ((window.SITE_BASE || '..') + '/OBJET')).replace(/\/+$/, '');
   icone.src = typeof site.objetUrl === 'function' ? site.objetUrl('/IMAG/PICTO/pictowait.svg') : objet + '/IMAG/PICTO/pictowait.svg';
   icone.width = 64;
   icone.height = 64;
   icone.alt = '';
   icone.setAttribute('aria-hidden', 'true');
   attenteEnvoi.appendChild(icone);
   document.body.appendChild(attenteEnvoi);
  }
  function afficherAttenteEnvoi(active) {
   if (!attenteEnvoi) return;
   attenteEnvoi.hidden = !active;
   attenteEnvoi.style.display = active ? 'flex' : 'none';
  }
  afficherAttenteVerification(true);
  let token='',id=crypto.randomUUID(),empreinte='',enCours=false,widgetId=null;
  bouton.disabled=true;statut.textContent=['coach','resparc'].includes(config.type)?'':'Préparation de la vérification…';
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(enCours)return;
   if(!form.reportValidity())return;
   if(!token){statut.textContent='Validez la vérification avant l’envoi.';return;}
   const donnees={};for(const champ of config.champs){const field=form.elements.namedItem(champ.name);donnees[champ.name]=String(field?.value||'').trim();}
   const contenu=JSON.stringify(donnees);if(empreinte && empreinte!==contenu)id=crypto.randomUUID();empreinte=contenu;
   enCours=true;bouton.disabled=true;form.setAttribute('aria-busy','true');statut.textContent='Envoi en cours…';afficherAttenteEnvoi(true);
   try{
    const r=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,donnees,token}),signal:AbortSignal.timeout(45000)});
    const data=await r.json().catch(()=>null);if(!r.ok||data?.ok!==true)throw new Error(data?.message||'Envoi non confirmé. Réessayez.');
    afficherAttenteEnvoi(false);
    const contact=['coach','resparc'].includes(config.type);
    const confirmation=typeof data.message==='string'&&data.message.trim()?data.message:'Votre demande est enregistrée. Merci.';
    form.reset();id=crypto.randomUUID();empreinte='';statut.textContent=confirmation;
    const confirme=await message(confirmation,{retourAccueil:contact});
    if(contact && confirme){
     const c=window.SITE_CONFIG||{};
     const chemin='/ESPACE-PUBLIC/accueil-public.html';
     const base=String(c.publicBaseUrl||c.PUBLIC_BASE||window.SITE_BASE||c.siteBase||'').replace(/\/+$/,'');
     window.location.assign(typeof c.publicUrl==='function'?c.publicUrl(chemin):base+chemin);
    }
   }catch(e){afficherAttenteEnvoi(false);statut.textContent=e.name==='TimeoutError'?'Envoi non confirmé. Réessayez avec les mêmes informations.':e.message;}
   finally{afficherAttenteEnvoi(false);enCours=false;form.removeAttribute('aria-busy');token='';bouton.disabled=true;if(widgetId!==null){afficherAttenteVerification(true);window.turnstile.reset(widgetId);}}
  });
  try{
   const r=await fetch(config.endpoint,{headers:{Accept:'application/json'},cache:'no-store'});const data=await r.json();
   if(!r.ok||data.type!==config.type||!data.sitekey)throw new Error('Formulaire momentanément indisponible.');
   await chargerTurnstile();
   widgetId=window.turnstile.render(widget,{sitekey:data.sitekey,action:config.type,size:'flexible',appearance:['coach','resparc'].includes(config.type)?'interaction-only':'always',
    callback:value=>{afficherAttenteVerification(false);token=value;bouton.disabled=enCours;statut.textContent='';},
    'expired-callback':()=>{afficherAttenteVerification(true);token='';bouton.disabled=true;statut.textContent='Vérification expirée. Renouvelez-la.';},
    'error-callback':()=>{afficherAttenteVerification(false);token='';bouton.disabled=true;statut.textContent='Vérification indisponible. Réessayez.';}});
  }catch(e){afficherAttenteVerification(false);statut.textContent=e.message||'Formulaire momentanément indisponible. Rechargez la page.';}
 };
})();
