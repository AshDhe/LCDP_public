(() => {
  "use strict";

  if (window.LCDP_footerMentionsLegalesInitialise === true) {
    return;
  }

  window.LCDP_footerMentionsLegalesInitialise = true;

  document.addEventListener("click", (event) => {
    const declencheur = event.target.closest("[data-lcdp-footer-mentions-legales]");

    if (!declencheur) {
      return;
    }

    event.preventDefault();

    ouvrirMentionsLegalesFooter().catch((erreur) => {
      console.error("Erreur mentions légales footer :", erreur);
      window.location.href = construireUrlSite("/ESPACE-PUBLIC/mentions-legales.html");
    });
  });

  window.LCDP_ouvrirMentionsLegalesFooter = ouvrirMentionsLegalesFooter;
  window.LCDP_initialiserFooterMentionsLegales = function () {
    return true;
  };

  async function ouvrirMentionsLegalesFooter() {
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
    titre.textContent = "Mentions légales";

    const liste = document.createElement("div");
    liste.className = "lcdp-footer-legal-list";
    liste.innerHTML = '<p class="lcdp-footer-legal-message">Chargement...</p>';

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

    try {
      const documentLegal = await chargerMentionsLegales();
      const blocs = Array.isArray(documentLegal.blocs) ? documentLegal.blocs : [];

      titre.textContent = documentLegal.titre || "Mentions légales";
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
        titreBloc.textContent = bloc && bloc.titre ? bloc.titre : "";

        const contenu = document.createElement("div");
        contenu.className = "lcdp-footer-legal-section-content";
        contenu.innerHTML = bloc && bloc.html ? bloc.html : "";
        supprimerParagraphesVides(contenu);

        article.appendChild(titreBloc);
        article.appendChild(contenu);
        liste.appendChild(article);
      });

      appliquerRoutesSite(liste);
    } catch (erreur) {
      console.error("Erreur chargement mentions légales footer :", erreur);
      liste.innerHTML = '<p class="lcdp-footer-legal-message">Les mentions légales ne sont pas disponibles pour le moment.</p>';
    }
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

  async function chargerMentionsLegales() {
    const endpoint = obtenirEndpointEditingAdmin();

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

  function appliquerRoutesSite(racine = document) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.getAttribute("data-site-href")));
    });

    racine.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlSite(element.getAttribute("data-site-src")));
    });

    racine.querySelectorAll("a[href^='/']").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.getAttribute("href")));
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
