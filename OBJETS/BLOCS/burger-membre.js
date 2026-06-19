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
      const response = await fetch(
        construireUrlPublic("/OBJETS/BLOCS/bandeau-nav-membre.html"),
        {
          method: "GET",
          credentials: "omit",
          cache: "no-cache"
        }
      );

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
    scope.querySelectorAll("a[href]").forEach((element) => {
      const valeur = element.getAttribute("href");
      element.setAttribute("href", construireUrlMembre(valeur));
    });

    scope.querySelectorAll("img[src]").forEach((element) => {
      const valeur = element.getAttribute("src");
      element.setAttribute("src", construireUrlPublic(valeur));
    });
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
})();