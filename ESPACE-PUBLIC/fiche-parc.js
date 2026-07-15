(() => {
  "use strict";

  const CONFIG_PAGE = window.SITE_CONFIG || {};
  const DOSSIER_IMAGES_PARC_OBJET = "/IMAG/PARC";
  const CLE_STOCKAGE_FICHE_PARC = "lcdp-fiche-parc";

  const ENDPOINT_NOUVELLE_DATE_MEMBRE = construireEndpointApi(
    "workerNouvelleDateMembreUrl",
    "WORKER_NOUVELLE_DATE_MEMBRE_URL",
    "nouvelle-date-membre-api"
  );

  const PAGE_RESERVER_MEMBRE = construireUrlMembre(
    "/ESPACE-MEMBRE/reserver-membre.html"
  );

  let pageInitialisee = false;
  let parcActif = null;
  let templateMapParc = null;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserPage);
  } else {
    initialiserPage();
  }

  async function initialiserPage() {
    if (pageInitialisee) return;
    pageInitialisee = true;

    appliquerRoutesSite(document);

    try {
      await Promise.all([
        initialiserBandeau(),
        initialiserFooter(),
        chargerTemplateCarteParc()
      ]);

      parcActif = await recupererParcPage();
      afficherFicheParc(parcActif);
    } catch (error) {
      console.error("Erreur fiche parc :", error);
      afficherEtatChargement(
        error.message || "Impossible de charger la fiche du parc.",
        false
      );
    }
  }

  async function recupererParcPage() {
    const parcTransmis = lireParcTransmis();
    const idparc = nettoyerTexteFiche(
      parcTransmis.idparc || parcTransmis.id || ""
    );
    const departement = nettoyerDepartement(
      parcTransmis.dptmt || parcTransmis.departement || ""
    );

    if (idparc && departement && ENDPOINT_NOUVELLE_DATE_MEMBRE) {
      try {
        const parcWorker = await chargerParcDepuisDepartement(
          idparc,
          departement
        );

        if (parcWorker) {
          return {
            ...parcTransmis,
            ...parcWorker
          };
        }
      } catch (error) {
        if (!parcContientDonneesAffichables(parcTransmis)) {
          throw error;
        }

        console.warn(
          "La fiche parc utilise les données transmises par la page d’origine.",
          error
        );
      }
    }

    if (parcContientDonneesAffichables(parcTransmis)) {
      return parcTransmis;
    }

    throw new Error("Aucun parc n’a été transmis à cette page.");
  }

  function lireParcTransmis() {
    const depuisEtatNavigation =
      window.history &&
      window.history.state &&
      typeof window.history.state.parc === "object"
        ? window.history.state.parc
        : null;

    if (depuisEtatNavigation) {
      return depuisEtatNavigation;
    }

    const depuisStockage = lireParcStocke();

    if (depuisStockage) {
      return depuisStockage;
    }

    return lireParcDepuisUrl();
  }

  function lireParcStocke() {
    try {
      const brut = window.sessionStorage.getItem(CLE_STOCKAGE_FICHE_PARC);

      if (!brut) return null;

      const parc = JSON.parse(brut);
      return parc && typeof parc === "object" ? parc : null;
    } catch {
      return null;
    }
  }

  function lireParcDepuisUrl() {
    const params = new URLSearchParams(window.location.search);
    const parc = {};

    [
      "idparc",
      "id",
      "nom",
      "nomparc",
      "dptmt",
      "departement",
      "prez",
      "presentation",
      "description",
      "latparc",
      "latitude",
      "lngparc",
      "longitude",
      "contact",
      "contactparc",
      "emailparc",
      "email",
      "telephone",
      "telparc",
      "tel"
    ].forEach((cle) => {
      const valeur = params.get(cle);

      if (valeur !== null && valeur !== "") {
        parc[cle] = valeur;
      }
    });

    return parc;
  }

  function parcContientDonneesAffichables(parc) {
    if (!parc || typeof parc !== "object") return false;

    return Boolean(
      nettoyerTexteFiche(
        parc.idparc ||
        parc.id ||
        parc.nom ||
        parc.nomparc ||
        parc.prez ||
        parc.presentation ||
        parc.description ||
        ""
      )
    );
  }

  async function chargerParcDepuisDepartement(idparc, departement) {
    const url =
      ENDPOINT_NOUVELLE_DATE_MEMBRE +
      "/departement?dptmt=" +
      encodeURIComponent(departement);

    const reponse = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Accept": "application/json"
      }
    });

    const resultat = await reponse.json().catch(() => null);

    if (!reponse.ok || !resultat || !reponseApiOk(resultat)) {
      throw new Error(
        messageErreurApi(
          resultat,
          "Impossible de charger les informations du parc."
        )
      );
    }

    const parcs = Array.isArray(resultat.parcs) ? resultat.parcs : [];

    return parcs.find((parc) => {
      return String(parc.idparc || parc.id || "") === String(idparc);
    }) || null;
  }

  function afficherFicheParc(parc) {
    const nom = nettoyerTexteFiche(
      parc.nom || parc.nomparc || "Parc"
    ) || "Parc";

    const titre = document.querySelector("[data-lcdp-fiche-parc-title]");
    const actionsSlot = document.querySelector(
      "[data-lcdp-fiche-parc-actions]"
    );
    const presentation = document.querySelector(
      "[data-lcdp-fiche-parc-presentation]"
    );
    const galerieSlot = document.querySelector(
      "[data-lcdp-fiche-parc-galerie-slot]"
    );
    const mapSlot = document.querySelector(
      "[data-lcdp-fiche-parc-map-slot]"
    );
    const contact = document.querySelector(
      "[data-lcdp-fiche-parc-contact]"
    );

    if (titre) {
      titre.textContent = "Parc de " + nom;
    }

    document.title = "Parc de " + nom + " - La Clé du Parc";

    if (actionsSlot) {
      actionsSlot.replaceChildren(creerActionsFicheParc(parc));
    }

    remplirBlocTexteFiche(
      presentation,
      nettoyerTexteFiche(
        parc.prez ||
        parc.presentation ||
        parc.description ||
        ""
      ) || "Présentation non renseignée."
    );

    afficherGalerieParcDansSlot(galerieSlot, parc);
    afficherCarteParcDansSlot(mapSlot, parc);

    remplirBlocTexteFiche(
      contact,
      construireTexteContactParc(parc)
    );

    afficherEtatChargement("", true);
  }

  function remplirBlocTexteFiche(conteneur, texte) {
    if (!conteneur) return;

    conteneur.innerHTML = "";

    const lignes = String(texte || "")
      .split("\n")
      .map(nettoyerTexteFiche)
      .filter(Boolean);

    if (!lignes.length) {
      const paragraphe = document.createElement("p");
      paragraphe.textContent = "Non renseigné.";
      conteneur.appendChild(paragraphe);
      return;
    }

    lignes.forEach((ligne) => {
      const paragraphe = document.createElement("p");
      paragraphe.textContent = ligne;
      conteneur.appendChild(paragraphe);
    });
  }

  function afficherGalerieParcDansSlot(slot, parc) {
    if (!slot) return;

    slot.innerHTML = "";

    const galerie = document.createElement("section");
    galerie.className =
      "lcdp-component lcdp-box-galerie lcdp-box-fiche-parc__galerie-box";
    galerie.setAttribute("aria-label", "Galerie photo du parc");

    const liste = document.createElement("div");
    liste.className = "lcdp-box-galerie__list";

    const nom = nettoyerTexteFiche(
      parc.nom || parc.nomparc || "Parc"
    ) || "Parc";

    for (let index = 1; index <= 6; index += 1) {
      const numero = String(index).padStart(2, "0");
      const card = document.createElement("article");
      card.className =
        "lcdp-box-galerie__card lcdp-box-fiche-parc__galerie-card";

      const image = document.createElement("img");
      image.className =
        "lcdp-box-galerie__image lcdp-box-fiche-parc__galerie-image";
      image.src = construireUrlImageParcFichier(
        parc,
        numero + ".webp"
      );
      image.alt = "Photo " + numero + " du parc de " + nom;
      image.loading = "lazy";
      image.decoding = "async";

      image.addEventListener("error", () => {
        card.hidden = true;
      });

      card.appendChild(image);
      liste.appendChild(card);
    }

    galerie.appendChild(liste);
    slot.appendChild(galerie);
  }

  function afficherCarteParcDansSlot(slot, parc) {
    if (!slot) return;

    slot.innerHTML = "";

    const carte = templateMapParc
      ? templateMapParc.cloneNode(true)
      : null;

    if (!carte) return;

    const coords = carte.querySelector(
      "[data-lcdp-card-map-parc-coords]"
    );

    const latitude = nettoyerTexteFiche(
      parc.latparc || parc.latitude || ""
    );

    const longitude = nettoyerTexteFiche(
      parc.lngparc || parc.longitude || ""
    );

    if (coords) {
      coords.textContent =
        latitude && longitude
          ? latitude + ", " + longitude
          : "Coordonnées GPS non renseignées";
    }

    slot.appendChild(carte);
  }

  function construireTexteContactParc(parc) {
    const lignes = [
      parc.contact,
      parc.contactparc,
      parc.emailparc,
      parc.email,
      parc.telephone,
      parc.telparc,
      parc.tel
    ]
      .map(nettoyerTexteFiche)
      .filter(Boolean)
      .filter((valeur, index, liste) => {
        return liste.indexOf(valeur) === index;
      });

    return lignes.length
      ? lignes.join("\n")
      : "Contact non renseigné.";
  }

  function creerActionsFicheParc(parc) {
    const actions = document.createElement("div");
    actions.className = "lcdp-box-fiche-parc__actions-list";

    const boutonReserver = document.createElement("button");
    boutonReserver.type = "button";
    boutonReserver.className =
      "lcdp-button lcdp-box-calendrier-mois__action-reserver " +
      "lcdp-box-fiche-parc__action-reserver";
    boutonReserver.textContent = "RÉSERVER";
    boutonReserver.addEventListener("click", () => {
      ouvrirPageReserverMembre(parc, "reservation");
    });

    const boutonPlanning = document.createElement("button");
    boutonPlanning.type = "button";
    boutonPlanning.className =
      "lcdp-button lcdp-button-primary " +
      "lcdp-box-fiche-parc__action-planning";
    boutonPlanning.textContent = "Planning parc";
    boutonPlanning.addEventListener("click", () => {
      ouvrirPageReserverMembre(parc, "planning");
    });

    const actionPartager = creerActionPartagerFicheParc();
    actionPartager.addEventListener("click", () => {
      partagerFicheParc(parc).catch(console.error);
    });

    actionPartager.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        partagerFicheParc(parc).catch(console.error);
      }
    });

    actions.appendChild(boutonReserver);
    actions.appendChild(boutonPlanning);
    actions.appendChild(actionPartager);

    return actions;
  }

  function creerActionPartagerFicheParc() {
    const action = document.createElement("span");
    action.className = "lcdp-box-fiche-parc__partage";
    action.setAttribute("role", "button");
    action.setAttribute("tabindex", "0");
    action.setAttribute("aria-label", "Partager la page");

    const bouton = document.createElement("span");
    bouton.className = "lcdp-box-fiche-parc__partage-icone";
    bouton.setAttribute("aria-hidden", "true");

    const icone = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

    icone.setAttribute("viewBox", "0 0 24 24");
    icone.setAttribute("width", "20");
    icone.setAttribute("height", "20");
    icone.setAttribute("aria-hidden", "true");
    icone.setAttribute("focusable", "false");
    icone.setAttribute("fill", "none");
    icone.setAttribute("stroke", "currentColor");
    icone.setAttribute("stroke-width", "2");
    icone.setAttribute("stroke-linecap", "round");
    icone.setAttribute("stroke-linejoin", "round");

    const trace = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    trace.setAttribute("d", "M22 2 11 13");

    const trace2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    trace2.setAttribute(
      "d",
      "m22 2-7 20-4-9-9-4Z"
    );

    icone.appendChild(trace);
    icone.appendChild(trace2);
    bouton.appendChild(icone);

    const libelle = document.createElement("span");
    libelle.className = "lcdp-box-fiche-parc__partage-libelle";
    libelle.textContent = "Partager";

    action.appendChild(bouton);
    action.appendChild(libelle);

    return action;
  }

  function ouvrirPageReserverMembre(parc, vue) {
    const params = new URLSearchParams();
    const idparc = nettoyerTexteFiche(
      parc.idparc || parc.id || ""
    );
    const departement = nettoyerDepartement(
      parc.dptmt || parc.departement || ""
    );

    if (idparc) params.set("idparc", idparc);
    if (departement) params.set("dptmt", departement);
    params.set("source", "fiche-parc");
    params.set("vue", vue || "reservation");

    const separateur = PAGE_RESERVER_MEMBRE.includes("?") ? "&" : "?";
    window.location.href =
      PAGE_RESERVER_MEMBRE +
      separateur +
      params.toString();
  }

  async function partagerFicheParc(parc) {
    const nom = nettoyerTexteFiche(
      parc.nom || parc.nomparc || "Parc"
    ) || "Parc";

    const donnees = {
      title: "Parc de " + nom + " - La Clé du Parc",
      text: "Découvrez le parc de " + nom + " sur La Clé du Parc.",
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(donnees);
      return;
    }

    const sujet = encodeURIComponent(donnees.title);
    const corps = encodeURIComponent(
      donnees.text + "\n\n" + donnees.url
    );

    window.location.href =
      "mailto:?subject=" + sujet + "&body=" + corps;
  }

  async function chargerTemplateCarteParc() {
    const fragment = await chargerFragmentObjet(
      "/BOX/04-box-card-map-parc.html"
    );

    templateMapParc = fragment.querySelector(
      "[data-lcdp-box-card-map-parc]"
    );

    if (!templateMapParc) {
      throw new Error("Template carte parc introuvable.");
    }
  }

  async function initialiserBandeau() {
    const slot = document.getElementById("lcdp-bandeau-slot");

    if (!slot) return;

    slot.innerHTML = "";

    const bandeau = await chargerFragmentPublic(
      "/ESPACE-PUBLIC/box-bandeau-nav-public.html"
    );

    slot.appendChild(bandeau);
    appliquerRoutesSite(slot);

    await chargerScriptPublicUneFois(
      "/ESPACE-PUBLIC/box-menu-burger-public.js"
    );

    if (
      typeof window.LCDP_initialiserMenuBurgerPublic === "function"
    ) {
      await window.LCDP_initialiserMenuBurgerPublic();
    }
  }

  async function initialiserFooter() {
    const slot = document.getElementById("lcdp-footer-slot");

    if (!slot) return;

    slot.innerHTML = "";

    const fragmentWraper = await chargerFragmentObjet(
      "/BOX/02-box-wraper-footer.html"
    );

    slot.appendChild(fragmentWraper);

    const zoneFooter = slot.querySelector(
      "[data-lcdp-wraper-footer-footer]"
    );

    if (!zoneFooter) {
      throw new Error("Structure wrapper footer incomplète.");
    }

    const footer = await chargerFragmentObjet(
      "/BOX/02-box-footer.html"
    );

    zoneFooter.appendChild(footer);
    appliquerRoutesSite(slot);
  }

  function afficherEtatChargement(message, termine) {
    const statut = document.getElementById(
      "lcdp-fiche-parc-status"
    );

    if (!statut) return;

    if (termine) {
      statut.hidden = true;
      statut.textContent = "";
      return;
    }

    statut.hidden = false;
    statut.textContent = message || "[Chargement de la fiche parc]";
  }

  function construireUrlImageParcFichier(parc, fichier) {
    const departement = nettoyerDepartement(
      parc && (parc.dptmt || parc.departement || "")
    );

    const dossierParc = normaliserNomParcPourChemin(
      parc && (parc.nom || parc.nomparc || "")
    );

    const nomFichier = String(fichier || "").replace(/^\/+/, "");

    if (!departement || !dossierParc || !nomFichier) {
      return construireUrlObjet(
        DOSSIER_IMAGES_PARC_OBJET + "/parc-defaut.webp"
      );
    }

    return construireUrlObjet(
      DOSSIER_IMAGES_PARC_OBJET +
      "/" +
      encodeURIComponent(departement) +
      "/" +
      encodeURIComponent(dossierParc) +
      "/" +
      encodeURIComponent(nomFichier)
    );
  }

  function normaliserNomParcPourChemin(valeur) {
    return String(valeur || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");
  }

  function nettoyerDepartement(valeur) {
    const departement = String(valeur || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    if (/^[1-9]$/.test(departement)) {
      return "0" + departement;
    }

    return departement;
  }

  function nettoyerTexteFiche(valeur) {
    return String(valeur || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function construireEndpointApi(
    cleMinuscule,
    cleMajuscule,
    sousDomaine
  ) {
    const endpoint = String(
      CONFIG_PAGE[cleMinuscule] ||
      CONFIG_PAGE[cleMajuscule] ||
      ""
    ).replace(/\/+$/, "");

    if (endpoint) return endpoint;

    if (typeof CONFIG_PAGE.apiUrl === "function") {
      return String(
        CONFIG_PAGE.apiUrl(sousDomaine)
      ).replace(/\/+$/, "");
    }

    return "";
  }

  function construireUrlPublic(chemin) {
    if (typeof window.LCDP_urlPublic === "function") {
      return window.LCDP_urlPublic(chemin);
    }

    if (typeof CONFIG_PAGE.publicUrl === "function") {
      return CONFIG_PAGE.publicUrl(chemin);
    }

    return buildUrl(
      CONFIG_PAGE.publicBaseUrl ||
      CONFIG_PAGE.PUBLIC_BASE ||
      CONFIG_PAGE.siteBase ||
      "",
      chemin
    );
  }

  function construireUrlMembre(chemin) {
    if (typeof CONFIG_PAGE.membreUrl === "function") {
      return CONFIG_PAGE.membreUrl(chemin);
    }

    return buildUrl(
      CONFIG_PAGE.membreBaseUrl ||
      CONFIG_PAGE.MEMBRE_BASE ||
      CONFIG_PAGE.siteBase ||
      "",
      chemin
    );
  }

  function construireUrlObjet(chemin) {
    if (typeof window.LCDP_urlObjet === "function") {
      return window.LCDP_urlObjet(chemin);
    }

    if (typeof CONFIG_PAGE.objetUrl === "function") {
      return CONFIG_PAGE.objetUrl(chemin);
    }

    const objetBase =
      CONFIG_PAGE.objetBaseUrl ||
      CONFIG_PAGE.OBJET_BASE ||
      buildUrl(
        CONFIG_PAGE.publicBaseUrl ||
        CONFIG_PAGE.PUBLIC_BASE ||
        "",
        "/OBJET"
      );

    return buildUrl(objetBase, chemin);
  }

  function buildUrl(base, chemin) {
    return (
      String(base || "").replace(/\/+$/, "") +
      "/" +
      String(chemin || "").replace(/^\/+/, "")
    );
  }

  async function chargerFragmentPublic(chemin) {
    return chargerFragmentDepuisUrl(
      construireUrlPublic(chemin)
    );
  }

  async function chargerFragmentObjet(chemin) {
    return chargerFragmentDepuisUrl(
      construireUrlObjet(chemin)
    );
  }

  async function chargerFragmentDepuisUrl(url) {
    const reponse = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Accept": "text/html"
      }
    });

    if (!reponse.ok) {
      throw new Error("Fragment indisponible : " + url);
    }

    const texte = await reponse.text();
    const template = document.createElement("template");
    template.innerHTML = texte.trim();

    return template.content.cloneNode(true);
  }

  async function chargerScriptPublicUneFois(chemin) {
    const url = construireUrlPublic(chemin);

    if (
      Array.from(document.scripts).some((script) => {
        return script.src === url;
      })
    ) {
      return;
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener(
        "error",
        () => reject(
          new Error("Script indisponible : " + url)
        ),
        { once: true }
      );
      document.head.appendChild(script);
    });
  }

  function appliquerRoutesSite(racine) {
    const zone = racine || document;

    zone.querySelectorAll("[data-site-href]").forEach((element) => {
      const chemin = element.getAttribute("data-site-href");

      if (!chemin) return;

      element.setAttribute(
        "href",
        chemin.startsWith("/OBJET/")
          ? construireUrlObjet(chemin.replace(/^\/OBJET/, ""))
          : construireUrlPublic(chemin)
      );
    });

    zone.querySelectorAll("[data-site-src]").forEach((element) => {
      const chemin = element.getAttribute("data-site-src");

      if (!chemin) return;

      element.setAttribute(
        "src",
        chemin.startsWith("/OBJET/")
          ? construireUrlObjet(chemin.replace(/^\/OBJET/, ""))
          : construireUrlPublic(chemin)
      );
    });
  }

  function reponseApiOk(resultat) {
    return Boolean(
      resultat &&
      (resultat.success === true || resultat.ok === true)
    );
  }

  function messageErreurApi(resultat, fallback) {
    return nettoyerTexteFiche(
      resultat &&
      (resultat.message || resultat.error || resultat.erreur)
    ) || fallback;
  }
})();
