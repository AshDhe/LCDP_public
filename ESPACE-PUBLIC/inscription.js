(() => {
  "use strict";

  // Aucun texte ni bouton de la page n’est construit ici.
  // Leur contenu est entièrement modifiable dans inscription.html.
  const siteBase = (
    window.SITE_BASE ||
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.siteBase ||
    ""
  ).replace(/\/$/, "");

  function construireUrlSite(chemin) {
    if (!chemin) return chemin;

    if (
      chemin.startsWith("#") ||
      chemin.startsWith("mailto:") ||
      chemin.startsWith("tel:") ||
      chemin.startsWith("http://") ||
      chemin.startsWith("https://") ||
      chemin.startsWith("data:")
    ) {
      return chemin;
    }

    if (siteBase) {
      return chemin.startsWith("/")
        ? siteBase + chemin
        : siteBase + "/" + chemin.replace(/^\.\//, "");
    }

    return chemin.startsWith("/") ? ".." + chemin : chemin;
  }

  function construireUrlObjet(chemin) {
    if (/^(?:https?:|data:|blob:)/i.test(chemin)) return chemin;
    const config = window.SITE_CONFIG || {};
    const relatif = chemin.replace(/^(?:\.\.\/)?\/?OBJET\//, "").replace(/^\/+/, "");
    if (typeof config.objetUrl === "function") return config.objetUrl("/" + relatif);
    const base = String(config.objetBaseUrl || config.OBJET_BASE || "").replace(/\/+$/, "");
    return base ? base + "/" + relatif : construireUrlSite("/OBJET/" + relatif);
  }

  function appliquerRoutesSite(racine = document) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      const chemin = element.dataset.siteHref;
      element.setAttribute("href", chemin.startsWith("/OBJET/") ? construireUrlObjet(chemin) : construireUrlSite(chemin));
    });
    // Les liens éditoriaux ont une seule adresse à modifier : leur attribut href.
    racine.querySelectorAll("a[href^='/']").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.getAttribute("href")));
    });
    racine.querySelectorAll("img").forEach((image) => {
      const chemin = image.getAttribute("src") || "";
      if (/^(?:\.\.\/)?\/?OBJET\//.test(chemin)) {
        image.setAttribute("src", construireUrlObjet(chemin));
      } else if (chemin.startsWith("/")) {
        image.setAttribute("src", construireUrlSite(chemin));
      }
    });
  }

  async function chargerFragment(chemin) {
    const reponse = await fetch(construireUrlSite(chemin), {
      method: "GET",
      credentials: "same-origin",
      cache: "no-cache"
    });

    if (!reponse.ok) {
      throw new Error("Fragment introuvable : " + chemin);
    }

    const html = await reponse.text();
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.cloneNode(true);
  }

  function chargerScriptUneFois(chemin) {
    const src = construireUrlSite(chemin);

    if (document.querySelector(`script[data-lcdp-script="${chemin}"]`)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.dataset.lcdpScript = chemin;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Script introuvable : " + chemin));
      document.body.appendChild(script);
    });
  }

  async function initialiserBandeau() {
    const slot = document.getElementById("lcdp-bandeau-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const bandeau = await chargerFragment("/ESPACE-PUBLIC/box-bandeau-nav-public.html");
    slot.appendChild(bandeau);

    appliquerRoutesSite(slot);

    await chargerScriptUneFois("/ESPACE-PUBLIC/box-menu-burger-public.js");

    if (typeof window.LCDP_initialiserMenuBurgerPublic === "function") {
      await window.LCDP_initialiserMenuBurgerPublic();
    }
  }

  async function initialiserFooter() {
    const slot = document.getElementById("lcdp-footer-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const footer = await chargerFragment("/OBJET/BOX/02-box-footer.html");
    slot.appendChild(footer);

    appliquerRoutesSite(slot);
  }

  function initialiserPage() {
    appliquerRoutesSite(document);
    // Une erreur du bandeau ne doit pas empêcher le chargement du footer.
    initialiserBandeau().catch((erreur) => console.error("Erreur bandeau inscription :", erreur));
    initialiserFooter().catch((erreur) => console.error("Erreur footer inscription :", erreur));
    // Même image de remplacement que la galerie existante, sans recréer ses cartes.
    document.querySelectorAll(".lcdp-box-galerie__image").forEach((image) => {
      image.addEventListener("error", () => {
        image.src = construireUrlObjet("/OBJET/IMAG/PARC/galeriedefaut.jpg");
      }, { once: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserPage, { once: true });
  } else {
    initialiserPage();
  }
})();
