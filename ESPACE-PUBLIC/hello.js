(() => {
  "use strict";

  const IMAGES_CARROUSEL_HELLO = [
    {
      src: "/OBJET/IMAG/CARROUSEL/AFFICHE-ACCUEIL/IMAG_1.jpg",
      alt: "Parc plein air d'exception La Clé du Parc"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/AFFICHE-ACCUEIL/IMAG_2.jpg",
      alt: "Moment de ressourcement en plein air"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/AFFICHE-ACCUEIL/IMAG_3.jpg",
      alt: "Accès à un parc d'exception"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/AFFICHE-ACCUEIL/IMAG_4.jpg",
      alt: "Activité de plein air dans un parc"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/AFFICHE-ACCUEIL/IMAG_5.jpg",
      alt: "Lieu naturel sélectionné par La Clé du Parc"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/AFFICHE-ACCUEIL/IMAG_6.jpg",
      alt: "Expérience en parc plein air"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/AFFICHE-ACCUEIL/IMAG_7.jpg",
      alt: "Parc d'exception près de chez vous"
    }
  ];

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserHello);
  } else {
    initialiserHello();
  }

  function initialiserHello() {
    appliquerRoutesSite(document);

    initialiserBandeauRestreint().catch((erreur) => {
      console.error("Erreur bandeau restreint hello :", erreur);
    });

    renseignerNextHello();
    initialiserFormulaireAccesPublic();
    initialiserBoutonMentionsLegales();
    initialiserCarrouselHello().catch((erreur) => {
      console.error("Erreur carrousel hello :", erreur);
    });
    afficherErreurAccesSiNecessaire();
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
      lien.setAttribute("href", construireUrlSite("/ESPACE-PUBLIC/hello.html"));
      lien.setAttribute("data-site-href", "/ESPACE-PUBLIC/hello.html");
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

    if (burgerSlot && burgerSlot.parentNode) {
      burgerSlot.parentNode.removeChild(burgerSlot);
    }
  }

  function renseignerNextHello() {
    const champNext = document.getElementById("hello-next");

    if (!champNext) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    champNext.value = normaliserNext(params.get("next"));
  }

  function normaliserNext(value) {
    const texte = String(value || "").trim();

    if (!texte || !texte.startsWith("/") || texte.startsWith("//")) {
      return "/";
    }

    if (texte.startsWith("/ESPACE-PUBLIC/hello.html")) {
      return "/";
    }

    return texte;
  }

  function initialiserFormulaireAccesPublic() {
    const formulaire = document.getElementById("formulaire-acces-public");
    const champEmail = document.getElementById("emailmembre");
    const champMotDePasse = document.getElementById("password");
    const caseAfficherMotDePasse = document.getElementById("afficher-password");

    if (caseAfficherMotDePasse && champMotDePasse) {
      caseAfficherMotDePasse.addEventListener("change", () => {
        champMotDePasse.type = caseAfficherMotDePasse.checked ? "text" : "password";
      });
    }

    if (!formulaire || !champEmail || !champMotDePasse) {
      return;
    }

    formulaire.setAttribute("action", construireUrlSite("/__lcdp-public-login"));

    formulaire.addEventListener("submit", (event) => {
      const email = String(champEmail.value || "").trim().toLowerCase();
      const motDePasse = String(champMotDePasse.value || "").trim();

      if (!email || !emailValidePourAccesPublic(email)) {
        event.preventDefault();
        afficherAlerte("E-mail invalide", "Veuillez renseigner une adresse e-mail valide.").catch((erreur) => {
          console.error("Erreur alerte email hello :", erreur);
        });
        champEmail.focus();
        return;
      }

      if (!motDePasse) {
        event.preventDefault();
        afficherAlerte("Champ manquant", "Veuillez renseigner le mot de passe d'accès.").catch((erreur) => {
          console.error("Erreur alerte mot de passe hello :", erreur);
        });
        champMotDePasse.focus();
      }
    });
  }

  function initialiserBoutonMentionsLegales() {
    const bouton = document.getElementById("bouton-mentions-legales");

    if (!bouton) {
      return;
    }

    bouton.addEventListener("click", () => {
      ouvrirMentionsLegalesRestreintes().catch((erreur) => {
        console.error("Erreur ouverture mentions légales :", erreur);
      });
    });
  }

  function afficherErreurAccesSiNecessaire() {
    const params = new URLSearchParams(window.location.search);
    const erreurAccesPublic = String(params.get("erreur") || "").trim();

    if (!erreurAccesPublic) {
      return;
    }

    window.addEventListener("load", () => {
      const messages = {
        email: {
          titre: "E-mail invalide",
          message: "Veuillez renseigner une adresse e-mail valide."
        },
        password_empty: {
          titre: "Champ manquant",
          message: "Veuillez renseigner le mot de passe d'accès."
        },
        password: {
          titre: "Mot de passe incorrect",
          message: "Le mot de passe saisi est incorrect."
        },
        base: {
          titre: "Erreur",
          message: "L'accès n'a pas pu être enregistré. Veuillez réessayer."
        }
      };

      const erreur = messages[erreurAccesPublic];

      if (erreur) {
        afficherAlerte(erreur.titre, erreur.message).catch((erreurAlerte) => {
          console.error("Erreur alerte accès hello :", erreurAlerte);
        });
      }

      const champEmail = document.getElementById("emailmembre");
      const champMotDePasse = document.getElementById("password");

      if ((erreurAccesPublic === "email" || erreurAccesPublic === "base") && champEmail) {
        champEmail.focus();
      }

      if ((erreurAccesPublic === "password" || erreurAccesPublic === "password_empty") && champMotDePasse) {
        champMotDePasse.focus();
      }
    });
  }

  async function afficherAlerte(titre, message) {
    const slot = document.getElementById("lcdp-lightbox-slot");
    const texte = titre ? titre + "\n\n" + message : message;

    if (!slot) {
      alert(texte);
      return;
    }

    slot.innerHTML = "";

    try {
      const fragment = await chargerFragmentObjet("/BOX/02-box-alerte.html");
      slot.appendChild(fragment);

      const alerte = slot.querySelector("[data-lcdp-box-alerte]");
      const messageElement = slot.querySelector("[data-lcdp-alerte-message]");
      const boutons = slot.querySelectorAll("[data-lcdp-alerte-close], [data-lcdp-alerte-ok]");

      if (!alerte || !messageElement || boutons.length === 0) {
        throw new Error("Structure de l'alerte V3 incomplète.");
      }

      messageElement.textContent = texte;

      const fermer = () => {
        slot.innerHTML = "";
      };

      boutons.forEach((bouton) => {
        bouton.addEventListener("click", fermer, { once: true });
      });

      alerte.addEventListener("click", (event) => {
        if (event.target === alerte) {
          fermer();
        }
      });
    } catch (error) {
      console.error("Erreur alerte hello :", error);
      alert(texte);
    }
  }

  async function initialiserCarrouselHello() {
    const slot = document.getElementById("lcdp-carrousel-hello-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML =
      '<section class="lcdp-component lcdp-box-carousel" data-lcdp-box-carousel>' +
        '<h2 class="lcdp-box-carousel__title lcdp-boxtext__title--center" data-lcdp-carousel-title>Demandez la clé</h2>' +
        '<div class="lcdp-box-carousel__frame" data-lcdp-carousel-frame>' +
          '<div class="lcdp-box-carousel__viewport">' +
            '<div class="lcdp-box-carousel__list" data-lcdp-carousel-list></div>' +
          '</div>' +
          '<button class="lcdp-box-carousel__button lcdp-box-carousel__button--prev" type="button" aria-label="Image précédente" data-lcdp-carousel-prev>‹</button>' +
          '<button class="lcdp-box-carousel__button lcdp-box-carousel__button--next" type="button" aria-label="Image suivante" data-lcdp-carousel-next>›</button>' +
        '</div>' +
        '<p class="lcdp-image-legend" data-lcdp-carousel-legend>Illustration recomposée par IA - Non contractuelle</p>' +
        '<div class="lcdp-box-carousel__dots" aria-label="Navigation carrousel" data-lcdp-carousel-dots></div>' +
      '</section>';

    const carrousel = slot.querySelector("[data-lcdp-box-carousel]");
    const liste = slot.querySelector("[data-lcdp-carousel-list]");

    if (liste) {
      IMAGES_CARROUSEL_HELLO.forEach((image, index) => {
        const figure = document.createElement("figure");
        figure.className = "lcdp-box-carousel__item";

        if (index === 0) {
          figure.classList.add("is-active");
          figure.setAttribute("aria-hidden", "false");
        } else {
          figure.setAttribute("aria-hidden", "true");
        }

        const img = document.createElement("img");
        img.className = "lcdp-box-carousel__image";
        img.alt = image.alt || "";
        img.decoding = "async";
        appliquerFallbackImage(img, image.src);

        if (index === 0) {
          img.loading = "eager";
          img.setAttribute("fetchpriority", "high");
        } else {
          img.loading = "lazy";
        }

        figure.appendChild(img);
        liste.appendChild(figure);
      });
    }

    if (carrousel && typeof window.LCDP_initialiserCarrousels === "function") {
      window.LCDP_initialiserCarrousels(slot);
    }
  }

  function construireVariantesImage(src) {
    const valeur = String(src || "");

    if (!valeur.toLowerCase().endsWith(".jpg")) {
      return [src];
    }

    const base = valeur.slice(0, -4);

    return [
      valeur,
      base + ".JPG",
      base + ".jpeg",
      base + ".JPEG",
      base + ".webp",
      base + ".WEBP"
    ];
  }

  function appliquerFallbackImage(imageElement, srcInitial) {
    const variantes = construireVariantesImage(srcInitial);
    let indexTentative = 0;

    imageElement.addEventListener("error", () => {
      indexTentative += 1;

      if (variantes[indexTentative]) {
        imageElement.src = construireUrlSite(variantes[indexTentative]);
      }
    });

    imageElement.src = construireUrlSite(variantes[indexTentative]);
  }

  function emailValidePourAccesPublic(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  async function chargerFragmentSite(chemin) {
    const reponse = await fetch(construireUrlSite(chemin), {
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

  function appliquerRoutesSite(racine) {
    const zone = racine || document;

    zone.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.getAttribute("data-site-href")));
    });

    zone.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlSite(element.getAttribute("data-site-src")));
    });

    zone.querySelectorAll("a[href^='/']").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.getAttribute("href")));
    });

    zone.querySelectorAll("img[src^='/']").forEach((element) => {
      element.setAttribute("src", construireUrlSite(element.getAttribute("src")));
    });
  }

  function construireUrlSite(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.publicUrl === "function") {
      return config.publicUrl(valeur);
    }

    const base = nettoyerBaseUrl(
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

  function construireUrlObjet(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.objetUrl === "function") {
      return config.objetUrl(valeur);
    }

    const objetBase = nettoyerBaseUrl(
      config.objetBaseUrl ||
      config.OBJET_BASE ||
      ""
    );

    const cheminNettoye = valeur
      .replace(/^\/+/, "")
      .replace(/^OBJET\/+/, "");

    if (objetBase) {
      return objetBase + "/" + cheminNettoye;
    }

    return "../OBJET/" + cheminNettoye;
  }

  function obtenirEndpointEditingAdmin() {
    const config = window.SITE_CONFIG || {};
    const direct = nettoyerBaseUrl(
      config.workerEditingAdminUrl ||
      config.WORKER_EDITING_ADMIN_URL ||
      config.W_EDITING_ADMIN_URL ||
      config.editingAdminUrl ||
      ""
    );

    if (direct) {
      return direct;
    }

    if (typeof config.apiUrl === "function") {
      return nettoyerBaseUrl(config.apiUrl("editing-admin-api"));
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
        Accept: "application/json"
      }
    });

    const data = await reponse.json().catch(() => null);

    if (!reponse.ok || !data || data.success !== true) {
      const message = data && data.message ? data.message : "Mentions légales indisponibles.";
      throw new Error(message);
    }

    return data;
  }

  async function ouvrirMentionsLegalesRestreintes() {
    const slot = document.getElementById("lcdp-lightbox-slot");

    if (!slot) {
      return;
    }

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
      if (event.target === overlay) {
        fermer();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        fermer();
      }
    }, { once: true });

    const liste = section.querySelector("[data-mentions-legales-list]");

    if (!liste) {
      return;
    }

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

    appliquerRoutesSite(liste);
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

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

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

      const confirme =
        await demanderConfirmationDemandeJuridique(
          overlay
        );

      if (!confirme) {
        return;
      }

      const boutons = Array.from(
        form.querySelectorAll("button")
      );

      boutons.forEach((bouton) => {
        bouton.disabled = true;
      });

      try {
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
        boutons.forEach((bouton) => {
          bouton.disabled = false;
        });

        await afficherAlerteDemandeJuridique(
          String(
            error?.message ||
            error ||
            "La demande n’a pas pu être envoyée."
          ),
          "erreur",
          overlay
        );
      }
    });
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
      source: "hello"
    };
  }

  function validerDemandeJuridique(payload) {
    if (!payload.nom) {
      return "Votre nom est obligatoire.";
    }

    if (!payload.prenom) {
      return "Votre prénom est obligatoire.";
    }

    if (!payload.email || !emailValidePourAccesPublic(payload.email)) {
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

    if (overlay) {
      overlay.hidden = true;
    }

    const fragment = await chargerFragmentObjet(
      "/BOX/02-box-dialogue-bouton.html"
    );
    const dialogue = fragment.querySelector(
      "[data-lcdp-box-dialogue-bouton]"
    );

    if (!dialogue) {
      if (overlay) {
        overlay.hidden = false;
      }

      throw new Error(
        "Objet dialogue incomplet."
      );
    }

    dialogue.querySelector(
      "[data-lcdp-dialogue-title]"
    ).textContent = "Envoyer la demande ?";

    dialogue.querySelector(
      "[data-lcdp-dialogue-text]"
    ).textContent =
      "Confirmez-vous l’envoi de votre demande juridique ?";

    const actions = dialogue.querySelector(
      "[data-lcdp-dialogue-actions]"
    );
    const fermer = dialogue.querySelector(
      "[data-lcdp-dialogue-close]"
    );

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
    slot.appendChild(fragment);

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
        dialogue.remove();

        if (overlay?.isConnected) {
          overlay.hidden = false;
        }

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

      fermer?.addEventListener(
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

    if (overlay) {
      overlay.hidden = true;
    }

    const fragment = await chargerFragmentObjet(
      "/BOX/02-box-alerte.html"
    );
    const alerte = fragment.querySelector(
      "[data-lcdp-box-alerte]"
    );

    if (!alerte) {
      if (overlay) {
        overlay.hidden = false;
      }

      throw new Error(
        "Objet alerte incomplet."
      );
    }

    alerte.dataset.type = type || "information";

    alerte.querySelector(
      "[data-lcdp-alerte-message]"
    ).textContent = String(message || "");

    const fermer = alerte.querySelector(
      "[data-lcdp-alerte-close]"
    );
    const ok = alerte.querySelector(
      "[data-lcdp-alerte-ok]"
    );

    slot.appendChild(fragment);

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
        alerte.remove();

        if (overlay?.isConnected) {
          overlay.hidden = false;
        }

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

      fermer?.addEventListener(
        "click",
        terminer
      );
      ok?.addEventListener(
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

  function nettoyerBaseUrl(value) {
    return String(value || "").replace(/\/+$/, "");
  }
})();
