(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", chargerBandeauNavigationMembre);
  } else {
    chargerBandeauNavigationMembre();
  }

  async function chargerBandeauNavigationMembre() {
    const container = document.getElementById("bandeau-nav-container");

    if (!container) return;

    try {
      const response = await fetch(construireUrlMembre("/OBJETS/BLOCS/bandeau-nav.html"), {
        method: "GET",
        credentials: "same-origin",
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error("Impossible de charger le bandeau de navigation membre");
      }

      const html = await response.text();
      container.innerHTML = html;

      corrigerLiensBandeauNavigation(container);
      initialiserBurgerMembre(container);
    } catch (error) {
      console.error("Erreur de chargement du bandeau de navigation membre :", error);
    }
  }

  function initialiserBurgerMembre(container) {
    const burgerButton = container.querySelector(".burger-button");
    const burgerNavMembre = container.querySelector(".burger-nav-membre");

    if (!burgerButton || !burgerNavMembre) return;

    burgerButton.addEventListener("click", () => {
      const isOpen = burgerButton.classList.toggle("is-open");

      burgerNavMembre.classList.toggle("is-open", isOpen);
      burgerButton.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!container.contains(event.target)) {
        fermerBurgerMembre(burgerButton, burgerNavMembre);
      }
    });

    burgerNavMembre.querySelectorAll("a").forEach((lien) => {
      lien.addEventListener("click", () => {
        fermerBurgerMembre(burgerButton, burgerNavMembre);
      });
    });
  }

  function fermerBurgerMembre(burgerButton, burgerNavMembre) {
    burgerButton.classList.remove("is-open");
    burgerNavMembre.classList.remove("is-open");
    burgerButton.setAttribute("aria-expanded", "false");
  }

  function corrigerLiensBandeauNavigation(scope) {
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

      element.setAttribute(attribut, construireUrlMembre(valeur));
    });
  }

  function construireUrlMembre(chemin) {
    const siteBase = normaliserSiteBase();

    if (!chemin) return chemin;

    if (chemin.startsWith("http://") || chemin.startsWith("https://")) {
      return chemin;
    }

    if (!siteBase) {
      return chemin.startsWith("/") ? "." + chemin : chemin;
    }

    if (chemin.startsWith("/")) {
      return siteBase + chemin;
    }

    return siteBase + "/" + chemin.replace(/^\.\//, "");
  }

  function normaliserSiteBase() {
    const siteBase =
      window.SITE_BASE ||
      window.SITE_CONFIG?.membreBaseUrl ||
      window.SITE_CONFIG?.MEMBRE_BASE ||
      "";

    return siteBase.replace(/\/$/, "");
  }
})();