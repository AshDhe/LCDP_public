(function () {
  const host = window.location.hostname;

  const isGithub =
    host === "ashdhe.github.io" ||
    host === "huguespavret.github.io";

  const githubOrigin = "https://" + host;

  const CONFIG = {
    github: {
      publicBase: githubOrigin + "/LCDP_public",
      objetBase: githubOrigin + "/LCDP_public/OBJET",
      membreBase: githubOrigin + "/LCDP_membre",
      parcBase: githubOrigin + "/LCDP_parc",
      coachBase: githubOrigin + "/LCDP_coach",
      adminBase: githubOrigin + "/LCDP_admin"
    },

    production: {
      publicBase: "https://lacleduparc.fr",
      objetBase: "https://lacleduparc.fr/OBJET",
      membreBase: "https://membre.lacleduparc.fr",
      parcBase: "https://parc.lacleduparc.fr",
      coachBase: "https://coach.lacleduparc.fr",
      adminBase: "https://admin.lacleduparc.fr"
    }
  };

  const active = isGithub ? CONFIG.github : CONFIG.production;

  const WORKERS = {
    mdptokenz: "https://mdptokenz-api.lacleduparc.fr",
    connexionMembre: "https://connexion-membre-api.lacleduparc.fr",
    formInscriptionMembre: "https://form-inscription-membre-api.lacleduparc.fr",
    la: "https://la-api.lacleduparc.fr",
    userRouteur: "https://user-routeur-api.lacleduparc.fr",
    laCleDuParc: "https://la-cle-du-parc-api.lacleduparc.fr",
    editingAdmin: "https://editing-admin-api.lacleduparc.fr",
    editingAdminFallback: "https://w-editing-admin.hugues-pavret.workers.dev"
  };

  function buildUrl(base, path) {
    return base.replace(/\/$/, "") + "/" + String(path || "").replace(/^\/+/, "");
  }

  window.SITE_CONFIG = {
    publicBaseUrl: active.publicBase,
    siteBase: active.publicBase,
    objetBaseUrl: active.objetBase,

    membreBaseUrl: active.membreBase,
    parcBaseUrl: active.parcBase,
    coachBaseUrl: active.coachBase,
    adminBaseUrl: active.adminBase,

    workerMdptokenzUrl: WORKERS.mdptokenz,
    workerConnexionMembreUrl: WORKERS.connexionMembre,
    workerFormInscriptionMembreUrl: WORKERS.formInscriptionMembre,
    workerUserRouteurUrl: WORKERS.userRouteur,
    workerLaCleDuParcUrl: WORKERS.laCleDuParc,
    workerLaUrl: WORKERS.la,
    workerEditingAdminUrl: WORKERS.editingAdmin,
    workerEditingAdminFallbackUrl: WORKERS.editingAdminFallback,
    WORKER_LA_URL: WORKERS.la,
    WORKER_EDITING_ADMIN_URL: WORKERS.editingAdmin,
    WORKER_EDITING_ADMIN_FALLBACK_URL: WORKERS.editingAdminFallback,


    PUBLIC_BASE: active.publicBase,
    SITE_BASE: active.publicBase,
    OBJET_BASE: active.objetBase,
    MEMBRE_BASE: active.membreBase,
    PARC_BASE: active.parcBase,
    COACH_BASE: active.coachBase,
    ADMIN_BASE: active.adminBase,

    WORKER_MDPTOKENZ_URL: WORKERS.mdptokenz,
    WORKER_CONNEXION_MEMBRE_URL: WORKERS.connexionMembre,
    WORKER_FORM_INSCRIPTION_MEMBRE_URL: WORKERS.formInscriptionMembre,
    WORKER_USER_ROUTEUR_URL: WORKERS.userRouteur,
    WORKER_LA_CLE_DU_PARC_URL: WORKERS.laCleDuParc,
    W_LA_CLE_DU_PARC_URL: WORKERS.laCleDuParc,

    publicUrl(path) {
      return buildUrl(active.publicBase, path);
    },

    objetUrl(path) {
      return buildUrl(active.objetBase, path);
    },

    membreUrl(path) {
      return buildUrl(active.membreBase, path);
    },

    parcUrl(path) {
      return buildUrl(active.parcBase, path);
    },

    coachUrl(path) {
      return buildUrl(active.coachBase, path);
    },

    adminUrl(path) {
      return buildUrl(active.adminBase, path);
    },

    apiUrl(workerSubdomain) {
      return "https://" + workerSubdomain + ".lacleduparc.fr";
    }
  };

  const CLASSE_CONTROLE_CLE = "lcdp-controle-cle-en-cours";
  const ID_STYLE_CONTROLE_CLE = "lcdp-style-controle-cle-en-cours";
  let verificationVerrouillageClePromise = null;

  initialiserVerrouillageCleActive();

  function initialiserVerrouillageCleActive() {
    const fetchBrut = window.fetch.bind(window);
    let controleEnCours = null;
    let bloque = false;
    let affiche = false;
    const endpoint = String(WORKERS.laCleDuParc || "").replace(/\/+$/, "");
    const deconnexion = WORKERS.deconnexionMembre || "https://deconnexion-membre-api.lacleduparc.fr";
    const corpsDisponible = () => document.body ? Promise.resolve() : new Promise(r=>document.addEventListener("DOMContentLoaded",r,{once:true}));
    async function afficher(message = "Votre compte est actuellement utilisé sur un autre appareil.") {
      bloque = true;
      document.documentElement.classList.remove(CLASSE_CONTROLE_CLE);
      document.documentElement.classList.add("lcdp-compte-bloque");
      await corpsDisponible();
      if (affiche) {
        document.querySelector("#lcdp-compte-bloque p").textContent=message;
        return;
      }
      affiche = true;
      const lien = document.createElement("link");
      lien.rel="stylesheet"; lien.href=buildUrl(active.publicBase,"/OBJET/CSSBASE/cssbase.css");
      document.head.appendChild(lien);
      const ecran=document.createElement("main"); ecran.id="lcdp-compte-bloque";
      ecran.setAttribute("role","alertdialog");ecran.setAttribute("aria-modal","true");
      ecran.setAttribute("aria-labelledby","lcdp-compte-bloque-message");
      const texte=document.createElement("p");texte.id="lcdp-compte-bloque-message";texte.textContent=message;
      const securiser=document.createElement("button");securiser.type="button";securiser.className="lcdp-button";securiser.textContent="Sécuriser mon compte";securiser.disabled=true;
      const quitter=document.createElement("button");quitter.type="button";quitter.className="lcdp-button";quitter.textContent="Me déconnecter";
      quitter.addEventListener("click",async()=>{
        quitter.disabled=true;
        try {
          const r=await fetchBrut(deconnexion+"/deconnexion",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:"{}"});
          const d=await r.json();
          if(!r.ok || d.success !== true) throw new Error("Déconnexion non confirmée. Réessayez.");
          window.location.replace(buildUrl(active.publicBase,"/"));
        } catch(error) {texte.textContent=error.message;quitter.disabled=false;}
      });
      const actions=document.createElement("div");actions.className="lcdp-compte-bloque-actions";actions.append(quitter,securiser);ecran.append(texte,actions);document.body.appendChild(ecran);quitter.focus();
    }
    // Ce style critique est également livré dans cssbase.css : évite le flash du contenu.
    const style=document.createElement("style");
    style.textContent="html.lcdp-controle-cle-en-cours body{visibility:hidden!important}html.lcdp-compte-bloque{background:#000!important}html.lcdp-compte-bloque body{background:#000!important;color:#fff!important}html.lcdp-compte-bloque body>*:not(#lcdp-compte-bloque){display:none!important}#lcdp-compte-bloque{position:fixed;inset:0;z-index:2147483647;overflow:auto;background:#000;color:#fff;padding:24px;box-sizing:border-box;display:flex;flex-direction:column}#lcdp-compte-bloque p{color:#fff!important}#lcdp-compte-bloque .lcdp-compte-bloque-actions{margin-top:auto;padding-top:24px;padding-bottom:env(safe-area-inset-bottom)}#lcdp-compte-bloque button{display:block;margin-top:16px}";
    document.head.appendChild(style);
    window.LCDP_afficherCompteUtilise=afficher;
    window.LCDP_verifierExclusiviteCle = verifier;
    async function verifier() {
      if(controleEnCours) return controleEnCours;
      controleEnCours=(async()=>{
        try {
          const r=await fetchBrut(endpoint+"/lock-status",{credentials:"include",cache:"no-store",headers:{Accept:"application/json"}});
          const d=await r.json();
          if(d.reason === "key_in_use") {await afficher();return false;}
          if(!r.ok && r.status !== 401 && r.status !== 403) throw new Error("Contrôle indisponible");
          if(bloque && r.ok) {window.location.reload();return false;}
          if(d.holder === true && !estPageMaCle(window.location.href) &&
             !(d.returnHomeAllowed === true && new URL(window.location.href).pathname === "/ESPACE-MEMBRE/accueil-membre.html")) {
            window.location.replace(buildUrl(active.membreBase,"/ESPACE-MEMBRE/lacleduparc.html"));return false;
          }
          return !bloque;
        } catch {
          await afficher("La vérification de votre compte est momentanément indisponible.");
          return false;
        } finally {document.documentElement.classList.remove(CLASSE_CONTROLE_CLE);controleEnCours=null;}
      })();
      return controleEnCours;
    }
    // Les API doivent aussi effectuer leur propre contrôle serveur, indépendamment du navigateur.
    window.fetch=async function(input,init) {
      const url=new URL(typeof input==="string"?input:input.url,window.location.href);
      const horsControle=url.origin===new URL(endpoint).origin && ["/lock-status","/ouvrir"].includes(url.pathname);
      const sortie=url.origin===new URL(deconnexion).origin;
      if(url.hostname.endsWith("-api.lacleduparc.fr") && !horsControle && !sortie) {
        if(!await verifier()) return new Response(JSON.stringify({success:false,reason:"key_in_use",message:"Votre compte est actuellement utilisé sur un autre appareil."}),{status:423,headers:{"Content-Type":"application/json"}});
      }
      const r=await fetchBrut(input,init);
      if(r.status===423) {
        const d=await r.clone().json().catch(()=>null);
        if(d?.reason==="key_in_use") await afficher();
      }
      return r;
    };
    if(!endpoint) return;
    document.documentElement.classList.add(CLASSE_CONTROLE_CLE);
    verifier();
    window.setInterval(()=>{if(document.visibilityState==="visible") verifier();},3000);
    window.addEventListener("focus",verifier);
    window.addEventListener("pageshow",verifier);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")verifier();});
  }

  function masquerPagePendantControleCle() {}
  function libererPageApresControleCle() {document.documentElement.classList.remove(CLASSE_CONTROLE_CLE);}

  function estPageMaCle(value) {
    try {
      const url = new URL(String(value || ""), window.location.href);
      return url.pathname.endsWith("/ESPACE-MEMBRE/lacleduparc.html");
    } catch {
      return false;
    }
  }
})();
