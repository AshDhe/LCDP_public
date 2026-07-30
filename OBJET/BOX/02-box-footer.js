(() => {
  "use strict";

  if (window.LCDP_footerMentionsLegalesInitialise === true) {
    return;
  }

  window.LCDP_footerMentionsLegalesInitialise = true;

  let ouvertureEnCours = false;

  document.addEventListener("click", (event) => {
    const declencheur = event.target.closest("[data-lcdp-footer-mentions-legales]");

    if (!declencheur) {
      return;
    }

    event.preventDefault();
    lancerOuvertureMentionsLegalesFooter(declencheur);
  });

  window.LCDP_ouvrirMentionsLegalesFooter = ouvrirMentionsLegalesFooter;
  window.LCDP_chargerMentionsLegalesFooterDepuisObjet = function LCDP_chargerMentionsLegalesFooterDepuisObjet(event) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }

    lancerOuvertureMentionsLegalesFooter(event?.currentTarget || null);
    return false;
  };
  window.LCDP_initialiserFooterMentionsLegales = () => true;

  function lancerOuvertureMentionsLegalesFooter(declencheur) {
    ouvrirMentionsLegalesFooter(declencheur).catch((erreur) => {
      console.error("Erreur mentions légales footer :", erreur);
      alert("Les mentions légales ne sont pas disponibles pour le moment.");
    });
  }

  async function ouvrirMentionsLegalesFooter(declencheur = null) {
    if (ouvertureEnCours) {
      return;
    }

    ouvertureEnCours = true;
    definirChargementDeclencheur(declencheur, true);

    try {
      const documentLegal = await chargerMentionsLegalesFooter();
      afficherLightboxMentionsLegalesFooter(documentLegal);
    } finally {
      definirChargementDeclencheur(declencheur, false);
      ouvertureEnCours = false;
    }
  }

  function definirChargementDeclencheur(declencheur, enCours) {
    if (!declencheur) {
      return;
    }

    declencheur.disabled = enCours;
    declencheur.setAttribute("aria-busy", enCours ? "true" : "false");
  }

  function afficherLightboxMentionsLegalesFooter(documentLegal) {
    const slot = obtenirSlotLightbox();
    slot.innerHTML = "";

    const overlay = document.createElement("div");
    overlay.className = "lcdp-footer-legal-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Mentions légales");

    const card = document.createElement("div");
    card.className = "lcdp-footer-legal-card";

    const boutonFermer = document.createElement("button");
    boutonFermer.className = "lcdp-footer-legal-close";
    boutonFermer.type = "button";
    boutonFermer.setAttribute("aria-label", "Fermer");
    boutonFermer.textContent = "×";

    const titre = document.createElement("h2");
    titre.className = "lcdp-footer-legal-title";
    titre.textContent = documentLegal?.titre || "Mentions légales";

    const liste = document.createElement("div");
    liste.className = "lcdp-footer-legal-list";

    card.appendChild(boutonFermer);
    card.appendChild(titre);
    card.appendChild(liste);
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
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          fermer();
        }
      },
      { once: true }
    );

    rendreMentionsLegalesFooter(liste, documentLegal, overlay);
    appliquerRoutesFooter(liste);
  }

  function obtenirSlotLightbox() {
    let slot = document.getElementById("lcdp-lightbox-slot");

    if (!slot) {
      slot = document.createElement("div");
      slot.id = "lcdp-lightbox-slot";
      document.body.appendChild(slot);
    }

    return slot;
  }

  async function chargerMentionsLegalesFooter() {
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
      throw new Error(data?.message || "Mentions légales indisponibles.");
    }

    return data;
  }

  function rendreMentionsLegalesFooter(liste, documentLegal, overlay) {
    const blocs = Array.isArray(documentLegal?.blocs) ? documentLegal.blocs : [];
    liste.innerHTML = "";

    if (blocs.length === 0) {
      const message = document.createElement("p");
      message.className = "lcdp-footer-legal-message";
      message.textContent = "Mentions légales non publiées.";
      liste.appendChild(message);
      return;
    }

    blocs.forEach((bloc) => {
      const article = document.createElement("section");
      article.className = "lcdp-footer-legal-section";

      const titreBloc = document.createElement("h3");
      titreBloc.className = "lcdp-footer-legal-section-title";
      titreBloc.textContent = String(bloc?.titre || "");

      const contenu = document.createElement("div");
      contenu.className = "lcdp-footer-legal-section-content";
      contenu.innerHTML = String(bloc?.html || "");
      supprimerParagraphesVides(contenu);

      article.appendChild(titreBloc);
      article.appendChild(contenu);
      liste.appendChild(article);
    });

    ajouterBoutonDemandeJuridiqueFooter(liste, documentLegal, overlay);
  }

  function ajouterBoutonDemandeJuridiqueFooter(liste, documentLegal, overlay) {
    const actions = document.createElement("div");
    actions.className = "lcdp-footer-legal-actions lcdp-box-formulaire__actions";

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "lcdp-button lcdp-button-secondary";
    bouton.textContent = "Demande juridique";
    bouton.addEventListener("click", () => {
      ouvrirFormulaireDemandeJuridiqueFooter(liste, documentLegal, overlay).catch((erreur) => {
        console.error("Erreur formulaire demande juridique footer :", erreur);
        alert("Le formulaire de demande juridique n'est pas disponible pour le moment.");
      });
    });

    actions.appendChild(bouton);
    liste.appendChild(actions);
  }

  async function ouvrirFormulaireDemandeJuridiqueFooter(liste, documentLegal, overlay) {
    liste.innerHTML = "";

    const section = document.createElement("section");
    section.className = "lcdp-footer-legal-section";

    const titre = document.createElement("h3");
    titre.className = "lcdp-footer-legal-section-title";
    titre.textContent = "Demande juridique";

    const intro = document.createElement("p");
    intro.className = "lcdp-footer-legal-message";
    intro.textContent = "Renseignez vos coordonnées et la raison de votre demande.";

    const form = document.createElement("form");
    form.className = "lcdp-footer-legal-form";
    form.noValidate = true;
    form.innerHTML =
      '<div class="lcdp-footer-legal-field">' +
        '<label for="demande-juridique-footer-nom">Votre nom</label>' +
        '<input id="demande-juridique-footer-nom" name="nom" type="text" autocomplete="family-name" maxlength="120" required>' +
      '</div>' +
      '<div class="lcdp-footer-legal-field">' +
        '<label for="demande-juridique-footer-prenom">Votre prénom</label>' +
        '<input id="demande-juridique-footer-prenom" name="prenom" type="text" autocomplete="given-name" maxlength="120" required>' +
      '</div>' +
      '<div class="lcdp-footer-legal-field">' +
        '<label for="demande-juridique-footer-email">Votre e-mail</label>' +
        '<input id="demande-juridique-footer-email" name="email" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" maxlength="254" required>' +
      '</div>' +
      '<div class="lcdp-footer-legal-field">' +
        '<label for="demande-juridique-footer-motif">Raison de votre demande juridique</label>' +
        '<textarea id="demande-juridique-footer-motif" name="motif" maxlength="4000" required></textarea>' +
      '</div>' +
      '<p class="lcdp-footer-legal-message" data-lcdp-footer-demande-statut aria-live="polite"></p>' +
      '<div class="lcdp-footer-legal-actions lcdp-box-formulaire__actions">' +
        '<button class="lcdp-button lcdp-button-orange" type="submit">Envoyer</button>' +
        '<button class="lcdp-button lcdp-button-secondary" type="button" data-lcdp-footer-retour-mentions>Retour aux mentions légales</button>' +
      '</div>';

    section.appendChild(titre);
    section.appendChild(intro);
    section.appendChild(form);
    liste.appendChild(section);

    const retour = form.querySelector("[data-lcdp-footer-retour-mentions]");
    const statut = form.querySelector("[data-lcdp-footer-demande-statut]");

    retour?.addEventListener("click", () => {
      rendreMentionsLegalesFooter(liste, documentLegal, overlay);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const payload = lireFormulaireDemandeJuridiqueFooter(form);
      const erreur = validerDemandeJuridiqueFooter(payload);

      if (erreur) {
        statut.textContent = erreur;
        return;
      }

      const boutons = Array.from(form.querySelectorAll("button"));
      boutons.forEach((bouton) => {
        bouton.disabled = true;
      });
      statut.textContent = "Envoi en cours...";

      try {
        await envoyerDemandeJuridiqueFooter(payload);
        form.reset();
        statut.textContent = "Votre demande est envoyée.";

        window.setTimeout(() => {
          if (liste.isConnected) {
            rendreMentionsLegalesFooter(liste, documentLegal, overlay);
          }
        }, 900);
      } catch (error) {
        console.error("Erreur envoi demande juridique footer :", error);
        boutons.forEach((bouton) => {
          bouton.disabled = false;
        });
        statut.textContent = String(error?.message || error || "La demande n’a pas pu être envoyée.");
      }
    });
  }

  function lireFormulaireDemandeJuridiqueFooter(form) {
    return {
      nom: String(form.elements.namedItem("nom")?.value || "").trim(),
      prenom: String(form.elements.namedItem("prenom")?.value || "").trim(),
      email: String(form.elements.namedItem("email")?.value || "").trim().toLowerCase(),
      motif: String(form.elements.namedItem("motif")?.value || "").trim(),
      source: "footer-site"
    };
  }

  function validerDemandeJuridiqueFooter(payload) {
    if (!payload.nom) {
      return "Votre nom est obligatoire.";
    }

    if (!payload.prenom) {
      return "Votre prénom est obligatoire.";
    }

    if (!payload.email || !emailValideFooter(payload.email)) {
      return "Votre adresse e-mail n’est pas valide.";
    }

    if (!payload.motif) {
      return "La raison de votre demande est obligatoire.";
    }

    return "";
  }

  async function envoyerDemandeJuridiqueFooter(payload) {
    const endpoint = obtenirEndpointEditingAdmin();

    if (!endpoint) {
      throw new Error("Service de demande juridique non configuré.");
    }

    const response = await fetch(endpoint + "/public/demande-juridique", {
      method: "POST",
      credentials: "omit",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || data.success !== true) {
      throw new Error(data?.message || data?.detail || "La demande n’a pas pu être envoyée.");
    }

    return data;
  }

  function supprimerParagraphesVides(conteneur) {
    conteneur.querySelectorAll("p").forEach((paragraphe) => {
      const contenuHtml = String(paragraphe.innerHTML || "")
        .replace(/&nbsp;/gi, "")
        .replace(/<br\s*\/?>/gi, "")
        .replace(/\s+/g, "");

      const contenuTexte = String(paragraphe.textContent || "").trim();

      if (!contenuHtml && !contenuTexte) {
        paragraphe.remove();
      }
    });
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

  function appliquerRoutesFooter(racine) {
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

    if (typeof window.LCDP_urlPublic === "function") {
      return window.LCDP_urlPublic(valeur);
    }

    const base = nettoyerBaseUrl(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.LCDP_PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    );

    if (base) {
      return base + "/" + valeur.replace(/^\/+/, "");
    }

    return valeur.startsWith("/") ? ".." + valeur : valeur;
  }

  function emailValideFooter(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
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
