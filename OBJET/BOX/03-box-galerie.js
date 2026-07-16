(() => {
  "use strict";

  const siteBase = (
    window.SITE_BASE ||
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.siteBase ||
    ""
  ).replace(/\/$/, "");

  const objetBase = (
    window.SITE_CONFIG?.objetBaseUrl ||
    window.SITE_CONFIG?.OBJET_BASE ||
    (siteBase ? siteBase + "/OBJET" : "../OBJET")
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

    const cheminNettoye = chemin
      .replace(/^\/+/, "")
      .replace(/^OBJET\/+/, "");

    return objetBase + "/" + cheminNettoye;
  }

  function construireUrlRessource(chemin) {
    if (!chemin) return chemin;

    if (
      chemin.startsWith("/OBJET/") ||
      chemin.startsWith("OBJET/") ||
      chemin.startsWith("/IMAG/") ||
      chemin.startsWith("IMAG/") ||
      chemin.startsWith("/BOX/") ||
      chemin.startsWith("BOX/")
    ) {
      return construireUrlObjet(chemin);
    }

    return construireUrlSite(chemin);
  }

  async function chargerFragmentObjet(chemin) {
    const reponse = await fetch(construireUrlObjet(chemin), {
      method: "GET",
      credentials: "same-origin",
      cache: "force-cache"
    });

    if (!reponse.ok) {
      throw new Error("Fragment objet introuvable : " + chemin);
    }

    const html = await reponse.text();
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.cloneNode(true);
  }

  function construireUrlsRessource(chemin) {
    if (!chemin) return [];

    const urls = [];
    const ajouterUrl = (url) => {
      if (url && !urls.includes(url)) {
        urls.push(url);
      }
    };

    ajouterUrl(construireUrlRessource(chemin));

    if (
      chemin.startsWith("/OBJET/") ||
      chemin.startsWith("OBJET/") ||
      chemin.startsWith("/IMAG/") ||
      chemin.startsWith("IMAG/")
    ) {
      const cheminObjet = chemin
        .replace(/^\/+/, "")
        .replace(/^OBJET\/+/, "");

      ajouterUrl(construireUrlSite("/OBJET/" + cheminObjet));
      ajouterUrl("../OBJET/" + cheminObjet);
    }

    return urls;
  }

  function appliquerSourceImage(image, chemin) {
    const urls = construireUrlsRessource(chemin);
    const urlsImageDefaut = construireUrlsRessource(
      "/IMAG/PARC/galeriedefaut.jpg"
    );

    urlsImageDefaut.forEach((url) => {
      if (url && !urls.includes(url)) {
        urls.push(url);
      }
    });

    let indexUrl = 0;

    if (urls.length === 0) {
      image.removeAttribute("src");
      return;
    }

    image.onerror = () => {
      indexUrl += 1;

      if (indexUrl >= urls.length) {
        image.onerror = null;
        return;
      }

      image.src = urls[indexUrl];
    };

    image.src = urls[0];
  }

  function creerCarteGalerie(carte) {
    const article = document.createElement("article");
    article.className = "lcdp-box-galerie__card";

    const titre = document.createElement("h3");
    titre.className = "lcdp-box-galerie__card-title";
    titre.textContent = carte.titre || "";

    const image = document.createElement("img");
    image.className = "lcdp-box-galerie__image";
    image.alt = carte.imageAlt || "";
    image.loading = "lazy";
    image.decoding = "async";
    appliquerSourceImage(image, carte.imageSrc || "");

    article.appendChild(titre);
    article.appendChild(image);

    if (carte.imageLegende) {
      const legende = document.createElement("p");
      legende.className = "lcdp-box-galerie__legend";
      legende.textContent = carte.imageLegende;
      article.appendChild(legende);
    }

    const texte = document.createElement("p");
    texte.className = "lcdp-box-galerie__text";
    texte.textContent = carte.texte || "";

    article.appendChild(texte);

    return article;
  }

  async function ajouterGalerie(slotId, configuration) {
    const slot =
      typeof slotId === "string"
        ? document.getElementById(slotId)
        : slotId;

    if (!slot || !configuration) {
      return;
    }

    slot.innerHTML = "";

    const fragment = await chargerFragmentObjet("/BOX/03-box-galerie.html");
    slot.appendChild(fragment);

    const galerie = slot.querySelector("[data-lcdp-box-galerie]");
    const titre = slot.querySelector("[data-lcdp-galerie-title]");
    const liste = slot.querySelector("[data-lcdp-galerie-list]");

    if (!galerie || !titre || !liste) {
      throw new Error("Structure du bloc galerie V3 incomplète.");
    }

    if (configuration.ariaLabel) {
      galerie.setAttribute("aria-label", configuration.ariaLabel);
    }

    titre.textContent = configuration.titre || "";
    liste.innerHTML = "";

    if (Array.isArray(configuration.cartes)) {
      configuration.cartes.forEach((carte) => {
        liste.appendChild(creerCarteGalerie(carte));
      });
    }
  }

  window.LCDP_ajouterGalerie = ajouterGalerie;
})();
