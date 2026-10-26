(() => {
  "use strict";
  const autoriser=document.getElementById("autoriser-geolocalisation");
  const statut=document.getElementById("statut-geolocalisation");
  const contenu=document.getElementById("preparation-contenu");
  const confirmation=document.getElementById("confirmation-geolocalisation");
  const dialogueEmail=document.getElementById("email-optin");
  let flow=String(window.LCDP_GEO_FLOW||"");
  let tokenConfirmation=String(window.LCDP_GEO_CONFIRMATION||"");
  delete window.LCDP_GEO_FLOW;delete window.LCDP_GEO_CONFIRMATION;
  const config=window.SITE_CONFIG||{};
  const endpoint=String(config.workerMdptokenzUrl||config.WORKER_MDPTOKENZ_URL||(typeof config.apiUrl==="function"?config.apiUrl("mdptokenz-api"):"")).replace(/\/+$/,"");
  const mobile=/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(navigator.userAgent);
  let enCours=false;
  let optinAccepte=false;
  let informationNavigateur="";
  let navigateurDemande="";
  function etat(occupe){enCours=occupe;autoriser.disabled=occupe;}
  async function appeler(action,body={}){
    if(!endpoint)throw new Error("Service indisponible. Réessayez plus tard.");
    const r=await fetch(endpoint,{method:"POST",credentials:"omit",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...body})});
    const d=await r.json().catch(()=>null);
    if(!r.ok||!d?.success)throw new Error(d?.message||"L’enregistrement n’est pas confirmé. Réessayez.");
    return d;
  }
  function termine(){
    contenu.hidden=true;
    statut.textContent="Votre opt-in géolocalisation est enregistré. "+informationNavigateur+" Vous pouvez fermer cette page.";
    if(typeof confirmation.showModal==="function")confirmation.showModal();
  }
  if(flow){
    document.getElementById("etape-securite").hidden=false;
    document.getElementById("titre-preparation").textContent="Préparer votre venue";
  }
  if(mobile||new URL(location.href).searchParams.get("via")==="qr"||tokenConfirmation){
    document.getElementById("preparation-qr").hidden=true;
    if(!flow)document.getElementById("titre-preparation").hidden=true;
    document.getElementById("consigne-autorisation").textContent="Autorisez la géolocalisation depuis votre téléphone.";
  }
  if(tokenConfirmation){
    document.getElementById("consigne-autorisation").textContent="Confirmez votre opt-in géolocalisation.";
    autoriser.textContent="Confirmer mon opt-in";
  }
  autoriser.addEventListener("click",async()=>{
    if(enCours)return;
    if(tokenConfirmation){
      etat(true);
      const enregistrement=appeler("geo-email-confirm",{token:tokenConfirmation});
      demanderPermissionNavigateur();
      try{await enregistrement;tokenConfirmation="";termine();}
      catch(e){statut.textContent=e.message;}
      finally{etat(false);}
      return;
    }
    if(!mobile){statut.textContent="Scannez le QR code avec votre téléphone pour autoriser sa géolocalisation.";return;}
    try{navigateurDemande=obtenirIdentiteNavigateurMobile();}
    catch(e){statut.textContent=e.message;return;}
    optinAccepte=true;
    if(flow){
      etat(true);statut.textContent="Enregistrement de votre opt-in…";
      // Le consentement ne dépend pas de la réponse à la demande du navigateur.
      const enregistrement=appeler("geo-save",{flow,navigateur:navigateurDemande,consent:true,version:"2026-10-24"});
      demanderPermissionNavigateur();
      try{await enregistrement;flow="";termine();}
      catch(e){statut.textContent=e.message;}
      finally{etat(false);}
    } else {
      demanderPermissionNavigateur();
      statut.textContent="Confirmez votre email de compte pour enregistrer votre opt-in.";
      dialogueEmail.showModal();document.getElementById("email-compte-optin").focus();
    }
  });
  function demanderPermissionNavigateur(){
    // Demande lancée depuis le clic, sans attendre le réseau ni conserver les coordonnées.
    if(!mobile)return;
    const informer=texte=>{
      informationNavigateur=texte;
      if(contenu.hidden&&confirmation.open){
        statut.textContent="Votre opt-in géolocalisation est enregistré. "+texte+" Vous pouvez fermer cette page.";
      }
    };
    if(!window.isSecureContext||!navigator.geolocation){
      informer("La localisation est indisponible dans ce navigateur. Votre consentement reste valable.");return;
    }
    try{
      navigator.geolocation.getCurrentPosition(
        ()=>informer("La localisation est autorisée dans ce navigateur."),
        erreur=>informer(erreur.code===1
          ?"La localisation est refusée dans ce navigateur. Votre consentement reste valable ; vous devrez autoriser la localisation pour les contrôles au parc."
          :"La position est indisponible. Votre consentement reste valable."),
        {enableHighAccuracy:true,maximumAge:0,timeout:15000}
      );
    }catch{
      informer("La demande de localisation n’a pas abouti. Votre consentement reste valable.");
    }
  }
  document.getElementById("form-email-optin").addEventListener("submit",async event=>{
    event.preventDefault();if(enCours||!optinAccepte)return;
    const bouton=document.getElementById("envoyer-email-optin");const message=document.getElementById("message-email-optin");
    etat(true);bouton.disabled=true;
    try{
      const d=await appeler("geo-email-request",{email:document.getElementById("email-compte-optin").value,navigateur:navigateurDemande,consent:true,version:"2026-10-24"});
      dialogueEmail.close();contenu.hidden=true;statut.textContent=d.message;
    }catch(e){message.textContent=e.message;}
    finally{etat(false);bouton.disabled=false;}
  });
  function obtenirIdentiteNavigateurMobile() {
    const ua = navigator.userAgent || "";
    if (!/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) return null;
    const nom = "lcdp_navigateur_proprietaire";
    const lire = () => {
      const prefixe = nom + "=";
      const cookie = document.cookie.split(";").map(v => v.trim()).find(v => v.startsWith(prefixe));
      return cookie ? cookie.slice(prefixe.length) : "";
    };
    let identite = lire();
    if (!/^[a-f0-9]{64}$/.test(identite)) {
      const octets = crypto.getRandomValues(new Uint8Array(32));
      identite = Array.from(octets, v => v.toString(16).padStart(2, "0")).join("");
    }
    const domaine = /(^|\.)lacleduparc\.fr$/i.test(window.location.hostname)
      ? "; Domain=.lacleduparc.fr" : "";
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = nom + "=" + identite + "; Path=/; Max-Age=34560000; SameSite=Lax" + domaine + secure;
    if (lire() !== identite) {
      throw new Error("Autorisez les cookies de l’application pour enregistrer ce navigateur.");
    }
    return identite;
  }

})();
