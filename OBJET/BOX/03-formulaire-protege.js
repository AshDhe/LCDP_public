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
 async function message(texte){
  const slot=document.getElementById('lcdp-lightbox-slot');
  try{
   const config=window.SITE_CONFIG||{};
   const base=String(config.objetBaseUrl||config.OBJET_BASE||((window.SITE_BASE||'')+'/OBJET')).replace(/\/$/,'');
   const url=base?base+'/BOX/02-box-alerte.html':'../OBJET/BOX/02-box-alerte.html';
   const r=await fetch(url,{credentials:'same-origin'});if(!r.ok||!slot)throw new Error();
   const template=document.createElement('template');template.innerHTML=(await r.text()).trim();
   // L'alerte se superpose à un éventuel formulaire juridique, sans le détruire.
   const zone=document.createElement('div');zone.append(template.content.cloneNode(true));slot.append(zone);
   const cible=zone.querySelector('[data-lcdp-alerte-message]');if(!cible){zone.remove();throw new Error();}cible.textContent=texte;
   return await new Promise(resolve=>{const fermer=event=>{zone.remove();resolve(event.currentTarget.matches('[data-lcdp-alerte-ok]'));};zone.querySelectorAll('[data-lcdp-alerte-close], [data-lcdp-alerte-ok]').forEach(b=>b.addEventListener('click',fermer,{once:true}));});
  }catch{window.alert(texte);return true;}
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
   image.src=typeof c.objetUrl==='function'?c.objetUrl('/BOX/pictowait.gif'):base+'/BOX/pictowait.gif';
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
  afficherAttenteVerification(true);
  let token='',id=crypto.randomUUID(),empreinte='',enCours=false,widgetId=null;
  bouton.disabled=true;statut.textContent=['coach','resparc'].includes(config.type)?'':'Préparation de la vérification…';
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(enCours)return;
   if(!form.reportValidity())return;
   if(!token){statut.textContent='Validez la vérification avant l’envoi.';return;}
   const donnees={};for(const champ of config.champs){const field=form.elements.namedItem(champ.name);donnees[champ.name]=String(field?.value||'').trim();}
   const contenu=JSON.stringify(donnees);if(empreinte && empreinte!==contenu)id=crypto.randomUUID();empreinte=contenu;
   enCours=true;bouton.disabled=true;form.setAttribute('aria-busy','true');statut.textContent='Envoi en cours…';
   try{
    const r=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,donnees,token}),signal:AbortSignal.timeout(45000)});
    const data=await r.json().catch(()=>null);if(!r.ok||data?.ok!==true)throw new Error(data?.message||'Envoi non confirmé. Réessayez.');
    const contact=['coach','resparc'].includes(config.type);
    const confirmation='Votre demande est enregistrée. Merci.'+(contact?' Nous revenons vers vous.':'');
    form.reset();id=crypto.randomUUID();empreinte='';statut.textContent=confirmation;
    const confirme=await message(confirmation);
    if(contact && confirme){
     const c=window.SITE_CONFIG||{};
     const chemin='/ESPACE-PUBLIC/accueil-public.html';
     const base=String(c.publicBaseUrl||c.PUBLIC_BASE||window.SITE_BASE||c.siteBase||'').replace(/\/+$/,'');
     window.location.assign(typeof c.publicUrl==='function'?c.publicUrl(chemin):base+chemin);
    }
   }catch(e){statut.textContent=e.name==='TimeoutError'?'Envoi non confirmé. Réessayez avec les mêmes informations.':e.message;}
   finally{enCours=false;form.removeAttribute('aria-busy');token='';bouton.disabled=true;if(widgetId!==null){afficherAttenteVerification(true);window.turnstile.reset(widgetId);}}
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
