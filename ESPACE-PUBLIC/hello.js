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
    initialiserFooterHello().catch((erreur) => {
      console.error("Erreur footer hello :", erreur);
    });
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

  async function initialiserFooterHello() {
    const slot = document.getElementById("lcdp-footer-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const fragment = await chargerFragmentSite("/OBJET/BOX/02-box-footer.html");
    slot.appendChild(fragment);
    appliquerRoutesSite(slot);
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
