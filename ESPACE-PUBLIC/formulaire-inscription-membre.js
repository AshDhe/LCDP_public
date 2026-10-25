(() => {
  "use strict";

  const FORMULAIRE_INSCRIPTION_MEMBRE_CONFIG = {
    id: "formulaire-inscription-membre",
    ariaLabel: "Formulaire d'inscription membre invité",
    titre: "Membre invité",
    sousTitre: "Formulaire d'inscription",
    sousTitreClasse: "lcdp-box-formulaire__subtitle--accent",
    introHtml: `
      <p>
        Être membre invité La Clé du Parc est gratuit et vous permet d'être invité(e) par un membre abonné. Ouvrez votre compte pour recevoir des invitations et participer à la vie du club en tant que membre invité.
      </p>
    `,
    champs: [
      {
        type: "text",
        id: "nommembre",
        name: "nommembre",
        label: "Votre NOM",
        required: true,
        placeholder: "NOM",
        autocomplete: "family-name",
        description: "Conforme à votre état civil. En majuscules de préférence. Votre état civil est nécessaire si vous souhaitez devenir membre abonné."
      },
      {
        type: "text",
        id: "prenommembre",
        name: "prenommembre",
        label: "Votre Prénom",
        required: true,
        placeholder: "Prénom",
        autocomplete: "given-name",
        description: "Conforme à votre état civil. En minuscules de préférence, avec la première lettre en majuscule. Votre état civil est nécessaire si vous souhaitez devenir membre abonné."
      },
      {
        type: "text",
        id: "dptmtmembre",
        name: "dptmtmembre",
        label: "Quel est votre département ?",
        required: true,
        placeholder: "Numéro du département (exemple 08)",
        inputmode: "text",
        autocomplete: "off",
        description: "Un numéro du département permet de sélectionner les informations proches de vous en priorité. Il est modifiable directement par la suite depuis votre espace personnel dans l'application."
      },
      {
        type: "email",
        id: "emailmembre",
        name: "emailmembre",
        label: "Votre adresse e-mail personnelle",
        required: true,
        placeholder: "Votre adresse e-mail personnelle",
        autocomplete: "email",
        autocapitalize: "none",
        spellcheck: "false",
        description: "Une adresse e-mail que vous utilisez. C'est votre identifiant informatique de connexion à l'application. Elle est modifiable directement par la suite depuis votre espace personnel dans l'application."
      },
      {
        type: "checkbox",
        id: "unikuser",
        name: "unikuser",
        label: "Utilisateur unique de l'adresse e-mail",
        checkboxLabel: "Je confirme être l'unique utilisateur de l'adresse e-mail.",
        required: true,
        description: ""
      },
      {
        type: "email",
        id: "emailparrain",
        name: "emailparrain",
        label: "Êtes-vous invité(e) par un membre ?",
        required: false,
        placeholder: "E-mail du membre qui vous invite",
        autocomplete: "email",
        autocapitalize: "none",
        spellcheck: "false",
        description: ""
      },
      {
        type: "checkbox",
        id: "regleclub_v1",
        name: "regleclub_v1",
        label: "Règlement du club",
        checkboxLabel: "J'accepte le règlement du club",
        required: true,
        descriptionHtml: `
          L'acceptation du 
          <a
            href="../ESPACE-PUBLIC/reglement-club.html"
            data-site-href="/ESPACE-PUBLIC/reglement-club.html"
            target="_blank"
            rel="noopener noreferrer"
          >règlement du club</a>
          est nécessaire pour être membre du club (invité ou abonné).
        `
      },
      {
        type: "checkbox",
        id: "regleapp_v1",
        name: "regleapp_v1",
        label: "Règlement de l’application",
        checkboxLabel: "J'accepte le règlement de l'application",
        required: true,
        descriptionHtml: `
          L'acceptation du 
          <a
            href="../ESPACE-PUBLIC/reglement-app.html"
            data-site-href="/ESPACE-PUBLIC/reglement-app.html"
            target="_blank"
            rel="noopener noreferrer"
          >règlement de l’application</a>
          est nécessaire pour être membre du club (invité ou abonné).
        `
      }
    ],
    bouton: {
      id: "bouton-envoyer-inscription",
      type: "submit",
      label: "Devenir membre invité",
      style: "lcdp-button-primary"
    },
    noteHtml: `
      * Réponse nécessaire pour vous inscrire.<br>
      Ce formulaire et ses informations sont soumis au
      <a
        href="../ESPACE-PUBLIC/reglement-club.html"
        data-site-href="/ESPACE-PUBLIC/reglement-club.html"
        target="_blank"
        rel="noopener noreferrer"
      >règlement du club</a>
      et au
      <a
        href="../ESPACE-PUBLIC/reglement-app.html"
        data-site-href="/ESPACE-PUBLIC/reglement-app.html"
        target="_blank"
        rel="noopener noreferrer"
      >règlement de l'application</a>.
    `
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserPage);
  } else {
    initialiserPage();
  }

  async function initialiserPage() {
    if (typeof window.LCDP_creerFormulaire !== "function") {
      console.error("Objet formulaire V3 introuvable.");
      await afficherAlerte("Le composant formulaire est introuvable.");
      return;
    }

    await window.LCDP_creerFormulaire(
      "lcdp-formulaire-inscription-slot",
      FORMULAIRE_INSCRIPTION_MEMBRE_CONFIG
    );

    appliquerVarianteSousTitreFormulaireInscription();
    await initialiserFormulaireInscriptionMembre();
  }

  function appliquerVarianteSousTitreFormulaireInscription() {
    const sousTitre = document.querySelector(
      "#formulaire-inscription-membre .lcdp-box-formulaire__subtitle"
    );

    if (sousTitre) {
      sousTitre.classList.add("lcdp-box-formulaire__subtitle--accent");
    }
  }

  async function initialiserFormulaireInscriptionMembre() {
    const racineFormulaire = document.getElementById("formulaire-inscription-membre");
    const form = obtenirElementFormulaireInscription(racineFormulaire);
    const submitButton = document.getElementById("bouton-envoyer-inscription");

    const redirectUrl = construireUrlPublique(
      "/index.html?source=formulaire-inscription-membre"
    );

    let turnstileToken="";
    let widgetId=null;
    let envoiEnCours = false;
    let libelleBoutonInitial = "Devenir membre invité";

    if (!racineFormulaire || !form) {
      console.error("Formulaire introuvable.");
      afficherAlerte(
        "Le formulaire est introuvable. Veuillez réessayer plus tard."
      );
      return;
    }

    if (!submitButton) {
      console.error("Bouton d'envoi introuvable.");
      afficherAlerte(
        "Le bouton d'envoi est introuvable. Veuillez réessayer plus tard."
      );
      return;
    }

    form.noValidate = true;
    form.setAttribute("novalidate", "novalidate");
    libelleBoutonInitial = submitButton.textContent || libelleBoutonInitial;

    form.addEventListener("submit", envoyerFormulaire);
    submitButton.addEventListener("click", envoyerFormulaire);
    submitButton.disabled=true;
    try {
      const url=obtenirWorkerInscriptionMembreUrl();
      if(!url)throw new Error("Service non configuré.");
      const response=await fetch(url,{credentials:"omit",cache:"no-store"});
      const configuration=await response.json();
      if(!response.ok||!configuration.sitekey)throw new Error("Protection indisponible.");
      await chargerTurnstile();
      const emplacement=document.createElement("div");
      emplacement.setAttribute("aria-label","Protection du formulaire");
      submitButton.parentNode.insertBefore(emplacement,submitButton);
      widgetId=window.turnstile.render(emplacement,{sitekey:configuration.sitekey,action:"inscription-membre",
        callback(token){turnstileToken=token;if(!envoiEnCours)submitButton.disabled=false;},
        "expired-callback"(){turnstileToken="";submitButton.disabled=true;},
        "error-callback"(){turnstileToken="";submitButton.disabled=true;}
      });
    } catch {
      await afficherAlerte("La protection du formulaire est indisponible. Rechargez la page pour réessayer.");
    }
    function renouvelerProtection(){
      envoiEnCours=false;turnstileToken="";submitButton.disabled=true;submitButton.textContent=libelleBoutonInitial;
      if(widgetId!==null)window.turnstile.reset(widgetId);
    }

    async function envoyerFormulaire(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (envoiEnCours || submitButton.disabled) return;

      if(!turnstileToken)return;
      const erreur = verifierFormulaire(form);

      if (erreur) {
        await afficherAlerte(erreur);
        return;
      }

      const workerUrl = obtenirWorkerInscriptionMembreUrl();

      if (!workerUrl) {
        await afficherAlerte(
          "L’adresse du service d'inscription membre n’est pas configurée."
        );
        return;
      }

      envoiEnCours = true;
      submitButton.disabled = true;
      submitButton.textContent = "Envoi en cours...";

      const data = {...lireDonneesFormulaire(form),turnstileToken};

      try {
        const response = await fetch(workerUrl, {
          method: "POST",
          credentials: "omit",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result || result.success !== true) {
          const messageErreur = result?.erreurs
            ? result.erreurs[0]
            : result?.message || "Erreur lors de l’envoi du formulaire.";

          await afficherAlerte(messageErreur);

          renouvelerProtection();
          return;
        }

        form.reset();

        await afficherAlerte(
          result.message || "Consultez votre messagerie pour poursuivre votre inscription.",
          redirectUrl
        );
      } catch (error) {
        console.error("Erreur formulaire inscription membre :", error);

        await afficherAlerte(
          "Il n'est pas possible d'envoyer le formulaire pour le moment."
        );

        renouvelerProtection();
      }
    }
  }

  function obtenirWorkerInscriptionMembreUrl() {
    return nettoyerBaseUrl(
      window.SITE_CONFIG?.workerFormInscriptionMembreUrl ||
      window.SITE_CONFIG?.WORKER_FORM_INSCRIPTION_MEMBRE_URL ||
      ""
    );
  }

  function obtenirElementFormulaireInscription(racineFormulaire) {
    if (!racineFormulaire) {
      return null;
    }

    if (racineFormulaire.tagName && racineFormulaire.tagName.toUpperCase() === "FORM") {
      return racineFormulaire;
    }

    return racineFormulaire.querySelector ? racineFormulaire.querySelector("form") : null;
  }

  function lireDonneesFormulaire(form) {
    return {
      nommembre: getValue(form, "nommembre"),
      prenommembre: getValue(form, "prenommembre"),
      dptmtmembre: getValue(form, "dptmtmembre"),
      emailmembre: getValue(form, "emailmembre"),
      emailparrain: getValue(form, "emailparrain"),
      unikuser: getChecked(form, "unikuser"),
      regleclub_v1: getChecked(form, "regleclub_v1"),
      regleapp_v1: getChecked(form, "regleapp_v1")
    };
  }

  function getValue(form, name) {
    const field = form.querySelector(`[name="${name}"]`);
    return field ? field.value.trim() : "";
  }

  function getChecked(form, name) {
    const field = form.querySelector(`[name="${name}"]`);
    return field ? field.checked : false;
  }

  function verifierFormulaire(form) {
    const nommembre = getValue(form, "nommembre");
    const prenommembre = getValue(form, "prenommembre");
    const dptmtmembre = getValue(form, "dptmtmembre");
    const emailmembre = getValue(form, "emailmembre");
    const emailparrain = getValue(form, "emailparrain");
    const emailmembreNormalise = normaliserEmailPourComparaison(emailmembre);
    const emailparrainNormalise = normaliserEmailPourComparaison(emailparrain);

    const unikuser = form.querySelector("#unikuser");
    const regleclub = form.querySelector("#regleclub_v1");
    const regleapp = form.querySelector("#regleapp_v1");

    if (!nomValide(nommembre)) {
      return "Vérifiez votre nom (120 caractères maximum).";
    }

    if (!nomValide(prenommembre)) {
      return "Vérifiez votre prénom (120 caractères maximum).";
    }

    if (!dptmtmembre) {
      return "Un département est nécessaire.";
    }

    if (!/^(?:0[1-9]|1[0-9]|2[1-9]|[3-8][0-9]|9[0-5]|2A|2B|97[1-6])$/i.test(dptmtmembre)) {
      return "Le numéro de département n'est pas valide.";
    }

    if (!emailmembreNormalise) {
      return "Votre adresse e-mail est obligatoire.";
    }

    if (!isValidEmail(emailmembreNormalise)) {
      return "Votre adresse e-mail n'est pas valide.";
    }

    if (emailparrainNormalise && !isValidEmail(emailparrainNormalise)) {
      return "L’adresse e-mail du membre qui vous invite n'est pas valide.";
    }

    if (emailparrainNormalise && emailmembreNormalise === emailparrainNormalise) {
      return "L’adresse e-mail du membre qui vous invite doit être différente de votre adresse e-mail.";
    }

    if (!unikuser || unikuser.checked !== true) {
      return "Vous devez confirmer être l'unique utilisateur de l'adresse e-mail.";
    }

    if (!regleclub || regleclub.checked !== true) {
      return "Le règlement du club doit être accepté.";
    }

    if (!regleapp || regleapp.checked !== true) {
      return "Le règlement de l’application doit être accepté.";
    }

    return "";
  }

  function normaliserEmailPourComparaison(email) {
    return String(email || "").trim().toLowerCase();
  }

  function nomValide(value){return value.length>0&&value.length<=120&&/^[\p{L}\p{M}][\p{L}\p{M} .’'\-]*$/u.test(value.normalize("NFC"));}
  async function chargerTurnstile(){
    if(window.turnstile)return;
    const existant=document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
    if(existant){
      await new Promise((resolve,reject)=>{let essais=0;const timer=setInterval(()=>{if(window.turnstile){clearInterval(timer);resolve();}else if(++essais>=200){clearInterval(timer);reject(new Error("Protection indisponible."));}},100);});return;
    }
    await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});
    if(!window.turnstile)throw new Error("Protection indisponible.");
  }
  function isValidEmail(email) {
    return String(email||"").length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  async function afficherAlerte(message, redirectUrl = "") {
    const slot = document.getElementById("lcdp-lightbox-slot");
    const alerteObligatoire = Boolean(redirectUrl);
    const texteMessage = message || "";

    if (!slot || typeof window.LCDP_chargerFragmentObjet !== "function") {
      alert(texteMessage);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }

      return;
    }

    slot.innerHTML = "";

    try {
      const fragment = await window.LCDP_chargerFragmentObjet("/BOX/02-box-alerte.html");
      slot.appendChild(fragment);

      const alerte = slot.querySelector("[data-lcdp-box-alerte]");
      const messageElement = slot.querySelector("[data-lcdp-alerte-message]");
      const boutonFermer = slot.querySelector("[data-lcdp-alerte-close]");
      const boutonOk = slot.querySelector("[data-lcdp-alerte-ok]");

      if (!alerte || !messageElement || !boutonFermer || !boutonOk) {
        throw new Error("Structure de l'alerte V3 incomplète.");
      }

      messageElement.textContent = texteMessage;

      if (alerteObligatoire) {
        boutonFermer.hidden = true;
        boutonFermer.setAttribute("aria-hidden", "true");
        boutonFermer.tabIndex = -1;
      }

      await new Promise((resolve) => {
        const fermer = () => {
          slot.innerHTML = "";
          resolve();
        };

        boutonOk.addEventListener("click", fermer, { once: true });

        if (!alerteObligatoire) {
          boutonFermer.addEventListener("click", fermer, { once: true });

          alerte.addEventListener("click", (event) => {
            if (event.target === alerte) {
              fermer();
            }
          }, { once: true });
        }
      });

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error("Erreur alerte V3 :", error);

      alert(texteMessage);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }
  }

  function construireUrlPublique(chemin) {
    if (typeof window.LCDP_construireUrlSite === "function") {
      return window.LCDP_construireUrlSite(chemin);
    }

    const valeur = String(chemin || "");

    if (
      valeur.startsWith("#") ||
      valeur.startsWith("mailto:") ||
      valeur.startsWith("tel:") ||
      valeur.startsWith("http://") ||
      valeur.startsWith("https://")
    ) {
      return valeur;
    }

    const publicBaseUrl = nettoyerBaseUrl(
      window.SITE_CONFIG?.publicBaseUrl ||
      window.SITE_CONFIG?.PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    );

    if (publicBaseUrl) {
      return joindreBaseEtChemin(publicBaseUrl, valeur);
    }

    return valeur.startsWith("/") ? ".." + valeur : valeur;
  }

  function joindreBaseEtChemin(baseUrl, chemin) {
    const base = nettoyerBaseUrl(baseUrl);
    const cheminNettoye = "/" + String(chemin || "").replace(/^\/+/, "");

    if (!base) {
      return cheminNettoye;
    }

    return base + cheminNettoye;
  }

  function nettoyerBaseUrl(value) {
    return String(value || "").replace(/\/+$/, "");
  }
})();
