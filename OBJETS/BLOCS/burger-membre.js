(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserBandeauNavigationMembre);
  } else {
    initialiserBandeauNavigationMembre();
  }

  function initialiserBandeauNavigationMembre() {
    const container = document.getElementById("bandeau-nav-container");

    if (!container) return;

    corrigerLiensBandeauNavigation(container);
    initialiserBurgerMembre(container);
  }

  function initialiserBurgerMembre(container) {
    if (container.dataset.burgerMembreInitialise === "true") return;

    const burgerButton = container.querySelector(".burger-button");
    const burgerNavMembre = container.querySelector(".burger-nav-membre");

    if (!burgerButton || !burgerNavMembre) return;

    container.dataset.burgerMembreInitialise = "true";

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
    scope.querySelectorAll("[data-site-href]").forEach((element) => {
      const chemin = element.dataset.siteHref;
      const espace = element.dataset.space || "membre";

      element.setAttribute("href", construireUrlEspace(espace, chemin));
    });

    scope.querySelectorAll("a[href^='/']").forEach((element) => {
      const chemin = element.getAttribute("href");
      const espace = element.dataset.space || "membre";

      element.setAttribute("href", construireUrlEspace(espace, chemin));
    });

    scope.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlPublic(element.dataset.siteSrc));
    });

    scope.querySelectorAll("img[src^='/']").forEach((element) => {
      element.setAttribute("src", construireUrlPublic(element.getAttribute("src")));
    });
  }

  function construireUrlEspace(espace, chemin) {
    switch (espace) {
      case "public":
        return construireUrlPublic(chemin);

      case "parc":
        return construireUrlDepuisBase(normaliserBaseParc(), chemin);

      case "coach":
        return construireUrlDepuisBase(normaliserBaseCoach(), chemin);

      case "membre":
      default:
        return construireUrlMembre(chemin);
    }
  }

  function construireUrlPublic(chemin) {
    return construireUrlDepuisBase(normaliserBasePublic(), chemin);
  }

  function construireUrlMembre(chemin) {
    return construireUrlDepuisBase(normaliserBaseMembre(), chemin);
  }

  function construireUrlDepuisBase(baseUrl, chemin) {
    const valeur = String(chemin || "");

    if (
      !valeur ||
      valeur.startsWith("#") ||
      valeur.startsWith("mailto:") ||
      valeur.startsWith("tel:") ||
      valeur.startsWith("http://") ||
      valeur.startsWith("https://")
    ) {
      return valeur;
    }

    const base = String(baseUrl || "").replace(/\/$/, "");

    if (!base) {
      return valeur.startsWith("/") ? valeur : "/" + valeur;
    }

    return valeur.startsWith("/")
      ? base + valeur
      : base + "/" + valeur.replace(/^\.\//, "");
  }

  function normaliserBasePublic() {
    return String(
      window.SITE_CONFIG?.publicBaseUrl ||
      window.SITE_CONFIG?.PUBLIC_BASE ||
      ""
    ).replace(/\/$/, "");
  }

  function normaliserBaseMembre() {
    return String(
      window.SITE_BASE ||
      window.SITE_CONFIG?.membreBaseUrl ||
      window.SITE_CONFIG?.MEMBRE_BASE ||
      ""
    ).replace(/\/$/, "");
  }

  function normaliserBaseParc() {
    return String(
      window.SITE_CONFIG?.parcBaseUrl ||
      window.SITE_CONFIG?.PARC_BASE ||
      ""
    ).replace(/\/$/, "");
  }

  function normaliserBaseCoach() {
    return String(
      window.SITE_CONFIG?.coachBaseUrl ||
      window.SITE_CONFIG?.COACH_BASE ||
      ""
    ).replace(/\/$/, "");
  }
})();
