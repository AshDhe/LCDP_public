(() => {
  "use strict";

  const FORMULAIRE_LISTE_ATTENTE_CONFIG = {
    id: "formulaire-liste-attente",
    ariaLabel: "Formulaire de pré-inscription",
    titre: "Pré-inscription",
    sousTitre: "",
    introHtml: `
      <p>
        Partagez dès maintenant votre passion du plein air d'exception et soyez informé(e) de l'actualité du club avant l'ouverture de la prochaine saison.
        Cette pré-inscription n'implique aucun engagement de votre part.
        </p>
    `,
    champs: [
      {
        type: "text",
        id: "nom",
        name: "nom",
        label: "Votre NOM",
        required: true,
        placeholder: "...",
        autocomplete: "family-name"
      },
      {
        type: "text",
        id: "prenom",
        name: "prenom",
        label: "Votre prénom",
        required: true,
        placeholder: "...",
        autocomplete: "given-name"
      },
      {
        type: "text",
        id: "departement",
        name: "departement",
        label: "Votre département de coeur ou de résidence",
        required: true,
        placeholder: "Le numéro (par exemple : 08)",
        inputmode: "text",
        autocomplete: "off"
      },
      {
        type: "number",
        id: "age",
        name: "age",
        label: "Voulez-vous dire votre âge ?",
        required: false,
        placeholder: "Par exemple : 40",
        inputmode: "numeric",
        min: "18",
        max: "100"
      },
      {
        type: "email",
        id: "email",
        name: "email",
        label: "Votre e-mail",
        required: true,
        placeholder: "Celui auquel on peut vous écrire personnellement :)",
        autocomplete: "email",
        autocapitalize: "none",
        spellcheck: "false"
      },
      {
        type: "textarea",
        id: "texte_libre",
        name: "texte_libre",
        label: "Votre passion pour le plein air d'exception",
        required: false,
        placeholder: "Dîtes-en nous un peu plus sur votre passion du plein air d'exception et votre motivation à bénéficier de La Clé du Parc."
      },
      {
        type: "checkbox",
        id: "responsable_parc",
        name: "responsable_parc",
        label: "Responsable de parc",
        checkboxLabel: "Êtes-vous responsable de parc et souhaitez-vous être contacté(e) ?",
        required: false
      },
      {
        type: "checkbox",
        id: "responsable_activite",
        name: "responsable_activite",
        label: "Responsable d'activité",
        checkboxLabel: "Êtes-vous coach d'activité et souhaitez-vous être contacté(e) ?",
        required: false
      }
    ],
    bouton: {
      id: "bouton-envoyer-liste-attente",
      type: "submit",
      label: "Pré-inscription",
      style: "lcdp-button-orange"
    },
    noteHtml: `
      * Votre réponse est nécessaire pour enregistrer votre pré-inscription.<br>
      Les informations que vous partagez dans ce formulaire sont soumises à l'application des mentions légales et sont exclusivement réservées au club La Clé du Parc. Consultez les mentions légales pour en savoir plus sur le traitement de vos données personnelles par La Clé du Parc.
    `
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserPageListeAttente);
  } else {
    initialiserPageListeAttente();
  }

  async function initialiserPageListeAttente() {
    appliquerRoutesSiteListeAttente(document);

    initialiserBandeauListeAttente().catch((erreur) => {
      console.error("Erreur bandeau liste d'attente :", erreur);
    });

    initialiserFooterListeAttente().catch((erreur) => {
      console.error("Erreur footer liste d'attente :", erreur);
    });

    if (typeof window.LCDP_creerFormulaire !== "function") {
      console.error("Objet formulaire V3 introuvable.");
      await afficherInformationListeAttente(
        "Erreur technique",
        "Le composant formulaire est introuvable.",
        "erreur"
      );
      return;
    }

    await window.LCDP_creerFormulaire(
      "lcdp-formulaire-liste-attente-slot",
      FORMULAIRE_LISTE_ATTENTE_CONFIG
    );

    appliquerSousTitreOrangeListeAttente();
    await initialiserFormulaireListeAttente();
  }

  async function initialiserFormulaireListeAttente() {
    const formulaire = document.getElementById("formulaire-liste-attente");
    const boutonEnvoyer = document.getElementById("bouton-envoyer-liste-attente");
    const champAge = document.getElementById("age");

    const endpoint = obtenirEndpointListeAttente();
    const redirectUrl = construireUrlAccueilPublic();

    let turnstileToken="";
    let widgetId=null;
    let requestId=crypto.randomUUID();
    let dernierPayload="";
    let envoiEnCours = false;
    let texteBoutonInitial = "M'inscrire sur liste d'attente";

    if (boutonEnvoyer) {
      texteBoutonInitial = boutonEnvoyer.textContent.trim() || texteBoutonInitial;
    }

    if (champAge) {
      champAge.setAttribute("min", "18");
      champAge.setAttribute("max", "100");
    }

    if (!formulaire) {
      console.error("Formulaire liste d'attente introuvable.");
      afficherInformationListeAttente(
        "Erreur technique",
        "Le formulaire est introuvable. Veuillez réessayer plus tard.",
        "erreur"
      );
      return;
    }

    if (!boutonEnvoyer) {
      console.error("Bouton d'envoi liste d'attente introuvable.");
      afficherInformationListeAttente(
        "Erreur technique",
        "Le bouton d'envoi est introuvable. Veuillez réessayer plus tard.",
        "erreur"
      );
      return;
    }

    if (!endpoint) {
      boutonEnvoyer.disabled = true;

      afficherInformationListeAttente(
        "Configuration manquante",
        "L’adresse du service de liste d'attente n’est pas configurée.",
        "erreur"
      );
      return;
    }

    formulaire.addEventListener("submit", async (event) => {
      event.preventDefault();
      await envoyerFormulaireListeAttente();
    });

    boutonEnvoyer.disabled=true;
    for(const [id,max] of [["nom",120],["prenom",120],["email",254],["texte_libre",2000]])document.getElementById(id)?.setAttribute("maxlength",String(max));
    try{
      const reponse=await fetch(endpoint,{credentials:"omit",cache:"no-store"});
      const configuration=await reponse.json();
      if(!reponse.ok||!configuration.sitekey)throw new Error("Protection indisponible.");
      await chargerTurnstileListe();
      const emplacement=document.createElement("div");
      emplacement.setAttribute("aria-label","Protection du formulaire");
      boutonEnvoyer.parentNode.insertBefore(emplacement,boutonEnvoyer);
      widgetId=window.turnstile.render(emplacement,{sitekey:configuration.sitekey,action:"liste-attente",
        callback(token){turnstileToken=token;if(!envoiEnCours)boutonEnvoyer.disabled=false;},
        "expired-callback"(){turnstileToken="";boutonEnvoyer.disabled=true;},
        "error-callback"(){turnstileToken="";boutonEnvoyer.disabled=true;}
      });
    }catch{
      await afficherInformationListeAttente("","La protection du formulaire est indisponible. Rechargez la page pour réessayer.","erreur");
    }
    function renouvelerProtection(){
      envoiEnCours=false;turnstileToken="";boutonEnvoyer.disabled=true;boutonEnvoyer.textContent=texteBoutonInitial;
      if(widgetId!==null)window.turnstile.reset(widgetId);
    }
    async function envoyerFormulaireListeAttente() {
      if (envoiEnCours || boutonEnvoyer.disabled || !turnstileToken) return;

      const payload = lireDonneesListeAttente();
      const erreur = validerPayloadListeAttente(payload);

      if (erreur) {
        await afficherInformationListeAttente("", erreur, "erreur");
        return;
      }

      const contenu=JSON.stringify(payload);
      if(dernierPayload&&dernierPayload!==contenu)requestId=crypto.randomUUID();
      dernierPayload=contenu;
      envoiEnCours = true;
      boutonEnvoyer.disabled = true;
      boutonEnvoyer.textContent = "Envoi en cours...";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "omit",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({...payload,requestId,turnstileToken})
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data || data.success !== true) {
          await afficherInformationListeAttente(
            "Inscription non enregistrée",
            data?.message || "Votre inscription n'a pas pu être enregistrée.",
            "erreur"
          );

          renouvelerProtection();
          return;
        }

        formulaire.reset();
        const messageConfirmation=data.message || "Votre demande est traitée. Consultez votre messagerie.";

        await afficherInformationListeAttente(
          "",
          messageConfirmation,
          "validation",
          {
            redirectUrl
          }
        );

        renouvelerProtection();

      } catch (error) {
        console.error("Erreur formulaire liste d'attente :", error);

        await afficherInformationListeAttente(
          "Erreur",
          "Il n'est pas possible d'envoyer le formulaire pour le moment.",
          "erreur"
        );

        renouvelerProtection();
      }
    }
  }

  function lireDonneesListeAttente() {
    return {
      nom: lireValeurListeAttente("nom"),
      prenom: lireValeurListeAttente("prenom"),
      departement: normaliserDepartementListeAttente(lireValeurListeAttente("departement")),
      age: lireNombreOptionnelListeAttente("age"),
      email: lireValeurListeAttente("email").toLowerCase(),
      texte_libre: lireValeurListeAttente("texte_libre"),
      responsable_parc: document.getElementById("responsable_parc")?.checked === true,
      responsable_activite: document.getElementById("responsable_activite")?.checked === true
    };
  }

  function lireValeurListeAttente(id) {
    return String(document.getElementById(id)?.value || "").trim();
  }

  function lireNombreOptionnelListeAttente(id) {
    const valeur = lireValeurListeAttente(id);

    if (!valeur) return null;

    const nombre = /^\d{2,3}$/.test(valeur) ? Number(valeur) : NaN;

    return Number.isInteger(nombre) ? nombre : NaN;
  }

  function normaliserDepartementListeAttente(valeur) {
    const departement = String(valeur || "").trim().toUpperCase();

    if (/^\d$/.test(departement)) {
      return "0" + departement;
    }

    return departement;
  }

  function validerPayloadListeAttente(payload) {
    if (!nomValideListe(payload.nom)) {
      return "Vérifiez votre nom (120 caractères maximum).";
    }

    if (!nomValideListe(payload.prenom)) {
      return "Vérifiez votre prénom (120 caractères maximum).";
    }

    if (!payload.departement) {
      return "Vous n'avez pas indiqué de département.";
    }

    if (!/^(?:0[1-9]|1[0-9]|2[1-9]|[3-8][0-9]|9[0-5]|2A|2B|97[1-6])$/i.test(payload.departement)) {
      return "Le numéro de département n'est pas valide.";
    }

    if (
      payload.age !== null &&
      (
        !Number.isInteger(payload.age) ||
        payload.age < 18 ||
        payload.age > 100
      )
    ) {
      return "Votre âge n'est pas conforme.";
    }

    if (!payload.email) {
      return "Votre adresse e-mail est nécessaire.";
    }

    if (!isValidEmailListeAttente(payload.email)) {
      return "Votre adresse mail n'est pas conforme.";
    }

    if(payload.texte_libre.length>2000)return "Le texte libre est limité à 2 000 caractères.";
    return "";
  }

  function nomValideListe(value){return value.length>0&&value.length<=120&&/^[\p{L}\p{M}][\p{L}\p{M} .’'\-]*$/u.test(value.normalize("NFC"));}
  async function chargerTurnstileListe(){
    if(window.turnstile)return;
    const existant=document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
    if(existant){
      await new Promise((resolve,reject)=>{let essais=0;const timer=setInterval(()=>{if(window.turnstile){clearInterval(timer);resolve();}else if(++essais>=200){clearInterval(timer);reject(new Error("Protection indisponible."));}},100);});return;
    }
    await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});
    if(!window.turnstile)throw new Error("Protection indisponible.");
  }
  function isValidEmailListeAttente(email) {
    return email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function obtenirEndpointListeAttente() {
    const config = window.SITE_CONFIG || {};

    const depuisConfig =
      config.workerLaUrl ||
      config.WORKER_LA_URL ||
      "";

    if (depuisConfig) {
      return nettoyerBaseUrlListeAttente(depuisConfig);
    }

    if (typeof config.apiUrl === "function") {
      return nettoyerBaseUrlListeAttente(config.apiUrl("la-api"));
    }

    return "";
  }

  function construireUrlAccueilPublic() {
    const config = window.SITE_CONFIG || {};

    if (typeof config.publicUrl === "function") {
      return config.publicUrl("/ESPACE-PUBLIC/hello.html");
    }

    const base = nettoyerBaseUrlListeAttente(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    );

    return base ? base + "/ESPACE-PUBLIC/hello.html" : "/ESPACE-PUBLIC/hello.html";
  }

  function nettoyerBaseUrlListeAttente(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function appliquerSousTitreOrangeListeAttente() {
    const sousTitre = document.querySelector(
      "#lcdp-formulaire-liste-attente-slot [data-lcdp-formulaire-subtitle]"
    );

    if (!sousTitre) return;

    sousTitre.classList.add("lcdp-formulaire-liste-attente__subtitle--orange");
  }

  async function initialiserBandeauListeAttente() {
    const slot = document.getElementById("lcdp-bandeau-slot");

    if (!slot) return;

    slot.innerHTML = "";

    const fragment = await chargerFragmentSiteListeAttente("/ESPACE-PUBLIC/box-bandeau-nav-public.html");
    slot.appendChild(fragment);
    configurerBandeauRestreintListeAttente(slot);
    appliquerRoutesSiteListeAttente(slot);
  }

  function configurerBandeauRestreintListeAttente(slot) {
    const lien = slot.querySelector(".lcdp-box-bandeau-nav__logo-link");
    const libelle = slot.querySelector("[data-lcdp-bandeau-nav-label], .lcdp-box-bandeau-nav__space-label");
    const burgerSlot = slot.querySelector("[data-lcdp-burger-slot], .lcdp-box-bandeau-nav__burger-slot");

    if (lien) {
      lien.setAttribute("href", construireUrlSiteListeAttente("/ESPACE-PUBLIC/hello.html"));
      lien.dataset.siteHref = "/ESPACE-PUBLIC/hello.html";
      lien.setAttribute("aria-label", "Accueil restreint La Clé du Parc");
    }

    if (libelle) {
      libelle.textContent = "";
      libelle.classList.add("lcdp-bandeau-restreint-label");

      const titre = document.createElement("span");
      titre.className = "lcdp-bandeau-restreint-title";
      titre.textContent = "La Clé du Parc";

      const sousTitre = document.createElement("span");
      sousTitre.className = "lcdp-bandeau-restreint-subtitle";
      sousTitre.textContent = "Accès restreint à l'application";

      libelle.appendChild(titre);
      libelle.appendChild(sousTitre);
    }

    if (burgerSlot) {
      burgerSlot.remove();
    }
  }

  async function initialiserFooterListeAttente() {
    const fragment = await chargerFragmentSiteListeAttente("/OBJET/BOX/02-box-footer.html");
    const slot = document.getElementById("lcdp-footer-slot");

    if (slot) {
      slot.innerHTML = "";
      slot.appendChild(fragment);
      appliquerRoutesSiteListeAttente(slot);
      return;
    }

    const footerLocal = document.querySelector("footer[data-lcdp-box-footer]");

    if (footerLocal) {
      const conteneur = document.createElement("div");
      conteneur.appendChild(fragment);
      appliquerRoutesSiteListeAttente(conteneur);
      footerLocal.replaceWith(...Array.from(conteneur.childNodes));
    }
  }

  function appliquerRoutesSiteListeAttente(racine = document) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlSiteListeAttente(element.dataset.siteHref));
    });

    racine.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlSiteListeAttente(element.dataset.siteSrc));
    });
  }

  function construireUrlSiteListeAttente(chemin) {
    const valeur = String(chemin || "");

    if (
      !valeur ||
      valeur.startsWith("#") ||
      valeur.startsWith("mailto:") ||
      valeur.startsWith("tel:") ||
      valeur.startsWith("http://") ||
      valeur.startsWith("https://") ||
      valeur.startsWith("data:")
    ) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.publicUrl === "function") {
      return config.publicUrl(valeur);
    }

    const base = nettoyerBaseUrlListeAttente(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    );

    if (base) {
      return base + "/" + valeur.replace(/^\/+/, "");
    }

    return valeur.startsWith("/") ? ".." + valeur : valeur;
  }

  async function afficherInformationListeAttente(titre, message, type = "information", options = {}) {
    const slot = document.getElementById("lcdp-lightbox-slot");
    const texte = titre ? `${titre}\n\n${message}` : message;

    if (!slot) {
      alert(message);

      if (options.redirectUrl) {
        window.location.href = options.redirectUrl;
      }

      return;
    }

    slot.innerHTML = "";

    try {
      const fragment = await chargerFragmentObjetListeAttente("/BOX/02-box-alerte.html");
      slot.appendChild(fragment);

      const alerte = slot.querySelector("[data-lcdp-box-alerte]");
      const messageElement = slot.querySelector("[data-lcdp-alerte-message]");
      const boutonFermer = slot.querySelector("[data-lcdp-alerte-close]");
      const boutonOk = slot.querySelector("[data-lcdp-alerte-ok]");

      if (!alerte || !messageElement || !boutonFermer || !boutonOk) {
        throw new Error("Structure de l'alerte V3 incomplète.");
      }

      alerte.dataset.type = type;
      messageElement.textContent = texte;

      await new Promise((resolve) => {
        let ferme = false;

        const fermer = () => {
          if (ferme) return;
          ferme = true;
          slot.innerHTML = "";
          resolve();
        };

        boutonFermer.addEventListener("click", fermer, { once: true });
        boutonOk.addEventListener("click", fermer, { once: true });

        alerte.addEventListener("click", (event) => {
          if (event.target === alerte) {
            fermer();
          }
        });

        document.addEventListener(
          "keydown",
          (event) => {
            if (event.key === "Escape") {
              fermer();
            }
          },
          { once: true }
        );
      });

      if (options.redirectUrl) {
        window.location.href = options.redirectUrl;
      }

    } catch (error) {
      console.error("Erreur alerte liste d'attente :", error);

      alert(message);

      if (options.redirectUrl) {
        window.location.href = options.redirectUrl;
      }
    }
  }

  async function chargerFragmentSiteListeAttente(chemin) {
    const reponse = await fetch(construireUrlSiteListeAttente(chemin), {
      method: "GET",
      credentials: "same-origin",
      cache: "no-cache"
    });

    if (!reponse.ok) {
      throw new Error("Fragment introuvable : " + chemin);
    }

    const html = await reponse.text();
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.cloneNode(true);
  }

  async function chargerFragmentObjetListeAttente(chemin) {
    const reponse = await fetch(construireUrlObjetListeAttente(chemin), {
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

  function construireUrlObjetListeAttente(chemin) {
    const valeur = String(chemin || "");

    if (
      !valeur ||
      valeur.startsWith("#") ||
      valeur.startsWith("mailto:") ||
      valeur.startsWith("tel:") ||
      valeur.startsWith("http://") ||
      valeur.startsWith("https://") ||
      valeur.startsWith("data:")
    ) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.objetUrl === "function") {
      return config.objetUrl(valeur);
    }

    const objetBaseUrl = nettoyerBaseUrlListeAttente(
      config.objetBaseUrl ||
      config.OBJET_BASE ||
      ""
    );

    const cheminNettoye = valeur
      .replace(/^\/+/, "")
      .replace(/^OBJET\/+/, "");

    if (objetBaseUrl) {
      return objetBaseUrl + "/" + cheminNettoye;
    }

    return "../OBJET/" + cheminNettoye;
  }
})();
