(() => {
  "use strict";

  const FORMULAIRE_LISTE_ATTENTE_CONFIG = {
    id: "formulaire-liste-attente",
    ariaLabel: "Formulaire de pré-inscription 2027",
    titre: "Pré-inscription 2027",
    sousTitre: "Sans engagement",
    introHtml: `
      <p>
        Partagez votre passion du plein air d'exception et gagnez 10 "points passion" La Clé du Parc pour 2027. Soyez informé(e) de l'actualité du club avant l'ouverture de la saison 2027 pour vous et vos proches.
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
        checkboxLabel: "Êtes-vous responsable d'un parc plein air et intéressé par nos activités ?",
        required: false
      },
      {
        type: "checkbox",
        id: "responsable_activite",
        name: "responsable_activite",
        label: "Responsable d'activité",
        checkboxLabel: "Êtes-vous responsable d'activité de plein air ou coach dans les domaines artistiques, sportifs ou culturels et intéressé par nos activités ?",
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
      * Votre réponse est nécessaire pour enregistrer votre pré-inscription. Les informations que vous partagez dans ce formulaire sont soumises à l'application des mentions légales. En particulier, elles sont exclusivement réservées au club La Clé du Parc et ne font l'objet d'aucun partage avec un tiers. Consultez les memtions légales pour en savoir plus à propos du traitement appliqué à ces informations.
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

    initialiserBoutonMentionsLegalesListeAttente();

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
    initialiserFormulaireListeAttente();
  }

  function initialiserFormulaireListeAttente() {
    const formulaire = document.getElementById("formulaire-liste-attente");
    const boutonEnvoyer = document.getElementById("bouton-envoyer-liste-attente");
    const champAge = document.getElementById("age");

    const endpoint = obtenirEndpointListeAttente();
    const redirectUrl = construireUrlAccueilPublic();

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

    async function envoyerFormulaireListeAttente() {
      if (envoiEnCours || boutonEnvoyer.disabled) return;

      const payload = lireDonneesListeAttente();
      const erreur = validerPayloadListeAttente(payload);

      if (erreur) {
        await afficherInformationListeAttente("", erreur, "erreur");
        return;
      }

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
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data || data.success !== true) {
          await afficherInformationListeAttente(
            "Inscription non enregistrée",
            data?.message || "Votre inscription n'a pas pu être enregistrée.",
            "erreur"
          );

          envoiEnCours = false;
          boutonEnvoyer.disabled = false;
          boutonEnvoyer.textContent = texteBoutonInitial;
          return;
        }

        const prenomConfirmation = String(payload.prenom || "").trim();

        formulaire.reset();

        const messageConfirmation = [
          `Bonjour ${prenomConfirmation},`,
          "Votre pré-inscription est bien enregistrée. Merci !",
          "Nous vous avons envoyé un e-mail de confirmation.",
          "Un cadeau vous y attend à l'intérieur 😀🗝️ !"
        ].join("\n");

        await afficherInformationListeAttente(
          "",
          messageConfirmation,
          "validation",
          {
            redirectUrl
          }
        );

        envoiEnCours = false;
        boutonEnvoyer.disabled = false;
        boutonEnvoyer.textContent = texteBoutonInitial;

      } catch (error) {
        console.error("Erreur formulaire liste d'attente :", error);

        await afficherInformationListeAttente(
          "Erreur",
          "Il n'est pas possible d'envoyer le formulaire pour le moment.",
          "erreur"
        );

        envoiEnCours = false;
        boutonEnvoyer.disabled = false;
        boutonEnvoyer.textContent = texteBoutonInitial;
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

    const nombre = Number.parseInt(valeur, 10);

    return Number.isInteger(nombre) ? nombre : null;
  }

  function normaliserDepartementListeAttente(valeur) {
    const departement = String(valeur || "").trim().toUpperCase();

    if (/^\d$/.test(departement)) {
      return "0" + departement;
    }

    return departement;
  }

  function validerPayloadListeAttente(payload) {
    if (!payload.nom) {
      return "Votre nom n'est pas renseigné.";
    }

    if (!payload.prenom) {
      return "Votre prénom n'est pas renseigné.";
    }

    if (!payload.departement) {
      return "Vous n'avez pas indiqué de département.";
    }

    if (!/^(?:\d{2,3}|2A|2B)$/i.test(payload.departement)) {
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

    return "";
  }

  function isValidEmailListeAttente(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  function initialiserBoutonMentionsLegalesListeAttente() {
    const bouton = document.getElementById("bouton-mentions-legales");
    if (!bouton) return;

    bouton.addEventListener("click", () => {
      ouvrirMentionsLegalesRestreintes().catch(console.error);
    });
  }

  function obtenirEndpointEditingAdmin() {
    const config = window.SITE_CONFIG || {};
    const direct = nettoyerBaseUrlListeAttente(
      config.workerEditingAdminUrl ||
      config.WORKER_EDITING_ADMIN_URL ||
      config.W_EDITING_ADMIN_URL ||
      config.editingAdminUrl ||
      ""
    );

    if (direct) return direct;

    if (typeof config.apiUrl === "function") {
      return nettoyerBaseUrlListeAttente(config.apiUrl("editing-admin-api"));
    }

    return "https://editing-admin-api.lacleduparc.fr";
  }

  async function chargerMentionsLegales() {
    const endpoint = obtenirEndpointEditingAdmin();

    if (!endpoint) {
      throw new Error("Endpoint mentions légales non configuré.");
    }

    const reponse = await fetch(endpoint + "/public/mentions-legales", {
      method: "GET",
      credentials: "omit",
      cache: "no-store",
      headers: {
        "Accept": "application/json"
      }
    });

    const data = await reponse.json().catch(() => null);

    if (!reponse.ok || !data || data.success !== true) {
      throw new Error(data?.message || "Mentions légales indisponibles.");
    }

    return data;
  }

  async function ouvrirMentionsLegalesRestreintes() {
    const slot = document.getElementById("lcdp-lightbox-slot");
    if (!slot) return;

    slot.innerHTML = "";

    const overlay = document.createElement("div");
    overlay.className = "lcdp-restricted-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Mentions légales");

    const card = document.createElement("div");
    card.className = "lcdp-restricted-legal-card";

    const boutonFermer = document.createElement("button");
    boutonFermer.className = "lcdp-restricted-legal-close";
    boutonFermer.type = "button";
    boutonFermer.setAttribute("aria-label", "Fermer");
    boutonFermer.textContent = "×";

    const section = document.createElement("section");
    section.className = "lcdp-box-liste-card";
    section.setAttribute("data-lcdp-box-liste-card", "");
    section.innerHTML =
      '<div class="lcdp-box-liste-card__header">' +
        '<div class="lcdp-box-liste-card__heading">' +
          '<h2 class="lcdp-box-liste-card__title">Mentions légales</h2>' +
        '</div>' +
      '</div>' +
      '<div class="lcdp-box-liste-card__list" data-mentions-legales-list>' +
        '<p class="lcdp-box-liste-card__message">Chargement...</p>' +
      '</div>';

    card.appendChild(boutonFermer);
    card.appendChild(section);
    overlay.appendChild(card);
    slot.appendChild(overlay);

    const fermer = () => {
      slot.innerHTML = "";
    };

    boutonFermer.addEventListener("click", fermer, { once: true });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) fermer();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") fermer();
    }, { once: true });

    const liste = section.querySelector("[data-mentions-legales-list]");

    try {
      const documentLegal = await chargerMentionsLegales();
      const titre = section.querySelector(
        ".lcdp-box-liste-card__title"
      );

      if (titre) {
        titre.textContent =
          documentLegal.titre || "Mentions légales";
      }

      await rendreMentionsLegalesRestreintes(
        liste,
        documentLegal,
        overlay
      );
    } catch (error) {
      console.error("Erreur mentions légales :", error);
      liste.innerHTML = '<p class="lcdp-box-liste-card__message" data-lcdp-message-type="erreur">Les mentions légales ne sont pas disponibles pour le moment.</p>';
    }
  }


  async function rendreMentionsLegalesRestreintes(
    liste,
    documentLegal,
    overlay
  ) {
    liste.innerHTML = "";

    const blocs = Array.isArray(documentLegal?.blocs)
      ? documentLegal.blocs
      : [];
    let dernierContenu = null;

    if (blocs.length === 0) {
      const message = document.createElement("p");
      message.className = "lcdp-box-liste-card__message";
      message.textContent = "Mentions légales non publiées.";
      liste.appendChild(message);
      return;
    }

    blocs.forEach((bloc) => {
      const article = document.createElement("section");
      article.className = "lcdp-component lcdp-boxtext";

      const titreBloc = document.createElement("h3");
      titreBloc.className = "lcdp-boxtext__title";
      titreBloc.textContent = String(bloc?.titre || "");

      const contenu = document.createElement("div");
      contenu.className = "lcdp-boxtext__content";
      contenu.innerHTML = String(bloc?.html || "");
      supprimerParagraphesVidesMentionsLegales(
        contenu
      );

      article.appendChild(titreBloc);
      article.appendChild(contenu);
      liste.appendChild(article);
      dernierContenu = contenu;
    });

    if (dernierContenu) {
      ajouterBoutonDemandeJuridique(
        dernierContenu,
        () => ouvrirFormulaireDemandeJuridiqueRestreint(
          liste,
          documentLegal,
          overlay
        )
      );
    }

    appliquerRoutesSiteListeAttente(liste);
  }

  function supprimerParagraphesVidesMentionsLegales(
    conteneur
  ) {
    conteneur.querySelectorAll("p").forEach(
      (paragraphe) => {
        const contenuHtml = String(
          paragraphe.innerHTML || ""
        )
          .replace(/&nbsp;/gi, "")
          .replace(/<br\s*\/?>/gi, "")
          .replace(/\s+/g, "");

        const contenuTexte = String(
          paragraphe.textContent || ""
        ).trim();

        if (!contenuHtml && !contenuTexte) {
          paragraphe.remove();
        }
      }
    );
  }

  function ajouterBoutonDemandeJuridique(
    conteneur,
    action
  ) {
    const actions = document.createElement("div");
    actions.className = "lcdp-box-formulaire__actions";

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className =
      "lcdp-button lcdp-button-secondary";
    bouton.textContent = "Demande juridique";
    bouton.addEventListener("click", action);

    actions.appendChild(bouton);
    conteneur.appendChild(actions);
  }

  async function ouvrirFormulaireDemandeJuridiqueRestreint(
    liste,
    documentLegal,
    overlay
  ) {
    if (
      typeof window.LCDP_creerFormulaire !==
      "function"
    ) {
      throw new Error(
        "Objet formulaire indisponible."
      );
    }

    liste.innerHTML = "";

    const slotFormulaire = document.createElement("div");
    liste.appendChild(slotFormulaire);

    const form = await window.LCDP_creerFormulaire(
      slotFormulaire,
      configurationDemandeJuridique()
    );

    if (!form) {
      throw new Error(
        "Formulaire de demande juridique non créé."
      );
    }

    form.querySelector(
      "#bouton-retour-mentions-legales"
    )?.addEventListener("click", () => {
      rendreMentionsLegalesRestreintes(
        liste,
        documentLegal,
        overlay
      ).catch(console.error);
    });

    const boutonEnvoyer = form.querySelector(
      "#bouton-envoyer-demande-juridique"
    );
    let traitementEnCours = false;

    async function traiterEnvoiDemandeJuridique(event) {
      event?.preventDefault();

      if (traitementEnCours) {
        return;
      }

      if (!form.reportValidity()) {
        return;
      }

      const payload =
        lireFormulaireDemandeJuridique(form);
      const erreur =
        validerDemandeJuridique(payload);

      if (erreur) {
        await afficherAlerteDemandeJuridique(
          erreur,
          "erreur",
          overlay
        );
        return;
      }

      try {
        const confirme =
          await demanderConfirmationDemandeJuridique(
            overlay
          );

        if (!confirme) {
          return;
        }

        traitementEnCours = true;

        const boutons = Array.from(
          form.querySelectorAll("button")
        );

        boutons.forEach((bouton) => {
          bouton.disabled = true;
        });

        await envoyerDemandeJuridique(payload);
        form.reset();

        await afficherAlerteDemandeJuridique(
          "Votre demande est envoyée.",
          "validation",
          overlay
        );

        await rendreMentionsLegalesRestreintes(
          liste,
          documentLegal,
          overlay
        );
      } catch (error) {
        form.querySelectorAll("button").forEach(
          (bouton) => {
            bouton.disabled = false;
          }
        );

        const message = String(
          error?.message ||
          error ||
          "La demande n’a pas pu être envoyée."
        );

        try {
          await afficherAlerteDemandeJuridique(
            message,
            "erreur",
            overlay
          );
        } catch (erreurAlerte) {
          console.error(
            "Erreur affichage demande juridique :",
            erreurAlerte
          );
          window.alert(message);
        }
      } finally {
        traitementEnCours = false;
      }
    }

    form.addEventListener(
      "submit",
      traiterEnvoiDemandeJuridique
    );

    boutonEnvoyer?.addEventListener(
      "click",
      traiterEnvoiDemandeJuridique
    );
  }

  function configurationDemandeJuridique() {
    return {
      id: "formulaire-demande-juridique",
      ariaLabel: "Formulaire de demande juridique",
      titre: "Demande juridique",
      introHtml:
        "<p>Renseignez vos coordonnées et la raison de votre demande.</p>",
      validationNative: true,
      champs: [
        {
          type: "text",
          id: "demande-juridique-nom",
          name: "nom",
          label: "Votre nom",
          required: true,
          autocomplete: "family-name",
          maxlength: 120
        },
        {
          type: "text",
          id: "demande-juridique-prenom",
          name: "prenom",
          label: "Votre prénom",
          required: true,
          autocomplete: "given-name",
          maxlength: 120
        },
        {
          type: "email",
          id: "demande-juridique-email",
          name: "email",
          label: "Votre e-mail",
          required: true,
          autocomplete: "email",
          autocapitalize: "none",
          spellcheck: "false",
          maxlength: 254
        },
        {
          type: "textarea",
          id: "demande-juridique-motif",
          name: "motif",
          label: "Raison de votre demande juridique",
          required: true,
          maxlength: 4000
        }
      ],
      boutons: [
        {
          id: "bouton-envoyer-demande-juridique",
          type: "submit",
          label: "Envoyer",
          style: "lcdp-button-orange"
        },
        {
          id: "bouton-retour-mentions-legales",
          type: "button",
          label: "Retour aux mentions légales",
          style: "lcdp-button-secondary"
        }
      ]
    };
  }

  function lireFormulaireDemandeJuridique(form) {
    return {
      nom: String(
        form.elements.namedItem("nom")?.value || ""
      ).trim(),
      prenom: String(
        form.elements.namedItem("prenom")?.value || ""
      ).trim(),
      email: String(
        form.elements.namedItem("email")?.value || ""
      ).trim().toLowerCase(),
      motif: String(
        form.elements.namedItem("motif")?.value || ""
      ).trim(),
      source: "formulaire-liste-attente"
    };
  }

  function validerDemandeJuridique(payload) {
    if (!payload.nom) {
      return "Votre nom est obligatoire.";
    }

    if (!payload.prenom) {
      return "Votre prénom est obligatoire.";
    }

    if (!payload.email || !isValidEmailListeAttente(payload.email)) {
      return "Votre adresse e-mail n’est pas valide.";
    }

    if (!payload.motif) {
      return "La raison de votre demande est obligatoire.";
    }

    return "";
  }

  async function envoyerDemandeJuridique(payload) {
    const endpoint = obtenirEndpointEditingAdmin();

    if (!endpoint) {
      throw new Error(
        "Service de demande juridique non configuré."
      );
    }

    const response = await fetch(
      endpoint + "/public/demande-juridique",
      {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (
      !response.ok ||
      !data ||
      data.success !== true
    ) {
      throw new Error(
        data?.message ||
        data?.detail ||
        "La demande n’a pas pu être envoyée."
      );
    }

    return data;
  }

  async function demanderConfirmationDemandeJuridique(
    overlay
  ) {
    const slot = document.getElementById(
      "lcdp-lightbox-slot"
    );

    if (!slot) {
      throw new Error(
        "Slot de dialogue introuvable."
      );
    }

    const fragment = await chargerFragmentObjetListeAttente(
      "/BOX/02-box-dialogue-bouton.html"
    );
    const couche = document.createElement("div");
    couche.dataset.lcdpDialogueBoutonOverlay = "true";
    couche.appendChild(fragment);

    const dialogue = couche.querySelector(
      "[data-lcdp-box-dialogue-bouton]"
    );
    const titre = couche.querySelector(
      "[data-lcdp-dialogue-title]"
    );
    const texte = couche.querySelector(
      "[data-lcdp-dialogue-text]"
    );
    const actions = couche.querySelector(
      "[data-lcdp-dialogue-actions]"
    );
    const fermer = couche.querySelector(
      "[data-lcdp-dialogue-close]"
    );

    if (
      !dialogue ||
      !titre ||
      !texte ||
      !actions ||
      !fermer
    ) {
      couche.remove();
      throw new Error(
        "Objet dialogue incomplet."
      );
    }

    titre.textContent = "Envoyer la demande ?";
    texte.textContent =
      "Confirmez-vous l’envoi de votre demande juridique ?";
    actions.innerHTML = "";

    const annuler = document.createElement("button");
    annuler.type = "button";
    annuler.className =
      "lcdp-button lcdp-button-secondary";
    annuler.textContent = "Annuler";

    const envoyer = document.createElement("button");
    envoyer.type = "button";
    envoyer.className =
      "lcdp-button lcdp-button-orange";
    envoyer.textContent = "Envoyer la demande";

    actions.appendChild(annuler);
    actions.appendChild(envoyer);

    const hote = overlay?.isConnected
      ? overlay
      : slot;
    hote.appendChild(couche);

    return new Promise((resolve) => {
      let termine = false;

      function terminer(valeur) {
        if (termine) {
          return;
        }

        termine = true;
        document.removeEventListener(
          "keydown",
          gererClavier
        );
        couche.remove();
        resolve(valeur);
      }

      function gererClavier(event) {
        if (event.key === "Escape") {
          event.preventDefault();
          terminer(false);
        }
      }

      document.addEventListener(
        "keydown",
        gererClavier
      );

      fermer.addEventListener(
        "click",
        () => terminer(false)
      );
      annuler.addEventListener(
        "click",
        () => terminer(false)
      );
      envoyer.addEventListener(
        "click",
        () => terminer(true)
      );
      dialogue.addEventListener(
        "click",
        (event) => {
          if (event.target === dialogue) {
            terminer(false);
          }
        }
      );
    });
  }

  async function afficherAlerteDemandeJuridique(
    message,
    type,
    overlay
  ) {
    const slot = document.getElementById(
      "lcdp-lightbox-slot"
    );

    if (!slot) {
      throw new Error(
        "Slot d’alerte introuvable."
      );
    }

    const fragment = await chargerFragmentObjetListeAttente(
      "/BOX/02-box-alerte.html"
    );
    const couche = document.createElement("div");
    couche.dataset.lcdpAlerteOverlay = "true";
    couche.appendChild(fragment);

    const alerte = couche.querySelector(
      "[data-lcdp-box-alerte]"
    );
    const texte = couche.querySelector(
      "[data-lcdp-alerte-message]"
    );
    const fermer = couche.querySelector(
      "[data-lcdp-alerte-close]"
    );
    const ok = couche.querySelector(
      "[data-lcdp-alerte-ok]"
    );

    if (!alerte || !texte || !fermer || !ok) {
      couche.remove();
      throw new Error(
        "Objet alerte incomplet."
      );
    }

    alerte.dataset.type = type || "information";
    texte.textContent = String(message || "");

    const hote = overlay?.isConnected
      ? overlay
      : slot;
    hote.appendChild(couche);

    return new Promise((resolve) => {
      let termine = false;

      function terminer() {
        if (termine) {
          return;
        }

        termine = true;
        document.removeEventListener(
          "keydown",
          gererClavier
        );
        couche.remove();
        resolve();
      }

      function gererClavier(event) {
        if (event.key === "Escape") {
          event.preventDefault();
          terminer();
        }
      }

      document.addEventListener(
        "keydown",
        gererClavier
      );

      fermer.addEventListener(
        "click",
        terminer
      );
      ok.addEventListener(
        "click",
        terminer
      );
      alerte.addEventListener(
        "click",
        (event) => {
          if (event.target === alerte) {
            terminer();
          }
        }
      );
    });
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
