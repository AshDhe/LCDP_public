(() => {
  "use strict";

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
    window.LCDP_initialiserCarrouselHello().catch((erreur) => {
      console.error("Erreur carrousel hello :", erreur);
    });
    afficherErreurAccesSiNecessaire();
    surveillerAttenteMentionsLegalesHello();
  }

  // Sécurité propre à Hello : la requête du document légal partagé peut
  // rester en attente sans limite. Ne jamais laisser une fenêtre invisible
  // masquer indéfiniment Hello lorsque le service ne répond pas.
  function surveillerAttenteMentionsLegalesHello() {
    const slot = document.getElementById("lcdp-lightbox-slot");
    if (!slot) return;

    let minuteur = null;
    let overlaySurveille = null;

    function arreterMinuteur() {
      if (minuteur !== null) {
        window.clearTimeout(minuteur);
        minuteur = null;
      }
    }

    function verifierChargement() {
      const overlay = slot.querySelector(":scope > [data-lcdp-legal-lightbox]");
      const attente = overlay?.querySelector(
        ".lcdp-legal-lightbox__status:not(.lcdp-legal-lightbox__status--error)"
      );

      if (!attente) {
        arreterMinuteur();
        overlaySurveille = null;
        return;
      }
      if (overlay === overlaySurveille) return;

      arreterMinuteur();
      overlaySurveille = overlay;
      minuteur = window.setTimeout(() => {
        minuteur = null;
        if (!overlay.isConnected || !attente.isConnected ||
            attente.classList.contains("lcdp-legal-lightbox__status--error")) return;

        // Le statut erreur désactive le spinner CSS et réaffiche la carte
        // avec sa commande de fermeture native, sans modifier le JS partagé.
        attente.classList.add("lcdp-legal-lightbox__status--error");
        attente.textContent = "Le chargement des mentions légales ne répond pas. Fermez cette fenêtre puis réessayez.";
      }, 8000);
    }

    const observateur = new MutationObserver(verifierChargement);
    observateur.observe(slot, {childList: true, subtree: true});
    verifierChargement();
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
      sousTitre.textContent = "Accès restreint";

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
    const texte = titre ? titre + "\n\n" + message : message;

    if (!slot) {
      window.alert(texte);
      return;
    }

    const focusInitial = document.activeElement;
    try {
      slot.replaceChildren(await chargerFragmentObjet("/HTMLBASE/02-dialogue-reference-erreur.html"));
      const dialogue = slot.querySelector('[data-lcdp-dialogue-reference="erreur"]');
      const titreElement = slot.querySelector("[data-lcdp-dialogue-titre]");
      const messageElement = slot.querySelector("[data-lcdp-dialogue-message]");
      const fermerBouton = slot.querySelector('[data-lcdp-dialogue-action="fermer"]');
      if (!dialogue || !titreElement || !messageElement || !fermerBouton) {
        throw new Error("Structure ERREUR incomplète.");
      }
      titreElement.textContent = titre || "Erreur";
      messageElement.textContent = message || "";
      fermerBouton.textContent = "Fermer";

      await new Promise(resolve => {
        let termine = false;
        const fermer = () => {
          if (termine) return;
          termine = true;
          document.removeEventListener("keydown", gererClavier);
          slot.replaceChildren();
          if (focusInitial?.isConnected && typeof focusInitial.focus === "function") focusInitial.focus();
          resolve();
        };
        const gererClavier = event => {
          if (event.key === "Escape") {
            event.preventDefault();
            fermer();
          }
        };
        fermerBouton.addEventListener("click", fermer, { once: true });
        dialogue.addEventListener("click", event => {
          if (event.target === dialogue) fermer();
        });
        document.addEventListener("keydown", gererClavier);
        fermerBouton.focus();
      });
    } catch (erreur) {
      slot.replaceChildren();
      console.error("Erreur alerte hello :", erreur);
      window.alert(texte);
    }
  }

  // Le manifeste et les images sont publiés ensemble dans LCDP_public.
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
