(() => {
  "use strict";

  const CHEMIN_MENTIONS_LEGALES =
    "/ESPACE-PUBLIC/mentions-legales.html";

  function construireUrlMentionsLegales() {
    const config = window.SITE_CONFIG || {};

    if (typeof config.publicUrl === "function") {
      return config.publicUrl(CHEMIN_MENTIONS_LEGALES);
    }

    if (typeof window.LCDP_urlPublic === "function") {
      return window.LCDP_urlPublic(CHEMIN_MENTIONS_LEGALES);
    }

    const base = String(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.LCDP_PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    ).replace(/\/+$/, "");

    if (base) {
      return base + CHEMIN_MENTIONS_LEGALES;
    }

    return CHEMIN_MENTIONS_LEGALES;
  }

  function normaliserLienMentionsLegales(racine = document) {
    racine
      .querySelectorAll(
        "[data-lcdp-footer-mentions-legales], " +
        "[data-lcdp-box-footer] a[href*='mentions-legales']"
      )
      .forEach((element) => {
        element.removeAttribute("data-lcdp-footer-mentions-legales");
        element.removeAttribute("onclick");
        element.setAttribute(
          "href",
          construireUrlMentionsLegales()
        );
        element.setAttribute(
          "data-site-href",
          CHEMIN_MENTIONS_LEGALES
        );
      });
  }

  function ouvrirPageMentionsLegales(event) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }

    window.location.assign(construireUrlMentionsLegales());
    return false;
  }

  document.addEventListener(
    "click",
    (event) => {
      const declencheur = event.target.closest(
        "[data-lcdp-footer-mentions-legales]"
      );

      if (!declencheur) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      ouvrirPageMentionsLegales();
    },
    true
  );

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => normaliserLienMentionsLegales(document),
      { once: true }
    );
  } else {
    normaliserLienMentionsLegales(document);
  }

  window.LCDP_ouvrirMentionsLegalesFooter =
    ouvrirPageMentionsLegales;
  window.LCDP_chargerMentionsLegalesFooterDepuisObjet =
    ouvrirPageMentionsLegales;
  window.LCDP_initialiserFooterMentionsLegales = () => {
    normaliserLienMentionsLegales(document);
    return true;
  };
})();

(() => {
  "use strict";
  // Delegation compatible avec les footers inseres apres le chargement de la page.
  document.addEventListener("click", (event) => {
    const bouton = event.target.closest('[popovertarget="lcdp-footer-verification-info"]');
    if (!bouton || bouton.getAttribute("popovertargetaction") === "hide") return;
    const boite = document.getElementById("lcdp-footer-verification-info");
    const formulaire = boite?.querySelector("[data-verification-formulaire]");
    if (!formulaire || formulaire.dataset.verificationDemarre === "oui") return;
    formulaire.dataset.verificationDemarre = "oui";
    const attente = boite.querySelector("[data-verification-attente]");
    const image = boite.querySelector("[data-verification-gif]");
    const conteneur = boite.querySelector("[data-verification-conteneur]");
    if (image) image.src = construireUrlGif();
    conteneur?.setAttribute("aria-busy", "true");
    formulaire.addEventListener("load", () => {
      if (attente) attente.style.display = "none";
      formulaire.style.visibility = "visible";
      conteneur?.setAttribute("aria-busy", "false");
    }, { once: true });
    formulaire.src = formulaire.dataset.verificationSrc;
  }, true);

  function construireUrlGif() {
    const chemin = "/BOX/pictowait.gif";
    const config = window.SITE_CONFIG || {};
    if (typeof config.publicUrl === "function") return config.publicUrl(chemin);
    if (typeof window.LCDP_urlPublic === "function") return window.LCDP_urlPublic(chemin);
    const base = String(config.publicBaseUrl || config.PUBLIC_BASE || window.LCDP_PUBLIC_BASE || window.SITE_BASE || "").replace(/\/+$/, "");
    return base + chemin;
  }
})();
