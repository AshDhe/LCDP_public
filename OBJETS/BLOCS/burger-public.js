(() => {
  let chargementBoiteDialoguePublic = null;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserBandeauNavigationPublic);
  } else {
    initialiserBandeauNavigationPublic();
  }

  function initialiserBandeauNavigationPublic() {
    const container = document.getElementById("bandeau-nav-container");

    if (!container) return;

    corrigerLiensBandeauNavigation(container);
    initialiserSessionsPubliques();
    initialiserBurgerPublic(container);
  }

  function initialiserBurgerPublic(container) {
    if (container.dataset.burgerPublicInitialise === "true") return;

    const burgerButton = container.querySelector(".burger-button");
    const burgerNavPublic = container.querySelector(".burger-nav-public");

    if (!burgerButton || !burgerNavPublic) return;

    container.dataset.burgerPublicInitialise = "true";

    burgerButton.addEventListener("click", () => {
      const isOpen = burgerButton.classList.toggle("is-open");

      burgerNavPublic.classList.toggle("is-open", isOpen);
      burgerButton.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!container.contains(event.target)) {
        fermerBurgerPublic(burgerButton, burgerNavPublic);
      }
    });

    initialiserLienMonComptePublic(container, burgerButton, burgerNavPublic);

    burgerNavPublic.querySelectorAll("a").forEach((lien) => {
      if (lien.id === "lien-mon-compte-public") return;

      lien.addEventListener("click", () => {
        fermerBurgerPublic(burgerButton, burgerNavPublic);
      });
    });
  }

  function initialiserLienMonComptePublic(container, burgerButton, burgerNavPublic) {
    const lienMonCompte = container.querySelector("#lien-mon-compte-public");

    if (!lienMonCompte) return;

    lienMonCompte.addEventListener("click", async (event) => {
      event.preventDefault();

      fermerBurgerPublic(burgerButton, burgerNavPublic);

      await ouvrirDialogueMonComptePublic();
    });
  }

  async function ouvrirDialogueMonComptePublic() {
    const dialogueDisponible = await assurerBoiteDialogueDisponible();

    if (!dialogueDisponible || typeof window.afficherBoiteDialogue !== "function") {
      window.location.href = construireUrlSite(
        "/PAGES/PUBLIQUES/CHOIX-CONNEXION/choix-connexion.html?source=menu-mon-compte"
      );
      return;
    }

    const resultat = await window.afficherBoiteDialogue({
      titre: "Choisissez votre compte",
      texteAnnuler: "Fermer",
      texteValider: "Me connecter",
      texteErreur: "Merci de choisir un type de compte.",
      champs: [
        {
          id: "choix-compte-membre",
          name: "compte",
          label: "Compte membre",
          type: "radio",
          value: "membre",
          required: true
        },
        {
          id: "choix-compte-parc",
          name: "compte",
          label: "Compte parc",
          type: "radio",
          value: "parc",
          required: true
        },
        {
          id: "choix-compte-coach",
          name: "compte",
          label: "Compte coach",
          type: "radio",
          value: "coach",
          required: true
        }
      ]
    });

    if (!resultat || !resultat.compte) {
      return;
    }

    await redirigerSelonComptePublic(resultat.compte);
  }

  async function redirigerSelonComptePublic(compte) {
    const urlConnexionFallback = construireUrlSite(obtenirCheminConnexionCompte(compte));
    const workerUrl = obtenirWorkerUserRouteurUrl();

    if (!workerUrl) {
      window.location.href = urlConnexionFallback;
      return;
    }

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          compte
        })
      });

      if (!response.ok) {
        throw new Error("Routeur utilisateur indisponible.");
      }

      const data = await response.json().catch(() => null);

      if (data && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      window.location.href = urlConnexionFallback;
    } catch (error) {
      console.error("Erreur routeur utilisateur :", error);
      window.location.href = urlConnexionFallback;
    }
  }

  function obtenirCheminConnexionCompte(compte) {
    const cheminsConnexion = {
      membre: "/PAGES/PUBLIQUES/CONNEXION-MEMBRE/connexion-membre.html?source=menu-mon-compte",
      parc: "/PAGES/PUBLIQUES/CONNEXION-PARC/connexion-parc.html?source=menu-mon-compte",
      coach: "/PAGES/PUBLIQUES/CONNEXION-COACH/connexion-coach.html?source=menu-mon-compte"
    };

    return cheminsConnexion[compte] ||
      "/PAGES/PUBLIQUES/CHOIX-CONNEXION/choix-connexion.html?source=menu-mon-compte";
  }

  function obtenirWorkerUserRouteurUrl() {
    const config = window.SITE_CONFIG || {};

    if (config.workerUserRouteurUrl) {
      return config.workerUserRouteurUrl;
    }

    if (config.WORKER_USER_ROUTEUR_URL) {
      return config.WORKER_USER_ROUTEUR_URL;
    }

    if (typeof config.apiUrl === "function") {
      return config.apiUrl("user-routeur-api");
    }

    return "https://user-routeur-api.lacleduparc.fr";
  }

  async function assurerBoiteDialogueDisponible() {
    if (chargementBoiteDialoguePublic) {
      return chargementBoiteDialoguePublic;
    }

    chargementBoiteDialoguePublic = (async () => {
      await chargerCssBoiteDialogue();

      const container = assurerContainerBoiteDialogue();

      if (!container) {
        return false;
      }

      if (!document.getElementById("boite-dialogue")) {
        const htmlCharge = await chargerHtmlBoiteDialogue(container);

        if (!htmlCharge) {
          return false;
        }
      }

      if (typeof window.afficherBoiteDialogue !== "function") {
        await chargerScriptBoiteDialogue();
      }

      return typeof window.afficherBoiteDialogue === "function";
    })();

    return chargementBoiteDialoguePublic;
  }

  function assurerContainerBoiteDialogue() {
    let container = document.getElementById("boite-dialogue-container");

    if (container) {
      return container;
    }

    container = document.createElement("div");
    container.id = "boite-dialogue-container";
    document.body.appendChild(container);

    return container;
  }

  async function chargerHtmlBoiteDialogue(container) {
    try {
      const response = await fetch(construireUrlSite("/OBJETS/BLOCS/boite-dialogue.html"), {
        method: "GET",
        credentials: "omit",
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error("Impossible de charger la boîte de dialogue.");
      }

      container.innerHTML = await response.text();

      return true;
    } catch (error) {
      console.error("Erreur de chargement HTML de la boîte de dialogue :", error);
      return false;
    }
  }

  function chargerScriptBoiteDialogue() {
    return new Promise((resolve, reject) => {
      const src = construireUrlSite("/OBJETS/BLOCS/boite-dialogue.js");
      const scriptExistant = Array.from(document.querySelectorAll("script[src]"))
        .find((script) => script.src === new URL(src, window.location.href).href);

      if (scriptExistant) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Impossible de charger boite-dialogue.js"));

      document.body.appendChild(script);
    });
  }

  function chargerCssBoiteDialogue() {
    return new Promise((resolve) => {
      const href = construireUrlSite("/OBJETS/CSS/boite-dialogue.css");
      const hrefComplet = new URL(href, window.location.href).href;

      const cssExistant = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .find((link) => link.href === hrefComplet);

      if (cssExistant) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;

      link.onload = () => resolve();
      link.onerror = () => {
        console.error("Impossible de charger boite-dialogue.css");
        resolve();
      };

      document.head.appendChild(link);
    });
  }

  function fermerBurgerPublic(burgerButton, burgerNavPublic) {
    burgerButton.classList.remove("is-open");
    burgerNavPublic.classList.remove("is-open");
    burgerButton.setAttribute("aria-expanded", "false");
  }

  function initialiserSessionsPubliques() {
    window.LCDP_SESSIONS = {
      membre: cookieExiste("idsession_membre"),
      parc: cookieExiste("idsession_parc"),
      coach: cookieExiste("idsession_coach")
    };
  }

  function cookieExiste(nom) {
    return document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .some((cookie) => cookie.startsWith(nom + "="));
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

      element.setAttribute(attribut, construireUrlSite(valeur));
    });
  }

  function construireUrlSite(chemin) {
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
      window.SITE_CONFIG?.publicBaseUrl ||
      window.SITE_CONFIG?.siteBase ||
      "";

    return siteBase.replace(/\/$/, "");
  }
})();