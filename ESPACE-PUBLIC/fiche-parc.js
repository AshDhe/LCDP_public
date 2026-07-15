(() => {
  "use strict";

  const siteBase = (
    window.SITE_BASE ||
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.siteBase ||
    ""
  ).replace(/\/$/, "");

  const config = window.SITE_CONFIG || {};
  const dossierImagesParc = "/IMAG/PARC";

  let pageInitialisee = false;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserPage);
  } else {
    initialiserPage();
  }

  async function initialiserPage() {
    if (pageInitialisee) {
      return;
    }

    pageInitialisee = true;
    appliquerRoutesSite(document);

    const promesseBandeau = initialiserBandeau().catch((erreur) => {
      console.warn("Bandeau public indisponible.", erreur);
    });

    const promesseFooter = initialiserFooter().catch((erreur) => {
      console.warn("Footer indisponible.", erreur);
    });

    try {
      const parc = lireParcDepuisUrl();
      await afficherFicheParc(parc);
      afficherStatut("", true);
    } catch (erreur) {
      console.error("Erreur fiche parc :", erreur);
      afficherStatut(
        erreur.message || "Impossible d’afficher la fiche du parc.",
        false
      );
    }

    await Promise.allSettled([
      promesseBandeau,
      promesseFooter
    ]);
  }

  function lireParcDepuisUrl() {
    const parametres = new URLSearchParams(window.location.search);

    return {
      idparc: nettoyerTexte(parametres.get("idparc")),
      nom: nettoyerTexte(
        parametres.get("nom") ||
        parametres.get("nomparc")
      ),
      dptmt: nettoyerDepartement(
        parametres.get("dptmt") ||
        parametres.get("departement")
      ),
      prez: nettoyerTexte(
        parametres.get("prez") ||
        parametres.get("presentation") ||
        parametres.get("description")
      ),
      latparc: nettoyerTexte(
        parametres.get("latparc") ||
        parametres.get("latitude")
      ),
      lngparc: nettoyerTexte(
        parametres.get("lngparc") ||
        parametres.get("longitude")
      ),
      contact: nettoyerTexte(
        parametres.get("contact") ||
        parametres.get("contactparc")
      ),
      emailparc: nettoyerTexte(
        parametres.get("emailparc") ||
        parametres.get("email")
      ),
      telparc: nettoyerTexte(
        parametres.get("telparc") ||
        parametres.get("telephone") ||
        parametres.get("tel")
      )
    };
  }

  async function afficherFicheParc(parc) {
    const slot = document.getElementById("lcdp-fiche-parc-slot");

    if (!slot) {
      throw new Error("Slot fiche parc introuvable.");
    }

    slot.innerHTML = "";

    const fragment = await chargerFragment(
      "/OBJET/BOX/04-box-fiche-parc.html"
    );

    const fiche = fragment.querySelector(
      "[data-lcdp-box-fiche-parc]"
    );

    if (!fiche) {
      throw new Error("Structure de la fiche parc incomplète.");
    }

    fiche.classList.add("lcdp-box-fiche-parc--page");
    fiche.removeAttribute("role");
    fiche.removeAttribute("aria-modal");

    const boutonFermer = fiche.querySelector(
      "[data-lcdp-fiche-parc-close]"
    );

    if (boutonFermer) {
      boutonFermer.remove();
    }

    slot.appendChild(fiche);

    const nom = parc.nom || "Parc";
    const titre = fiche.querySelector(
      "[data-lcdp-fiche-parc-title]"
    );
    const actionsSlot = fiche.querySelector(
      "[data-lcdp-fiche-parc-actions]"
    );
    const presentationElement = fiche.querySelector(
      "[data-lcdp-fiche-parc-presentation]"
    );
    const galerieSlot = fiche.querySelector(
      "[data-lcdp-fiche-parc-galerie-slot]"
    );
    const carteSlot = fiche.querySelector(
      "[data-lcdp-fiche-parc-map-slot]"
    );
    const contactElement = fiche.querySelector(
      "[data-lcdp-fiche-parc-contact]"
    );
    const accesElement = fiche.querySelector(
      "[data-lcdp-fiche-parc-acces]"
    );

    if (titre) {
      titre.textContent = "Parc de " + nom;
    }

    document.title =
      "Parc de " + nom + " - La Clé du Parc";

    if (actionsSlot) {
      actionsSlot.innerHTML = "";
      actionsSlot.appendChild(
        creerActionsFicheParc(parc)
      );
    }

    await remplacerSectionParBoxText(
      presentationElement?.closest(
        ".lcdp-box-fiche-parc__section"
      ),
      "Présentation",
      parc.prez || "Présentation non renseignée."
    );

    await ajouterGalerieParc(galerieSlot, parc);
    await ajouterCarteParc(carteSlot, parc);

    await remplacerSectionParBoxText(
      contactElement?.closest(
        ".lcdp-box-fiche-parc__section"
      ),
      "Contact",
      construireTexteContactParc(parc)
    );

    await remplacerSectionParBoxText(
      accesElement?.closest(
        ".lcdp-box-fiche-parc__section"
      ),
      "Accès",
      "L’accès est communiqué dans votre carte de réservation associée à ce parc."
    );

    appliquerRoutesSite(slot);
  }

  async function remplacerSectionParBoxText(
    section,
    titre,
    contenu
  ) {
    if (!section) {
      throw new Error(
        "Section " + titre + " introuvable."
      );
    }

    section.innerHTML = "";

    const titreSection = document.createElement("h3");
    titreSection.textContent = titre;
    section.appendChild(titreSection);

    const fragment = await chargerFragment(
      "/OBJET/BOX/01-box-text.html"
    );

    const box = fragment.querySelector(
      "[data-lcdp-boxtext]"
    );
    const titreObjet = fragment.querySelector(
      "[data-lcdp-boxtext-title]"
    );
    const contenuObjet = fragment.querySelector(
      "[data-lcdp-boxtext-content]"
    );

    if (!box || !titreObjet || !contenuObjet) {
      throw new Error(
        "Structure de la Box Text incomplète."
      );
    }

    titreObjet.textContent = titre;
    box.classList.add(
      "lcdp-box-fiche-parc__box-text"
    );

    remplirParagraphes(contenuObjet, contenu);
    section.appendChild(fragment);
  }

  function remplirParagraphes(conteneur, texte) {
    conteneur.innerHTML = "";

    const lignes = String(texte || "")
      .split("\n")
      .map(nettoyerTexte)
      .filter(Boolean);

    if (!lignes.length) {
      lignes.push("Non renseigné.");
    }

    lignes.forEach((ligne) => {
      const paragraphe = document.createElement("p");
      paragraphe.textContent = ligne;
      conteneur.appendChild(paragraphe);
    });
  }

  async function ajouterGalerieParc(slot, parc) {
    if (!slot) {
      throw new Error(
        "Slot galerie fiche parc introuvable."
      );
    }

    if (
      typeof window.LCDP_ajouterGalerie !==
      "function"
    ) {
      throw new Error(
        "Objet galerie V3 introuvable."
      );
    }

    const nom = parc.nom || "Parc";
    const cartes = [];

    for (let index = 1; index <= 6; index += 1) {
      const numero = String(index).padStart(2, "0");

      cartes.push({
        titre: "",
        imageSrc: construireCheminImageParc(
          parc,
          numero + ".webp"
        ),
        imageAlt:
          "Photo " +
          numero +
          " du parc de " +
          nom,
        imageLegende: "",
        texte: ""
      });
    }

    await window.LCDP_ajouterGalerie(
      slot,
      {
        titre: "",
        ariaLabel: "Galerie photo du parc",
        cartes
      }
    );
  }

  async function ajouterCarteParc(slot, parc) {
    if (!slot) {
      throw new Error(
        "Slot carte fiche parc introuvable."
      );
    }

    slot.innerHTML = "";

    const fragment = await chargerFragment(
      "/OBJET/BOX/04-box-card-map-parc.html"
    );

    const carte = fragment.querySelector(
      "[data-lcdp-box-card-map-parc]"
    );
    const coordonnees = fragment.querySelector(
      "[data-lcdp-card-map-parc-coords]"
    );

    if (!carte || !coordonnees) {
      throw new Error(
        "Structure de la Box Card Map Parc incomplète."
      );
    }

    coordonnees.textContent =
      parc.latparc && parc.lngparc
        ? parc.latparc + ", " + parc.lngparc
        : "Coordonnées GPS non renseignées";

    slot.appendChild(fragment);
  }

  function creerActionsFicheParc(parc) {
    const actions = document.createElement("div");
    actions.className =
      "lcdp-box-fiche-parc__actions-list";

    const boutonReserver =
      document.createElement("button");

    boutonReserver.type = "button";
    boutonReserver.className =
      "lcdp-button " +
      "lcdp-box-calendrier-mois__action-reserver " +
      "lcdp-box-fiche-parc__action-reserver";
    boutonReserver.textContent = "RÉSERVER";

    boutonReserver.addEventListener("click", () => {
      ouvrirReservationMembre(parc);
    });

    const boutonPlanning =
      document.createElement("button");

    boutonPlanning.type = "button";
    boutonPlanning.className =
      "lcdp-button lcdp-button-primary " +
      "lcdp-box-fiche-parc__action-planning";
    boutonPlanning.textContent = "Planning parc";

    boutonPlanning.addEventListener("click", () => {
      ouvrirPlanningPublic(parc);
    });

    const actionPartager =
      creerActionPartagerFicheParc();

    actionPartager.addEventListener(
      "click",
      () => {
        partagerFicheParc(parc).catch(
          console.error
        );
      }
    );

    actions.appendChild(boutonReserver);
    actions.appendChild(boutonPlanning);
    actions.appendChild(actionPartager);

    return actions;
  }

  function creerActionPartagerFicheParc() {
    const action = document.createElement("span");
    action.className =
      "lcdp-box-fiche-parc__partage";
    action.setAttribute("role", "button");
    action.setAttribute("tabindex", "0");
    action.setAttribute(
      "aria-label",
      "Partager la page"
    );

    const bouton = document.createElement("span");
    bouton.className =
      "lcdp-box-fiche-parc__partage-icone";
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
    icone.setAttribute(
      "stroke",
      "currentColor"
    );
    icone.setAttribute("stroke-width", "2");
    icone.setAttribute(
      "stroke-linecap",
      "round"
    );
    icone.setAttribute(
      "stroke-linejoin",
      "round"
    );

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
      "M22 2 15 22 11 13 2 9 22 2Z"
    );

    icone.appendChild(trace);
    icone.appendChild(trace2);
    bouton.appendChild(icone);

    const libelle = document.createElement("span");
    libelle.className =
      "lcdp-box-fiche-parc__partage-libelle";
    libelle.textContent = "Partager la page";

    action.appendChild(bouton);
    action.appendChild(libelle);

    action.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          action.click();
        }
      }
    );

    return action;
  }

  function ouvrirReservationMembre(parc) {
    const url = construireUrlAvecParc(
      construireUrlMembre(
        "/ESPACE-MEMBRE/reserver-membre.html"
      ),
      parc,
      {
        source: "fiche-parc"
      }
    );

    window.location.href = url;
  }

  function ouvrirPlanningPublic(parc) {
    const url = construireUrlAvecParc(
      construireUrlSite(
        "/ESPACE-PUBLIC/planning-parc.html"
      ),
      parc,
      {
        source: "fiche-parc"
      }
    );

    window.location.href = url;
  }

  async function partagerFicheParc(parc) {
    const nom = parc.nom || "ce parc";
    const donneesPartage = {
      title:
        "Parc de " +
        nom +
        " - La Clé du Parc",
      text:
        "Découvrez le parc de " +
        nom +
        " sur La Clé du Parc.",
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(donneesPartage);
      return;
    }

    const sujet = encodeURIComponent(
      donneesPartage.title
    );
    const corps = encodeURIComponent(
      donneesPartage.text +
      "\n\n" +
      donneesPartage.url
    );

    window.location.href =
      "mailto:?subject=" +
      sujet +
      "&body=" +
      corps;
  }

  function construireUrlAvecParc(
    urlSource,
    parc,
    parametresComplementaires = {}
  ) {
    const url = new URL(
      urlSource,
      window.location.href
    );

    if (parc.idparc) {
      url.searchParams.set(
        "idparc",
        parc.idparc
      );
    }

    if (parc.nom) {
      url.searchParams.set("nom", parc.nom);
    }

    if (parc.dptmt) {
      url.searchParams.set(
        "dptmt",
        parc.dptmt
      );
    }

    Object.entries(
      parametresComplementaires
    ).forEach(([cle, valeur]) => {
      if (valeur !== undefined && valeur !== null) {
        url.searchParams.set(
          cle,
          String(valeur)
        );
      }
    });

    return url.toString();
  }

  function construireCheminImageParc(
    parc,
    fichier
  ) {
    const departement = nettoyerDepartement(
      parc.dptmt
    );
    const dossierParc =
      normaliserNomParcPourChemin(parc.nom);
    const nomFichier = String(fichier || "")
      .replace(/^\/+/, "");

    if (
      !departement ||
      !dossierParc ||
      !nomFichier
    ) {
      return (
        dossierImagesParc +
        "/parc-defaut.webp"
      );
    }

    return (
      dossierImagesParc +
      "/" +
      encodeURIComponent(departement) +
      "/" +
      encodeURIComponent(dossierParc) +
      "/" +
      encodeURIComponent(nomFichier)
    );
  }

  function construireTexteContactParc(parc) {
    const lignes = [
      parc.contact,
      parc.emailparc,
      parc.telparc
    ]
      .map(nettoyerTexte)
      .filter(Boolean)
      .filter((valeur, index, liste) => {
        return liste.indexOf(valeur) === index;
      });

    return lignes.length
      ? lignes.join("\n")
      : "Contact non renseigné.";
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

  function nettoyerTexte(valeur) {
    return String(valeur || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function afficherStatut(message, termine) {
    const statut = document.getElementById(
      "lcdp-fiche-parc-status"
    );

    if (!statut) {
      return;
    }

    if (termine) {
      statut.hidden = true;
      statut.textContent = "";
      return;
    }

    statut.hidden = false;
    statut.textContent =
      message || "[Chargement de la fiche parc]";
  }

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
        : siteBase +
            "/" +
            chemin.replace(/^\.\//, "");
    }

    return chemin.startsWith("/")
      ? ".." + chemin
      : chemin;
  }

  function construireUrlMembre(chemin) {
    const valeur = String(chemin || "");

    if (
      valeur.startsWith("http://") ||
      valeur.startsWith("https://")
    ) {
      return valeur;
    }

    if (
      typeof config.membreUrl === "function"
    ) {
      return config.membreUrl(valeur);
    }

    const membreBase = String(
      config.membreBaseUrl ||
      config.MEMBRE_BASE ||
      config.siteBase ||
      siteBase ||
      ""
    ).replace(/\/$/, "");

    if (membreBase) {
      return valeur.startsWith("/")
        ? membreBase + valeur
        : membreBase +
            "/" +
            valeur.replace(/^\.\//, "");
    }

    return valeur.startsWith("/")
      ? ".." + valeur
      : valeur;
  }

  function appliquerRoutesSite(
    racine = document
  ) {
    racine
      .querySelectorAll("[data-site-href]")
      .forEach((element) => {
        element.setAttribute(
          "href",
          construireUrlSite(
            element.dataset.siteHref
          )
        );
      });

    racine
      .querySelectorAll("[data-site-src]")
      .forEach((element) => {
        element.setAttribute(
          "src",
          construireUrlSite(
            element.dataset.siteSrc
          )
        );
      });

    racine
      .querySelectorAll("a[href^='/']")
      .forEach((element) => {
        element.setAttribute(
          "href",
          construireUrlSite(
            element.getAttribute("href")
          )
        );
      });

    racine
      .querySelectorAll("img[src^='/']")
      .forEach((element) => {
        element.setAttribute(
          "src",
          construireUrlSite(
            element.getAttribute("src")
          )
        );
      });
  }

  async function chargerFragment(chemin) {
    const reponse = await fetch(
      construireUrlSite(chemin),
      {
        method: "GET",
        credentials: "same-origin",
        cache: "no-cache"
      }
    );

    if (!reponse.ok) {
      throw new Error(
        "Fragment introuvable : " + chemin
      );
    }

    const html = await reponse.text();
    const template =
      document.createElement("template");

    template.innerHTML = html.trim();

    return template.content.cloneNode(true);
  }

  function chargerScriptUneFois(chemin) {
    const src = construireUrlSite(chemin);

    if (
      document.querySelector(
        `script[data-lcdp-script="${chemin}"]`
      )
    ) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script =
        document.createElement("script");

      script.src = src;
      script.defer = true;
      script.dataset.lcdpScript = chemin;
      script.onload = resolve;
      script.onerror = () => {
        reject(
          new Error(
            "Script introuvable : " + chemin
          )
        );
      };

      document.body.appendChild(script);
    });
  }

  async function initialiserBandeau() {
    const slot = document.getElementById(
      "lcdp-bandeau-slot"
    );

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const bandeau = await chargerFragment(
      "/ESPACE-PUBLIC/box-bandeau-nav-public.html"
    );

    slot.appendChild(bandeau);
    appliquerRoutesSite(slot);

    await chargerScriptUneFois(
      "/ESPACE-PUBLIC/box-menu-burger-public.js"
    );

    if (
      typeof window
        .LCDP_initialiserMenuBurgerPublic ===
      "function"
    ) {
      await window
        .LCDP_initialiserMenuBurgerPublic();
    }
  }

  async function initialiserFooter() {
    const slot = document.getElementById(
      "lcdp-footer-slot"
    );

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const footer = await chargerFragment(
      "/OBJET/BOX/02-box-footer.html"
    );

    slot.appendChild(footer);
    appliquerRoutesSite(slot);
  }
})();
