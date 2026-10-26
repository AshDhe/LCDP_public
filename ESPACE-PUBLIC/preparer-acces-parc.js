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
  const QR_ACTUALISATION="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAegAAAHoCAIAAAANMutbAAANk0lEQVR4nO3cwa0jyXJAUY3QxsgFWSCbZYFckDdPC60GUOJPfWQq4vacs2w0WPWK5EUugvHHz8/PvwDQ8a/TNwDAN8INECPcADHCDRAj3AAxwg0QI9wAMcINECPcADHCDRAj3AAxwg0QI9wAMcINECPcADHCDRAj3AAxwg0QI9wAMcINECPcADHCDRAj3AAxwg0QI9wAMcINECPcADHCDRAj3AAxwg0QI9wAMb9eX+Df/uPfX1/iiv/+z//6P//9dP+n///V1+fz9T5f23Y/X71+31+/zpTK92XKrb/3xIkbIEa4AWKEGyBGuAFihBsgRrgBYoQbIOb5HPfJ6znHk1tzoLfmr19f95ap9+vk9fz463nt1/PO2z5vlb/3q6nvoxM3QIxwA8QIN0CMcAPECDdAjHADxAg3QMzYHPfJ1Bzu19d5fZ/b9hrfup9tz/Orbe/L19d5/X5t28++rSe3OHEDxAg3QIxwA8QIN0CMcAPECDdAjHADxKyb497m9dzuydRc8Ou/a2oO+tZ88a093V9NzfufvJ7v3jY3vY0TN0CMcAPECDdAjHADxAg3QIxwA8QIN0CMOe5/0q3506m9xlN7lqf2Nb++z9P/3zbvv22Ptnntf44TN0CMcAPECDdAjHADxAg3QIxwA8QIN0DMujnuylzn673M2+aaX++tntrXfHr913P6J6/n5Svfr1t+17/XiRsgRrgBYoQbIEa4AWKEGyBGuAFihBsgZmyO+/Wc8pRb+47r//9kai5721x5/flvu5/ftScnTtwAMcINECPcADHCDRAj3AAxwg0QI9wAMc/nuOv7cF/PF381NW9b8frzduv5T5maT5/6/78rJ26AGOEGiBFugBjhBogRboAY4QaIEW6AmLF93F+93tu7bf735Ov89em6t+a7p+Zqt82hT83pn9y6n9f7wU+m9nFXvhdO3AAxwg0QI9wAMcINECPcADHCDRAj3AAxf/z8/IxcuDIfevJ6rvP1nPLr+ffXc/cnt+7n9edz6rlVnv9r2+7nKydugBjhBogRboAY4QaIEW6AGOEGiBFugJjnc9zb9iaf1OdJp15nap592/z1a3+357Btfnzb3LcTN0CMcAPECDdAjHADxAg3QIxwA8QIN0DM2D7uk23zp6/3gE/tTf5qas91xdTftW1v+8nUPv1te/xvceIGiBFugBjhBogRboAY4QaIEW6AGOEGiPn1+gJf51tvzUvemvu+pb6XvDJ/vW1v9evX/+r1dV/ff2Ue/PX3wokbIEa4AWKEGyBGuAFihBsgRrgBYoQbIOb5HHdlr/TJtv3gX19n25zyV1Pzxbfex8rc8S1T7/vU7wmmruvEDRAj3AAxwg0QI9wAMcINECPcADHCDRDzx8/Pz9MLTM3DbtvHPWXb85yad56aC972fL56/fuAqfdr2+9FvnLiBogRboAY4QaIEW6AGOEGiBFugBjhBoh5vo/7lm1zxFPztl+v+3pf9levn/O2+d/6nuht8+Nf3fr8b/seOXEDxAg3QIxwA8QIN0CMcAPECDdAjHADxIzNcb+en63Pd399PlPzpLe8vv/K87k1N/16X/bX6752qw+V+W4nboAY4QaIEW6AGOEGiBFugBjhBogRboCY53Pcr+dGp17/lqk52Vt/V/3+t93P69ef+j3E19ef+nxWOHEDxAg3QIxwA8QIN0CMcAPECDdAjHADxPzx8/MzfQ9/yes9v1N7tKf2F0/tH389j1x5H2/d59fXP9n2fL5et/78v3LiBogRboAY4QaIEW6AGOEGiBFugBjhBoh5Pse9bT709dxxZX759RzrlG3v17brnlSew+v/X+HEDRAj3AAxwg0QI9wAMcINECPcADHCDRDza/oG/r99nVP+Ogf6el/wtvnrylz8tv3dJ1N750+m5qZfP4dtz/krJ26AGOEGiBFugBjhBogRboAY4QaIEW6AmLF93JX9udvmebc9h23zvPU9y7ds2wv/2tSc/tRzcOIGiBFugBjhBogRboAY4QaIEW6AGOEGiHm+j/vW/OO2fdMnt+5zar/z6/nTW/vNb73+7zqPvO3vndp/fev5bPucOHEDxAg3QIxwA8QIN0CMcAPECDdAjHADxDzfx31SmXd+PVde2U+9bY5+2/u17XcJU78/OHm9F/uWbfPaJ07cADHCDRAj3AAxwg0QI9wAMcINECPcADHP93HfMjUP+3qu89brT+1rfj2H+/X16/PmX217Pq+/p5X599dz307cADHCDRAj3AAxwg0QI9wAMcINECPcADFj+7hPftc93a/nfF+/zkll3/RJZa759edh27z5tt9JbNvT7cQNECPcADHCDRAj3AAxwg0QI9wA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";
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
    document.getElementById("consigne-autorisation").textContent="Autorisez la géolocalisation depuis votre téléphone.";
  }
  if(tokenConfirmation){
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
