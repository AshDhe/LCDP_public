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
