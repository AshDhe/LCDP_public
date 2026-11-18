/* Initialisation des pages éditoriales publiques.
   Hello et Inscription conservent leur script métier.
   Association et Le Club utilisent le même script d'initialisation. */
window.SITE_BASE = window.SITE_CONFIG?.publicBaseUrl || window.SITE_CONFIG?.siteBase || "";

(() => {
  "use strict";

  const IMAGES_CARROUSEL_HELLO = [
    {
      src: "/OBJET/IMAG/CARROUSEL/PAGE-HELLO/IMAG_1.webp",
      alt: "Lieux remarquables et parcs d'exception avec La Clé du Parc",
      texte: "Des lieux d'exception"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/PAGE-HELLO/IMAG_2.webp",
      alt: "Prendre soin de soi et de ses proches La Clé du Parc",
      texte: "Prendre soin de soi"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/PAGE-HELLO/IMAG_3.webp",
      alt: "Se réunir en famille avec La Clé du Parc",
      texte: "Se réunir en famille"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/PAGE-HELLO/IMAG_4.webp",
      alt: "Réunir ses amis avec La Clé du Parc",
      texte: "Réunir ses amis"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/PAGE-HELLO/IMAG_5.webp",
      alt: "Activités de loisir plein air avec La Clé du Parc",
      texte: "Organiser son activité"
    },
    {
      src: "/OBJET/IMAG/CARROUSEL/PAGE-HELLO/IMAG_6.webp",
      alt: "Un parc près de chez soi avec La Clé du Parc",
      texte: "Un parc près de chez vous\u00a0?"
    },
  ];

  // Source et rendu uniques, y compris pour la page Hello.
  window.LCDP_initialiserCarrouselHello = initialiserCarrouselHello;

  const page = document.documentElement.dataset.lcdpEditorialPage;
  if (page !== "association" && page !== "club") return;

  function initialiserAttente() {
    const attente = document.getElementById("lcdp-attente-arrivee");
    if (!attente) return;
    const terminer = () => attente.remove();
    window.LCDP_terminerAttenteArrivee = terminer;
    attente.hidden = false;
    window.setTimeout(terminer, 15000);
    window.addEventListener("pageshow", event => { if (event.persisted) terminer(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserHello);
  } else {
    initialiserHello();
  }

  function initialiserHello() {
    initialiserAttente();
    appliquerRoutesSite(document);

    const attenteBandeau = initialiserBandeau().catch((erreur) => {
      console.error("Erreur bandeau restreint hello :", erreur);
    });

    renseignerNextHello();
    initialiserFormulaireAccesPublic();
    const attenteFooter = initialiserFooterHello().catch((erreur) => {
      console.error("Erreur footer hello :", erreur);
    });
    const attenteCarrousel = initialiserCarrouselHello().catch((erreur) => {
      console.error("Erreur carrousel hello :", erreur);
    });
    afficherErreurAccesSiNecessaire();
    Promise.allSettled([attenteBandeau, attenteFooter, attenteCarrousel])
      .then(() => window.LCDP_terminerAttenteArrivee?.());
  }

      function chargerScriptUneFois(chemin) {
        const src = construireUrlSite(chemin);

        if (document.querySelector(`script[data-lcdp-script="${chemin}"]`)) {
          return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.defer = true;
          script.dataset.lcdpScript = chemin;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Script introuvable : " + chemin));
          document.body.appendChild(script);
        });
      }

      async function initialiserBandeau() {
        const slot = document.getElementById("lcdp-bandeau-slot");
        slot.innerHTML = "";

        const bandeau = await chargerFragmentSite("/ESPACE-PUBLIC/box-bandeau-nav-public.html");
        slot.appendChild(bandeau);

        appliquerRoutesSite(slot);

        await chargerScriptUneFois("/ESPACE-PUBLIC/box-menu-burger-public.js");

        if (typeof window.LCDP_initialiserMenuBurgerPublic === "function") {
          await window.LCDP_initialiserMenuBurgerPublic();
        }
      }

  async function initialiserFooterHello() {
    const slot = document.getElementById("lcdp-footer-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const fragment = await chargerFragmentSite("/OBJET/HTMLBASE/02-footer.html");
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
    const texteSecours = titre ? titre + "\n\n" + message : message;
    if (!slot) {
      window.alert(texteSecours);
      return;
    }
    slot.replaceChildren();
    const focusInitial = document.activeElement;
    try {
      slot.appendChild(await chargerFragmentObjet("/HTMLBASE/02-dialogue-reference-erreur.html"));
      const dialogue = slot.querySelector('[data-lcdp-dialogue-reference="erreur"]');
      const titreElement = slot.querySelector("[data-lcdp-dialogue-titre]");
      const messageElement = slot.querySelector("[data-lcdp-dialogue-message]");
      const bouton = slot.querySelector('[data-lcdp-dialogue-action="fermer"]');
      if (!dialogue || !titreElement || !messageElement || !bouton) {
        throw new Error("Structure ERREUR incomplète.");
      }
      titreElement.textContent = titre || "Erreur";
      messageElement.textContent = message || "";
      bouton.textContent = "Fermer";
      let termine = false;
      const fermer = () => {
        if (termine) return;
        termine = true;
        document.removeEventListener("keydown", clavier);
        slot.replaceChildren();
        if (focusInitial?.isConnected && typeof focusInitial.focus === "function") {
          focusInitial.focus({preventScroll:true});
        }
      };
      const clavier = event => {
        if (event.key === "Escape") {event.preventDefault();fermer();}
      };
      bouton.addEventListener("click", fermer, {once:true});
      dialogue.addEventListener("click", event => {
        if (event.target === dialogue) fermer();
      });
      document.addEventListener("keydown", clavier);
      bouton.focus();
    } catch (error) {
      slot.replaceChildren();
      console.error("Erreur alerte accès public :", error);
      window.alert(texteSecours);
    }
  }

  async function lireCarrouselHello() {
    try {
      const r = await fetch(construireUrlSite("/OBJET/IMAG/CARROUSEL/carrousels.json"), {
        cache: "no-cache", credentials: "same-origin"
      });
      if (!r.ok) throw new Error("Inventaire carrousels indisponible");
      const data = await r.json();
      if (data.schema !== 1 || !Array.isArray(data.carrousels) || typeof data.revision !== "string") {
        throw new Error("Inventaire carrousels invalide");
      }
      const carrousel = data.carrousels.find(c => c.id === "page-hello");
      if (!carrousel) return null;
      if (!/^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(carrousel.dossier) ||
          !Array.isArray(carrousel.images) || !carrousel.images.length) throw new Error("Carrousel Hello invalide");
      return {
        titre: carrousel.titre,
        images: carrousel.images.map((im,index) => ({
          src: "/OBJET/IMAG/CARROUSEL/" + carrousel.dossier + "/IMAG_" + (index+1) + ".webp?v=" + encodeURIComponent(data.revision),
          alt: String(im.alt || ""), texte: String(im.titre || ""), legende: String(im.legende || "")
        }))
      };
    } catch (error) {
      // Conserver le rendu historique en cas d'indisponibilité temporaire.
      console.warn("Inventaire carrousels Hello :", error);
      return {titre:"Demandez La Clé",images:IMAGES_CARROUSEL_HELLO.map(im=>({...im,legende:"Illustration IA"}))};
    }
  }

  async function initialiserCarrouselHello() {
    const slot = document.getElementById("lcdp-carrousel-hello-slot");

    if (!slot) {
      return;
    }

    const configCarrousel = await lireCarrouselHello();
    const section = slot.closest(".lcdp-editorial-feature");
    const titreGeneral = slot.previousElementSibling?.matches("[data-lcdp-boxtext-title]")
      ? slot.previousElementSibling
      : null;
    if (!configCarrousel) {
      if (section) section.hidden = true;
      else slot.hidden = true;
      if (titreGeneral) titreGeneral.hidden = true;
      return;
    }
    if (titreGeneral) {
      titreGeneral.textContent = String(configCarrousel.titre || "");
      titreGeneral.hidden = !titreGeneral.textContent.trim();
    }

    slot.innerHTML =
      '<section class="lcdp-component lcdp-box-carousel" data-lcdp-box-carousel>' +
        '<div class="lcdp-box-carousel__frame" data-lcdp-carousel-frame>' +
          '<div class="lcdp-box-carousel__viewport">' +
            '<div class="lcdp-box-carousel__list" data-lcdp-carousel-list></div>' +
          '</div>' +
          '<button class="lcdp-box-carousel__button lcdp-box-carousel__button--prev" type="button" aria-label="Image précédente" data-lcdp-carousel-prev>‹</button>' +
          '<button class="lcdp-box-carousel__button lcdp-box-carousel__button--next" type="button" aria-label="Image suivante" data-lcdp-carousel-next>›</button>' +
        '</div>' +
        '<p class="lcdp-image-legend" data-lcdp-carousel-legend>Illustration IA</p>' +
        '<div class="lcdp-box-carousel__dots" aria-label="Navigation carrousel" data-lcdp-carousel-dots></div>' +
      '</section>';

    const carrousel = slot.querySelector("[data-lcdp-box-carousel]");
    const liste = slot.querySelector("[data-lcdp-carousel-list]");

    if (liste) {
      configCarrousel.images.forEach((image, index) => {
        const figure = document.createElement("figure");
        figure.className = "lcdp-box-carousel__item";
        figure.dataset.lcdpSlideLegend = String(image.legende || "");

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

        // Titre éditorial de l'image.
        // Le contenu est inséré comme texte, jamais comme HTML.
        const titre = String(image.texte || "").trim();
        if (titre) {
          const legende = document.createElement("figcaption");
          legende.className = "lcdp-box-carousel__overlay-title";
          legende.textContent = titre;
          figure.appendChild(legende);
          figure.classList.add("lcdp-box-carousel__item--with-title");
        }

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
