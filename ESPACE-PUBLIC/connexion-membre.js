(() => {
  "use strict";

  if (window.LCDP_CONNEXION_MEMBRE_SCRIPT_CHARGE) return;
  window.LCDP_CONNEXION_MEMBRE_SCRIPT_CHARGE = true;

  // Le contrôle du champ ne dépend ni de config.js ni du service de connexion.
  document.addEventListener("change", (event) => {
    if (event.target.id !== "afficher-mdp-membre") return;
    const champ = document.getElementById("mdpmembre");
    if (champ) champ.type = event.target.checked ? "text" : "password";
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserConnexionMembre);
  } else {
    initialiserConnexionMembre();
  }

  function initialiserConnexionMembre() {
    const formulaireConnexion = document.getElementById("formulaire-connexion-membre");
    if (formulaireConnexion?.dataset.connexionInitialisee === "true") return;
    try {
      appliquerRoutesSite(document);
    } catch (error) {
      console.error("Les liens de présentation n'ont pas pu être initialisés.", error);
    }

    initialiserBandeauRestreint().catch((erreur) => {
      console.error("Erreur bandeau restreint connexion membre :", erreur);
    });

    initialiserFooter().catch((erreur) => {
      console.error("Erreur footer connexion membre :", erreur);
    });

    const formulaire = document.getElementById("formulaire-connexion-membre");
    const champEmail = document.getElementById("emailmembre");
    const champMdp = document.getElementById("mdpmembre");
    const bouton = document.getElementById("bouton-valider-formulaire");
    const afficherMotDePasse = document.getElementById("afficher-mdp-membre");
    const lienMotDePasseOublie = document.getElementById("lien-mot-de-passe-oublie");

    const endpointConnexionMembre = obtenirEndpointConnexionMembre();

    const urlMonCompteMembre = construireUrlMembre("/index.html");

    const urlMotDePasseOublie = construireUrlPublique(
      "/ESPACE-PUBLIC/mdp-perdu-membre.html"
    );

    let envoiEnCours = false;

    if (lienMotDePasseOublie) {
      lienMotDePasseOublie.href = urlMotDePasseOublie;
      lienMotDePasseOublie.target = "_blank";
      lienMotDePasseOublie.rel = "noopener noreferrer";
    }

    if (!formulaire || !champEmail || !champMdp || !bouton) {
      afficherInformation(
        "Erreur technique",
        "Le formulaire de connexion est incomplet. Veuillez réessayer plus tard.",
        "erreur"
      );
      return;
    }

    function definirEtatBoutonConnexion(enCours) {
      bouton.disabled = enCours;
      bouton.classList.toggle("is-loading", enCours);
      bouton.setAttribute("aria-label", enCours ? "Connexion en cours" : "Connexion");
      bouton.setAttribute("title", enCours ? "Connexion en cours" : "Connexion");
    }

    definirEtatBoutonConnexion(false);

    formulaire.addEventListener("submit", (event) => {
      event.preventDefault();
      connecterMembre();
    });
    formulaire.dataset.connexionInitialisee = "true";

    async function connecterMembre() {
      if (envoiEnCours) return;
      if (!endpointConnexionMembre) {
        await afficherInformation("Connexion indisponible", "L’adresse du service de connexion n’est pas disponible. Rechargez la page.", "erreur");
        return;
      }

      const emailmembre = champEmail.value.trim().toLowerCase();
      const mdpmembre = champMdp.value;

      if (!emailmembre) {
        afficherInformation(
          "Identifiant manquant",
          "Veuillez renseigner votre email.",
          "erreur"
        );
        return;
      }

      if (!mdpmembre) {
        afficherInformation(
          "Mot de passe manquant",
          "Veuillez renseigner votre mot de passe.",
          "erreur"
        );
        return;
      }

      envoiEnCours = true;
      definirEtatBoutonConnexion(true);

      try {
        const navigateur = obtenirIdentiteNavigateurMobile();
        const response = await fetch(endpointConnexionMembre, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            emailmembre,
            mdpmembre,
            navigateur
          })
        });

        const data = await response.json().catch(() => null);
        if (!data) {
          const message = response.status === 403
            ? "La demande est bloquée avant la connexion. Rechargez la page ou réessayez dans un autre navigateur."
            : "Le service de connexion ne renvoie pas de réponse exploitable. Réessayez dans un instant.";
          await afficherInformation("Connexion indisponible", message, "erreur");
          envoiEnCours = false;
          definirEtatBoutonConnexion(false);
          return;
        }

        if (data?.reason === "inscription_incomplete" && data.repriseInscription) {
          const config=window.SITE_CONFIG||{};
          const endpoint=nettoyerBaseUrl(config.workerMdptokenzUrl||config.WORKER_MDPTOKENZ_URL||(typeof config.apiUrl==="function"?config.apiUrl("mdptokenz-api"):""));
          if(!endpoint)throw new Error("Reprise indisponible.");
          const r=await fetch(endpoint,{method:"POST",credentials:"omit",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"flow-resume",reprise:data.repriseInscription})});
          data.repriseInscription="";
          const d=await r.json().catch(()=>null);
          if(!r.ok||!d?.success||!d.nextUrl)throw new Error(d?.message||"Reprise indisponible.");
          champMdp.value="";
          window.location.assign(d.nextUrl);
          return;
        }
        if (data?.reason === "security_setup_required") {
          await finaliserSecuriteAvantConnexion(data);
          return;
        }
        if (!response.ok || !data || data.success !== true) {
          afficherInformation(
            "Connexion impossible",
            data?.message || "Identifiant ou mot de passe incorrect.",
            "erreur"
          );

          envoiEnCours = false;
          definirEtatBoutonConnexion(false);
          return;
        }

        programmerProchaineVerificationSessionMembre(data);

        const urlDestination = obtenirUrlDestinationApresConnexion(urlMonCompteMembre);
        effacerRetourMembreApresConnexion();

        window.location.href = urlDestination;

      } catch (error) {
        console.error("Erreur connexion membre :", error);

        afficherInformation(
          "Erreur",
          "Une erreur est survenue. Veuillez réessayer.",
          "erreur"
        );

        envoiEnCours = false;
        definirEtatBoutonConnexion(false);
      }
    }
  }

  async function finaliserSecuriteAvantConnexion(data) {
    const slot=document.getElementById("lcdp-lightbox-slot");
    let renvoyer=false;
    try {
      const fragment=await chargerFragmentObjet("/BOX/02-box-dialogue-bouton.html");
      slot.innerHTML="";slot.appendChild(fragment);
      slot.querySelector("[data-lcdp-dialogue-title]").textContent="Sécurité du compte";
      
      // OPTIMISATION : Mise à jour du texte selon vos indications (au singulier)
      slot.querySelector("[data-lcdp-dialogue-text]").textContent="Vos codes de sécurité de compte ne sont pas définis. Consultez l'email reçu pour plus d'informations.";
      
      const actions=slot.querySelector("[data-lcdp-dialogue-actions]");
      renvoyer=await new Promise(resolve=>{
        const fermer=valeur=>{slot.innerHTML="";resolve(valeur);};
        
        // OPTIMISATION : Suppression du bouton "OK". Modification du texte "Renvoyer les liens" par "Renvoyer l'email"
        for (const [texte,valeur] of [["Renvoyer l'email",true], ["Annuler",false]]) {
          const bouton=document.createElement("button");bouton.type="button";
          bouton.className="lcdp-button "+(valeur?"lcdp-button-primary":"lcdp-button-secondary");
          bouton.textContent=texte;bouton.addEventListener("click",()=>fermer(valeur),{once:true});actions.appendChild(bouton);
        }
        slot.querySelector("[data-lcdp-dialogue-close]").addEventListener("click",()=>fermer(false),{once:true});
      });
    } catch {
      // Version de secours (fallback) également mise à jour au singulier
      await afficherInformation("Sécurité du compte","Vos codes de sécurité de compte ne sont pas définis. Consultez l'email reçu pour plus d'informations.","information");
    }
    if (renvoyer) {
      try {
        const config=window.SITE_CONFIG||{};
        const endpoint=nettoyerBaseUrl(config.workerMdptokenzUrl||config.WORKER_MDPTOKENZ_URL||(typeof config.apiUrl==="function"?config.apiUrl("mdptokenz-api"):""));
        if (!endpoint) throw new Error("Service non configuré");
        const reponse=await fetch(endpoint,{method:"POST",credentials:"omit",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"setup-resend",autorisationSecurite:data.autorisationSecurite})});
        const resultat=await reponse.json().catch(()=>null);
        await afficherInformation("Sécurité du compte",resultat?.message||"L’envoi n’a pas pu être confirmé.",reponse.ok?"information":"erreur");
      } catch { await afficherInformation("Sécurité du compte","L’envoi n’a pas pu être confirmé. Reconnectez-vous pour réessayer.","erreur"); }
    }
    data.autorisationSecurite="";
    window.location.replace(construireUrlPublique("/ESPACE-PUBLIC/hello.html"));
  }

  function appliquerRoutesSite(racine = document) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlPublique(element.dataset.siteHref));
    });

    racine.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlPublique(element.dataset.siteSrc));
    });

    racine.querySelectorAll("a[href^='/']").forEach((element) => {
      element.setAttribute("href", construireUrlPublique(element.getAttribute("href")));
    });

    racine.querySelectorAll("img[src^='/']").forEach((element) => {
      element.setAttribute("src", construireUrlPublique(element.getAttribute("src")));
    });
  }


  async function initialiserBandeauRestreint() {
    const slot = document.getElementById("lcdp-bandeau-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const fragment = await chargerFragmentSite("/ESPACE-PUBLIC/box-bandeau-nav-public.html");
    slot.appendChild(fragment);
    configurerBandeauRestreint(slot);
    appliquerRoutesSite(slot);
  }

  function configurerBandeauRestreint(slot) {
    const lien = slot.querySelector(".lcdp-box-bandeau-nav__logo-link");
    const libelle = slot.querySelector("[data-lcdp-bandeau-nav-label], .lcdp-box-bandeau-nav__space-label");
    const burgerSlot = slot.querySelector("[data-lcdp-burger-slot], .lcdp-box-bandeau-nav__burger-slot");

    if (lien) {
      lien.setAttribute("href", construireUrlPublique("/ESPACE-PUBLIC/hello.html"));
      lien.dataset.siteHref = "/ESPACE-PUBLIC/hello.html";
      lien.setAttribute("aria-label", "Accueil restreint La Clé du Parc");
    }

    if (libelle) {
      libelle.textContent = "";
      libelle.appendChild(document.createTextNode("La Clé du Parc |"));
      libelle.appendChild(document.createElement("br"));
      libelle.appendChild(document.createTextNode("Accueil restreint"));
    }

    if (burgerSlot) {
      burgerSlot.remove();
    }
  }


  async function initialiserFooter() {
    const slot = document.getElementById("lcdp-footer-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const footer = await chargerFragmentObjet("/BOX/02-box-footer.html");
    slot.appendChild(footer);

    appliquerRoutesSite(slot);
  }


  // Identité persistante du navigateur, commune aux sous-domaines de production.
  // L'effacement du cookie ne supprime jamais le propriétaire côté serveur.
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

  async function afficherInformation(titre, message, type = "information", redirectUrl = null) {
    const slot = document.getElementById("lcdp-lightbox-slot");

    if (!slot) {
      alert(message || titre);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }

      return;
    }

    slot.innerHTML = "";

    try {
      const fragment = await chargerFragmentObjet("/BOX/02-box-alerte.html");
      slot.appendChild(fragment);

      const alerte = slot.querySelector("[data-lcdp-box-alerte]");
      const messageElement = slot.querySelector("[data-lcdp-alerte-message]");
      const boutonFermer = slot.querySelector("[data-lcdp-alerte-close]");
      const boutonOk = slot.querySelector("[data-lcdp-alerte-ok]");

      if (!alerte || !messageElement || !boutonFermer || !boutonOk) {
        throw new Error("Structure de l'alerte V3 incomplète.");
      }

      messageElement.textContent = titre && message
        ? titre + " — " + message
        : titre || message || "";

      await new Promise((resolve) => {
        const fermer = () => {
          slot.innerHTML = "";
          resolve();
        };

        boutonFermer.addEventListener("click", fermer, { once: true });
        boutonOk.addEventListener("click", fermer, { once: true });

        alerte.addEventListener("click", (event) => {
          if (event.target === alerte) {
            fermer();
          }
        }, { once: true });
      });

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }

    } catch (error) {
      console.error("Erreur alerte V3 :", error);

      alert(message || titre);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }
  }

  function obtenirEndpointConnexionMembre() {
    const config = window.SITE_CONFIG || {};
    const explicite = config.workerConnexionMembreUrl || config.WORKER_CONNEXION_MEMBRE_URL;
    if (typeof explicite === "string" && explicite.trim()) return nettoyerBaseUrl(explicite.trim());
    if (typeof config.apiUrl === "function") return nettoyerBaseUrl(config.apiUrl("connexion-membre-api"));
    // Adresse du service déjà présente dans la configuration publique du projet.
    if (/^(?:[a-z0-9-]+\.)*lacleduparc\.fr$/i.test(window.location.hostname) ||
        ["ashdhe.github.io", "huguespavret.github.io"].includes(window.location.hostname)) {
      return "https://connexion-membre-api.lacleduparc.fr";
    }
    return "";
  }

  async function chargerFragmentSite(chemin) {
    const reponse = await fetch(construireUrlPublique(chemin), {
      method: "GET", credentials: "same-origin", cache: "no-cache"
    });
    if (!reponse.ok) throw new Error("Fragment site introuvable : " + chemin);
    const template = document.createElement("template");
    template.innerHTML = (await reponse.text()).trim();
    return template.content.cloneNode(true);
  }

  async function chargerFragmentObjet(chemin) {
    const reponse = await fetch(construireUrlObjet(chemin), {
      method: "GET",
      credentials: "same-origin",
      cache: "force-cache"
    });

    if (!reponse.ok) {
      throw new Error("Fragment objet introuvable : " + chemin);
    }

    const html = await reponse.text();
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.cloneNode(true);
  }

  function construireUrlObjet(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.objetUrl === "function") {
      return config.objetUrl(valeur);
    }

    const objetBaseUrl = nettoyerBaseUrl(
      config.objetBaseUrl ||
      config.OBJET_BASE ||
      ""
    );

    if (objetBaseUrl) {
      return joindreBaseEtChemin(objetBaseUrl, valeur.replace(/^\/?OBJET\//, ""));
    }

    return construireUrlPublique("/OBJET/" + valeur.replace(/^\/+/, "").replace(/^BOX\//, "BOX/"));
  }

  function construireUrlPublique(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.publicUrl === "function") {
      return config.publicUrl(valeur);
    }

    const publicBaseUrl = nettoyerBaseUrl(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    );

    if (publicBaseUrl) {
      return joindreBaseEtChemin(publicBaseUrl, valeur);
    }

    return valeur.startsWith("/") ? ".." + valeur : valeur;
  }

  function construireUrlMembre(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.membreUrl === "function") {
      return config.membreUrl(valeur);
    }

    const membreBaseUrl = nettoyerBaseUrl(
      config.membreBaseUrl ||
      config.MEMBRE_BASE ||
      ""
    );

    if (membreBaseUrl) {
      return joindreBaseEtChemin(membreBaseUrl, valeur);
    }

    if (/^(?:[a-z0-9-]+\.)*lacleduparc\.fr$/i.test(window.location.hostname)) {
      return joindreBaseEtChemin("https://membre.lacleduparc.fr", valeur);
    }
    if (["ashdhe.github.io", "huguespavret.github.io"].includes(window.location.hostname)) {
      return joindreBaseEtChemin(window.location.origin + "/LCDP_membre", valeur);
    }
    return valeur.startsWith("/") ? valeur : "/" + valeur;
  }

  function joindreBaseEtChemin(baseUrl, chemin) {
    const base = nettoyerBaseUrl(baseUrl);
    const cheminNettoye = "/" + String(chemin || "").replace(/^\/+/, "");

    if (!base) {
      return cheminNettoye;
    }

    return base + cheminNettoye;
  }

  function obtenirUrlDestinationApresConnexion(urlDefaut) {
    const params = new URLSearchParams(window.location.search);
    const retourExplicite = normaliserUrlRetourMembre(params.get("retour"));

    if (retourExplicite) {
      return retourExplicite;
    }

    const session = String(params.get("session") || "").trim().toLowerCase();

    if (session === "inactive" || session === "expiree" || session === "expirée") {
      const retourMemorise = normaliserUrlRetourMembre(lireCookie("retour_membre"));

      if (retourMemorise) {
        return retourMemorise;
      }
    }

    return urlDefaut;
  }

  function programmerProchaineVerificationSessionMembre(data) {
    const delai = nombreSecondesValide(
      data?.nextRefreshInSeconds,
      60 * 60 * 8
    );

    if (typeof window.LCDP_programmerProchaineVerificationSessionMembre === "function") {
      window.LCDP_programmerProchaineVerificationSessionMembre(delai);
      return;
    }

    ecrireCookiePartage(
      "lcdp_session_membre_next_refresh",
      String(Date.now() + delai * 1000),
      60 * 60 * 10
    );
  }

  function effacerRetourMembreApresConnexion() {
    if (typeof window.LCDP_effacerRetourMembre === "function") {
      window.LCDP_effacerRetourMembre();
      return;
    }

    supprimerCookiePartage("retour_membre");
  }

  function normaliserUrlRetourMembre(value) {
    const texte = String(value || "").trim();

    if (!texte) return "";

    let url;

    try {
      url = new URL(texte, window.location.href);
    } catch {
      return "";
    }

    if (typeof window.LCDP_estUrlRetourMembreValide === "function") {
      return window.LCDP_estUrlRetourMembreValide(url.href) ? url.href : "";
    }

    const config = window.SITE_CONFIG || {};
    const membreBaseUrl = nettoyerBaseUrl(
      config.membreBaseUrl ||
      config.MEMBRE_BASE ||
      ""
    );

    if (!membreBaseUrl) return "";

    let membreBase;

    try {
      membreBase = new URL(membreBaseUrl);
    } catch {
      return "";
    }

    if (url.origin !== membreBase.origin) return "";

    const basePath = membreBase.pathname.replace(/\/+$/, "");
    let chemin = url.pathname;

    if (basePath) {
      if (chemin !== basePath && !chemin.startsWith(basePath + "/")) {
        return "";
      }

      chemin = chemin.slice(basePath.length) || "/";
    }

    if (!chemin.startsWith("/ESPACE-MEMBRE/")) return "";
    if (chemin === "/ESPACE-MEMBRE/accueil-membre.html") return "";
    if (chemin === "/index.html" || chemin === "/") return "";

    return url.href;
  }

  function lireCookie(nom) {
    const valeur = document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(nom + "="))
      ?.split("=")
      .slice(1)
      .join("=") || "";

    try {
      return decodeURIComponent(valeur);
    } catch {
      return valeur;
    }
  }

  function ecrireCookiePartage(nom, valeur, maxAgeSecondes) {
    document.cookie = nom + "=" + encodeURIComponent(valeur) + attributsCookiePartage(maxAgeSecondes);
  }

  function supprimerCookiePartage(nom) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const domaine = attributDomaineCookie();

    document.cookie = nom + "=; Path=/; Max-Age=0; SameSite=Lax" + secure;

    if (domaine) {
      document.cookie = nom + "=; Path=/; Max-Age=0; SameSite=Lax" + secure + domaine;
    }
  }

  function attributsCookiePartage(maxAgeSecondes) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const domaine = attributDomaineCookie();
    const maxAge = Number.isFinite(Number(maxAgeSecondes))
      ? "; Max-Age=" + String(Math.max(0, Math.floor(Number(maxAgeSecondes))))
      : "";

    return "; Path=/; SameSite=Lax" + secure + domaine + maxAge;
  }

  function attributDomaineCookie() {
    const hostname = window.location.hostname;

    if (hostname === "lacleduparc.fr" || hostname.endsWith(".lacleduparc.fr")) {
      return "; Domain=.lacleduparc.fr";
    }

    return "";
  }

  function nombreSecondesValide(value, defaut) {
    const nombre = Number(value);

    if (!Number.isFinite(nombre) || nombre <= 0) {
      return defaut;
    }

    return Math.floor(nombre);
  }

  function nettoyerBaseUrl(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function urlTechniqueOuAbsolue(value) {
    return (
      !value ||
      value.startsWith("#") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:")
    );
  }
})();