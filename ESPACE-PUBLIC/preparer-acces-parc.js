(() => {
  "use strict";
  const autoriser=document.getElementById("autoriser-geolocalisation");
  const statut=document.getElementById("statut-geolocalisation");
  const contenu=document.getElementById("preparation-contenu");
  const confirmation=document.getElementById("confirmation-geolocalisation");
  const utiliseTelephone=document.getElementById("utilise-telephone");
  const confirmationTelephone=document.getElementById("confirmation-telephone");
  const dialogueEmail=document.getElementById("email-optin");
  let flow=String(window.LCDP_GEO_FLOW||"");
  let tokenConfirmation=String(window.LCDP_GEO_CONFIRMATION||"");
  delete window.LCDP_GEO_FLOW;delete window.LCDP_GEO_CONFIRMATION;
  const config=window.SITE_CONFIG||{};
  const endpoint=String(config.workerMdptokenzUrl||config.WORKER_MDPTOKENZ_URL||(typeof config.apiUrl==="function"?config.apiUrl("mdptokenz-api"):"")).replace(/\/+$/,"");
  const QR_ACTUALISATION="data:image/png;base64,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";
  const modeActualisation=["actualisation","compte"].includes(new URL(location.href).searchParams.get("mode"));
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
  function appliquerDetection(d){
    const avertissement=document.getElementById("avertissement-appareil");
    avertissement.hidden=d.mobile_detecte!==false;
  }
  let optinEnregistre=false;
  confirmation.addEventListener("close",()=>{
    if(optinEnregistre)location.assign(new URL("/ESPACE-PUBLIC/connexion-membre.html",location.href).href);
  });
  function termine(){
    optinEnregistre=true;
    document.body.classList.add("optin-termine");
    contenu.hidden=true;
    statut.textContent="Votre opt-in géolocalisation est enregistré. "+informationNavigateur+" Cliquez sur OK pour vous connecter.";
    if(typeof confirmation.showModal==="function")confirmation.showModal();
  }
  if(modeActualisation){
    flow="";tokenConfirmation="";
    document.getElementById("identification-actualisation").hidden=false;
    document.getElementById("qr-geolocalisation").src=QR_ACTUALISATION;
    document.getElementById("etape-securite").hidden=false;
    document.getElementById("etape-securite").textContent="Sécurité du compte";
    document.getElementById("titre-preparation").textContent="Mise à jour géolocalisation";
  }
  if(flow){
    document.getElementById("etape-securite").hidden=false;
    document.getElementById("titre-preparation").textContent="Préparer votre venue";
  }
  if(mobile||new URL(location.href).searchParams.get("via")==="qr"||tokenConfirmation){
    document.getElementById("preparation-qr").hidden=true;
    if(!flow&&!modeActualisation)document.getElementById("titre-preparation").hidden=true;
    
  }
  if(tokenConfirmation){
    document.getElementById("consigne-autorisation").hidden=false;
    document.getElementById("consigne-autorisation").textContent="Confirmez votre opt-in géolocalisation.";
    autoriser.textContent="Confirmer mon opt-in";
    // Le lien email confirme le navigateur de la demande initiale, pas celui qui lit l’email.
    confirmationTelephone.hidden=true;
  }
  autoriser.addEventListener("click",async()=>{
    if(enCours)return;
    if(tokenConfirmation){
      etat(true);
      const enregistrement=appeler("geo-email-confirm",{token:tokenConfirmation});
      demanderPermissionNavigateur();
      try{const d=await enregistrement;appliquerDetection(d);tokenConfirmation="";termine();}
      catch(e){statut.textContent=e.message;}
      finally{etat(false);}
      return;
    }
    if(!utiliseTelephone.checked){
      window.alert("Confirmez que vous utilisez le téléphone");
      utiliseTelephone.focus();return;
    }
    try{navigateurDemande=obtenirIdentiteNavigateurMobile();}
    catch(e){statut.textContent=e.message;return;}
    if(modeActualisation){
      const email=document.getElementById("email-actualisation");
      const code=document.getElementById("coda-actualisation");
      if(!email.reportValidity()||!code.reportValidity())return;
      etat(true);statut.textContent="Enregistrement de votre autorisation…";
      const enregistrement=appeler("geo-account-update",{email:email.value,coda:code.value,navigateur:navigateurDemande,telephoneConfirme:true,consent:true,version:"2026-10-24"});
      code.value="";
      demanderPermissionNavigateur();
      try{const d=await enregistrement;appliquerDetection(d);termine();}
      catch(e){statut.textContent=e.message;}
      finally{etat(false);}
      return;
    }
    optinAccepte=true;
    if(flow){
      etat(true);statut.textContent="Enregistrement de votre opt-in…";
      // Le consentement ne dépend pas de la réponse à la demande du navigateur.
      const enregistrement=appeler("geo-save",{flow,navigateur:navigateurDemande,telephoneConfirme:true,consent:true,version:"2026-10-24"});
      demanderPermissionNavigateur();
      try{const d=await enregistrement;appliquerDetection(d);flow="";termine();}
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
    const informer=texte=>{
      informationNavigateur=texte;
      if(contenu.hidden&&confirmation.open){
        statut.textContent="Votre opt-in géolocalisation est enregistré. "+texte+" Cliquez sur OK pour vous connecter.";
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
      const d=await appeler("geo-email-request",{email:document.getElementById("email-compte-optin").value,navigateur:navigateurDemande,telephoneConfirme:true,consent:true,version:"2026-10-24"});
      dialogueEmail.close();contenu.hidden=true;statut.textContent=d.message;
    }catch(e){message.textContent=e.message;}
    finally{etat(false);bouton.disabled=false;}
  });
  function obtenirIdentiteNavigateurMobile() {
    const ua = navigator.userAgent || "";
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
