(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", chargerFooterGlobal);
  } else {
    chargerFooterGlobal();
  }

  async function chargerFooterGlobal() {
    const container = document.getElementById("footer-container");

    if (!container) return;

    try {
      const response = await fetch(construireUrlSite("/OBJETS/BLOCS/footer-global.html"));

      if (!response.ok) {
        throw new Error("Impossible de charger le footer global");
      }

      const html = await response.text();
      container.innerHTML = html;

      corrigerLiensFooterGlobal(container);
    } catch (error) {
      console.error("Erreur de chargement du footer global :", error);
    }
  }

  function corrigerLiensFooterGlobal(scope) {
    corrigerAttributsAvecSiteBase(scope, "a[href]", "href");
    corrigerAttributsAvecSiteBase(scope, "img[src]", "src");
  }

  function corrigerAttributsAvecSiteBase(scope, selector, attribut) {
    scope.querySelectorAll(selector).forEach((element) => {
      const valeur = element.getAttribute(attribut);

      if (
        !valeur ||
        valeur.startsWith("#") ||
        valeur.startsWith("mailto:") ||
        valeur.startsWith("tel:") ||
        valeur.startsWith("http://") ||
        valeur.startsWith("https://")
      ) {
        return;
      }

      element.setAttribute(attribut, construireUrlSite(valeur));
    });
  }

  function construireUrlSite(chemin) {
    if (typeof window.construireUrlSite === "function") {
      return window.construireUrlSite(chemin);
    }

    const siteBase = normaliserSiteBase();
    const siteRootRelative = window.SITE_ROOT_RELATIVE || "./";

    if (!chemin) return chemin;

    if (
      chemin.startsWith("#") ||
      chemin.startsWith("mailto:") ||
      chemin.startsWith("tel:") ||
      chemin.startsWith("http://") ||
      chemin.startsWith("https://")
    ) {
      return chemin;
    }

    if (siteBase) {
      return chemin.startsWith("/")
        ? siteBase + chemin
        : siteBase + "/" + chemin.replace(/^\.\//, "");
    }

    return chemin.startsWith("/")
      ? siteRootRelative.replace(/\/?$/, "/") + chemin.replace(/^\//, "")
      : chemin;
  }

  function normaliserSiteBase() {
    const siteBase =
      window.SITE_BASE ||
      window.SITE_CONFIG?.publicBaseUrl ||
      window.SITE_CONFIG?.siteBase ||
      "";

    return siteBase.replace(/\/$/, "");
  }
})();