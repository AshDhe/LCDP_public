(() => {
  const scriptUrl = document.currentScript?.src || "";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", chargerFooterGlobal);
  } else {
    chargerFooterGlobal();
  }

  async function chargerFooterGlobal() {
    const container = document.getElementById("footer-container");

    if (!container) {
      console.warn("Footer global : #footer-container introuvable.");
      return;
    }

    const urlFooterHtml = construireUrlFooterHtml();

    try {
      const response = await fetch(urlFooterHtml, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error("Erreur HTTP " + response.status);
      }

      const html = await response.text();

      if (!html.trim().startsWith("<footer")) {
        throw new Error("Le fichier chargé n'est pas le HTML du footer.");
      }

      container.innerHTML = html;
      corrigerLiensFooterGlobal(container);

    } catch (error) {
      console.error("Footer global non chargé :", error);
      console.error("URL footer-global.html appelée :", urlFooterHtml);
    }
  }

  function construireUrlFooterHtml() {
    if (scriptUrl) {
      return new URL("footer-global.html", scriptUrl).href;
    }

    return construireUrlSite("/OBJETS/BLOCS/footer-global.html");
  }

  function corrigerLiensFooterGlobal(scope) {
    corrigerAttributs(scope, "a[href]", "href");
    corrigerAttributs(scope, "img[src]", "src");
  }

  function corrigerAttributs(scope, selector, attribut) {
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

    const siteBase = (
      window.SITE_BASE ||
      window.SITE_CONFIG?.publicBaseUrl ||
      window.SITE_CONFIG?.siteBase ||
      ""
    ).replace(/\/$/, "");

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
})();