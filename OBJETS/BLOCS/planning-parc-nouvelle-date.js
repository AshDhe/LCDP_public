const CONFIG_PLANNING_PARC_NOUVELLE_DATE = window.SITE_CONFIG || {};

const DOSSIER_BLOCS_NOUVELLE_DATE =
  "/OBJETS/BLOCS";

const ENDPOINT_NOUVELLE_DATE_MEMBRE = construireEndpointApiPlanningParc(
  "workerNouvelleDateMembreUrl",
  "WORKER_NOUVELLE_DATE_MEMBRE_URL",
  "nouvelle-date-membre-api"
);

const PAGE_CONNEXION_MEMBRE = construireUrlPublicPlanningParc(
  "/PAGES/PUBLIQUES/CONNEXION-MEMBRE/connexion-membre.html"
);

const paramsPlanningParc = new URLSearchParams(window.location.search);

const nomParcPlanning = paramsPlanningParc.get("nom") || "";
const departementPlanning = paramsPlanningParc.get("dptmt") || "";
const idParcPlanning = paramsPlanningParc.get("idparc") || "";
const parentOriginPlanning = normaliserParentOriginPlanningParc(
  paramsPlanningParc.get("parentOrigin")
);

const titrePlanning = document.getElementById("titre-planning-parc");
const infosPlanning = document.getElementById("infos-planning-parc");
const titreMois = document.getElementById("titre-mois-planning");
const grillePlanning = document.getElementById("grille-planning-parc");
const boutonMoisPrecedent = document.getElementById("bouton-mois-precedent");
const boutonMoisSuivant = document.getElementById("bouton-mois-suivant");

const aujourdHuiPlanning = new Date();
aujourdHuiPlanning.setHours(0, 0, 0, 0);

let moisAffichePlanning = aujourdHuiPlanning.getMonth();
let anneeAfficheePlanning = aujourdHuiPlanning.getFullYear();

if (titrePlanning) {
  titrePlanning.textContent = nomParcPlanning
    ? "Planning du parc de " + nomParcPlanning
    : "Planning du parc";
}

if (infosPlanning) {
  infosPlanning.textContent = departementPlanning
    ? "Département " + departementPlanning
    : "";
}

if (boutonMoisPrecedent) {
  boutonMoisPrecedent.addEventListener("click", () => {
    moisAffichePlanning -= 1;

    if (moisAffichePlanning < 0) {
      moisAffichePlanning = 11;
      anneeAfficheePlanning -= 1;
    }

    afficherMoisPlanningParc();
  });
}

if (boutonMoisSuivant) {
  boutonMoisSuivant.addEventListener("click", () => {
    moisAffichePlanning += 1;

    if (moisAffichePlanning > 11) {
      moisAffichePlanning = 0;
      anneeAfficheePlanning += 1;
    }

    afficherMoisPlanningParc();
  });
}

document.addEventListener("click", async (event) => {
  const boutonJour = event.target.closest(".jour-planning[data-date]");

  if (boutonJour && !boutonJour.disabled) {
    event.preventDefault();
    await traiterChoixDatePlanningParc(boutonJour.dataset.date);
  }
});

afficherMoisPlanningParc();

function envoyerMessageParentPlanningParc(action) {
  if (!window.parent || window.parent === window) return;

  window.parent.postMessage(
    {
      source: "lcdp-planning-parc-nouvelle-date",
      action: action
    },
    parentOriginPlanning
  );
}

function masquerBoutonFermerParentPlanningParc() {
  envoyerMessageParentPlanningParc("masquer-fermer-planning");
}

function afficherBoutonFermerParentPlanningParc() {
  envoyerMessageParentPlanningParc("afficher-fermer-planning");
}

function formaterDateIsoLocalePlanningParc(date) {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return annee + "-" + mois + "-" + jour;
}

async function afficherMoisPlanningParc() {
  if (!titreMois || !grillePlanning) return;

  const dateMois = new Date(anneeAfficheePlanning, moisAffichePlanning, 1);

  titreMois.textContent = dateMois.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric"
  });

  grillePlanning.innerHTML = `
    <div class="jour-planning-message">
      Chargement du planning...
    </div>
  `;

  let planning = [];

  try {
    planning = await chargerPlanningParcMois({
      idparc: idParcPlanning,
      annee: anneeAfficheePlanning,
      mois: moisAffichePlanning + 1
    });
  } catch (erreur) {
    grillePlanning.innerHTML = `
      <div class="jour-planning-message">
        ${echapperHtmlPlanningParc(erreur.message)}
      </div>
    `;
    return;
  }

  const planningParDate = new Map();

  planning.forEach((jour) => {
    planningParDate.set(jour.date, jour);
  });

  const premierJourMois = new Date(anneeAfficheePlanning, moisAffichePlanning, 1);
  const dernierJourMois = new Date(anneeAfficheePlanning, moisAffichePlanning + 1, 0);

  const nombreJours = dernierJourMois.getDate();
  const decalageDebut = (premierJourMois.getDay() + 6) % 7;

  let html = "";

  for (let index = 0; index < decalageDebut; index += 1) {
    html += '<div class="jour-planning jour-planning-vide"></div>';
  }

  for (let jour = 1; jour <= nombreJours; jour += 1) {
    const dateJour = new Date(anneeAfficheePlanning, moisAffichePlanning, jour);
    dateJour.setHours(0, 0, 0, 0);

    const dateIso = formaterDateIsoLocalePlanningParc(dateJour);
    const donneesJour = planningParDate.get(dateIso) || creerJourFermePlanningParc(dateIso, jour);

    const estPasse = dateJour < aujourdHuiPlanning;
    const estAujourdhui = dateJour.getTime() === aujourdHuiPlanning.getTime();
    const estOuvert = donneesJour.ouvert === true;
    const estCliquable = !estPasse && estOuvert;

    let classes = "jour-planning";

    if (estPasse) {
      classes += " jour-planning-passe";
    } else if (!estOuvert) {
      classes += " jour-planning-ferme";
    } else {
      classes += " jour-planning-actif";
    }

    if (estAujourdhui) {
      classes += " jour-planning-aujourdhui";
    }

    html += `
      <button
        class="${classes}"
        type="button"
        data-idparc="${echapperHtmlPlanningParc(idParcPlanning)}"
        data-date="${dateIso}"
        ${estCliquable ? "" : "disabled"}
      >
        <span class="jour-planning-numero">
          ${jour}
        </span>

        <span class="jour-planning-plages">
          <span class="jour-planning-plage ${classeCouleurPlagePlanningParc(donneesJour.plages.plage1, estPasse)}"></span>
          <span class="jour-planning-plage ${classeCouleurPlagePlanningParc(donneesJour.plages.plage2, estPasse)}"></span>
          <span class="jour-planning-plage ${classeCouleurPlagePlanningParc(donneesJour.plages.plage3, estPasse)}"></span>
        </span>
      </button>
    `;
  }

  grillePlanning.innerHTML = html;
}

async function chargerPlanningParcMois(params) {
  if (!ENDPOINT_NOUVELLE_DATE_MEMBRE) {
    throw new Error("Le service de nouvelle date membre n’est pas configuré.");
  }

  const url =
    ENDPOINT_NOUVELLE_DATE_MEMBRE +
    "/planning-parc-mois?idparc=" + encodeURIComponent(params.idparc) +
    "&annee=" + encodeURIComponent(params.annee) +
    "&mois=" + encodeURIComponent(params.mois);

  const reponse = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Accept": "application/json"
    }
  });

  const data = await reponse.json().catch(() => null);

  if (reponse.status === 401) {
    redirigerConnexionMembrePlanningParc("inactive");
    return [];
  }

  if (!reponse.ok || !data || !reponseApiOkPlanningParc(data)) {
    throw new Error(
      messageErreurApiPlanningParc(
        data,
        "Impossible de charger le planning du parc."
      )
    );
  }

  return Array.isArray(data.planning) ? data.planning : [];
}

function creerJourFermePlanningParc(dateIso, jour) {
  return {
    date: dateIso,
    jour: jour,
    ouvert: false,
    plages: {
      plage1: { ouverte: false, couleur: "gris_clair" },
      plage2: { ouverte: false, couleur: "gris_clair" },
      plage3: { ouverte: false, couleur: "gris_clair" }
    }
  };
}

function classeCouleurPlagePlanningParc(plage, estPasse) {
  if (estPasse) {
    return "plage-couleur-gris-clair";
  }

  if (!plage || plage.ouverte !== true) {
    return "plage-couleur-gris-clair";
  }

  if (plage.couleur === "vert") {
    return "plage-couleur-vert";
  }

  if (plage.couleur === "orange") {
    return "plage-couleur-orange";
  }

  if (plage.couleur === "gris_fonce") {
    return "plage-couleur-gris-fonce";
  }

  return "plage-couleur-gris-clair";
}

async function traiterChoixDatePlanningParc(dateIso) {
  const confirmation = await ouvrirConfirmationDatePlanningParc(dateIso);

  if (confirmation !== true) {
    return;
  }

  ouvrirPageHorairePlanningParc(dateIso);
}

async function ouvrirConfirmationDatePlanningParc(dateIso) {
  masquerBoutonFermerParentPlanningParc();

  const elements = await obtenirElementsBoiteDialoguePlanningParc();

  if (!elements) {
    const confirmationFallback = window.confirm(
      "Confirmer la date\n\nVous avez choisi le " +
      formaterDateFrPlanningParc(dateIso) +
      "."
    );

    if (!confirmationFallback) {
      afficherBoutonFermerParentPlanningParc();
    }

    return confirmationFallback;
  }

  const {
    boite,
    titre,
    form,
    contenu,
    erreur,
    boutonAnnuler,
    boutonValider
  } = elements;

  titre.textContent = "Confirmer la date";

  contenu.innerHTML = `
    <p style="margin: 0; text-align: center; color: var(--color-text-muted);">
      Vous avez choisi le ${echapperHtmlPlanningParc(formaterDateFrPlanningParc(dateIso))}.
    </p>
  `;

  erreur.textContent = "";
  erreur.hidden = true;

  boutonAnnuler.textContent = "Annuler";
  boutonValider.textContent = "Continuer";
  boutonValider.disabled = false;

  boite.hidden = false;
  boutonAnnuler.focus();

  return new Promise((resolve) => {
    function fermer(resultat) {
      boite.hidden = true;
      form.reset();
      contenu.innerHTML = "";
      erreur.textContent = "";
      erreur.hidden = true;

      boutonAnnuler.onclick = null;
      form.onsubmit = null;
      boite.onclick = null;

      resolve(resultat);
    }

    boutonAnnuler.onclick = () => {
      afficherBoutonFermerParentPlanningParc();
      fermer(false);
    };

    boite.onclick = (event) => {
      if (event.target === boite) {
        afficherBoutonFermerParentPlanningParc();
        fermer(false);
      }
    };

    form.onsubmit = (event) => {
      event.preventDefault();
      fermer(true);
    };
  });
}

async function obtenirElementsBoiteDialoguePlanningParc() {
  const boite = await attendreElementPlanningParc("boite-dialogue", 2500);

  if (!boite) {
    return null;
  }

  const box = boite.querySelector(".dialog-box");
  const titre = document.getElementById("boite-dialogue-titre");
  const form = document.getElementById("boite-dialogue-form");
  const contenu = document.getElementById("boite-dialogue-contenu");
  const erreur = document.getElementById("boite-dialogue-erreur");
  const boutonAnnuler = document.getElementById("boite-dialogue-annuler");
  const boutonValider = document.getElementById("boite-dialogue-valider");

  if (!box || !titre || !form || !contenu || !erreur || !boutonAnnuler || !boutonValider) {
    return null;
  }

  return {
    boite,
    box,
    titre,
    form,
    contenu,
    erreur,
    boutonAnnuler,
    boutonValider
  };
}

function attendreElementPlanningParc(idElement, delaiMaximum) {
  const elementExistant = document.getElementById(idElement);

  if (elementExistant) {
    return Promise.resolve(elementExistant);
  }

  return new Promise((resolve) => {
    const debut = Date.now();

    const timer = window.setInterval(() => {
      const element = document.getElementById(idElement);

      if (element) {
        window.clearInterval(timer);
        resolve(element);
        return;
      }

      if (Date.now() - debut >= delaiMaximum) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 40);
  });
}

function ouvrirPageHorairePlanningParc(dateIso) {
  window.location.href =
    construireUrlAssetPlanningParc(
      DOSSIER_BLOCS_NOUVELLE_DATE +
      "/horaire-parc-nouvelle-date.html" +
      construireParametresHorairePlanningParc(dateIso)
    );
}

function construireParametresHorairePlanningParc(dateIso) {
  const params = new URLSearchParams();

  params.set("idparc", idParcPlanning);
  params.set("nom", nomParcPlanning);
  params.set("dptmt", departementPlanning);
  params.set("date", dateIso);
  params.set("parentOrigin", parentOriginPlanning);

  return "?" + params.toString();
}

function formaterDateFrPlanningParc(dateIso) {
  const date = new Date(dateIso + "T12:00:00");

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function construireEndpointApiPlanningParc(cleModerne, cleLegacy, sousDomaineWorker) {
  const depuisConfig =
    CONFIG_PLANNING_PARC_NOUVELLE_DATE?.[cleModerne] ||
    CONFIG_PLANNING_PARC_NOUVELLE_DATE?.[cleLegacy] ||
    "";

  if (depuisConfig) {
    return String(depuisConfig).replace(/\/$/, "");
  }

  if (typeof CONFIG_PLANNING_PARC_NOUVELLE_DATE.apiUrl === "function") {
    return CONFIG_PLANNING_PARC_NOUVELLE_DATE.apiUrl(sousDomaineWorker).replace(/\/$/, "");
  }

  return "";
}

function construireUrlMembrePlanningParc(chemin) {
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

  if (typeof CONFIG_PLANNING_PARC_NOUVELLE_DATE.membreUrl === "function") {
    return CONFIG_PLANNING_PARC_NOUVELLE_DATE.membreUrl(valeur);
  }

  if (typeof window.construireUrlMembre === "function") {
    return window.construireUrlMembre(valeur);
  }

  const base = (
    window.SITE_BASE ||
    CONFIG_PLANNING_PARC_NOUVELLE_DATE.membreBaseUrl ||
    CONFIG_PLANNING_PARC_NOUVELLE_DATE.MEMBRE_BASE ||
    ""
  ).replace(/\/$/, "");

  if (base) {
    return valeur.startsWith("/")
      ? base + valeur
      : base + "/" + valeur.replace(/^\.\//, "");
  }

  return valeur.startsWith("/") ? valeur : "/" + valeur;
}

function construireUrlPublicPlanningParc(chemin) {
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

  if (typeof CONFIG_PLANNING_PARC_NOUVELLE_DATE.publicUrl === "function") {
    return CONFIG_PLANNING_PARC_NOUVELLE_DATE.publicUrl(valeur);
  }

  const base = (
    window.ASSETS_BASE ||
    CONFIG_PLANNING_PARC_NOUVELLE_DATE.publicBaseUrl ||
    CONFIG_PLANNING_PARC_NOUVELLE_DATE.PUBLIC_BASE ||
    ""
  ).replace(/\/$/, "");

  if (base) {
    return valeur.startsWith("/")
      ? base + valeur
      : base + "/" + valeur.replace(/^\.\//, "");
  }

  return valeur.startsWith("/") ? valeur : "/" + valeur;
}

function construireUrlAssetPlanningParc(chemin) {
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

  if (typeof window.construireUrlAsset === "function") {
    return window.construireUrlAsset(valeur);
  }

  const base = (
    window.ASSETS_BASE ||
    CONFIG_PLANNING_PARC_NOUVELLE_DATE.publicBaseUrl ||
    CONFIG_PLANNING_PARC_NOUVELLE_DATE.PUBLIC_BASE ||
    window.SITE_BASE ||
    ""
  ).replace(/\/$/, "");

  if (base) {
    return valeur.startsWith("/")
      ? base + valeur
      : base + "/" + valeur.replace(/^\.\//, "");
  }

  return valeur.startsWith("/") ? valeur : "/" + valeur;
}

function redirigerConnexionMembrePlanningParc(motif) {
  const separateur = PAGE_CONNEXION_MEMBRE.includes("?") ? "&" : "?";

  window.top.location.href =
    PAGE_CONNEXION_MEMBRE +
    separateur +
    "source=planning-parc-nouvelle-date&session=" +
    encodeURIComponent(motif || "inactive");
}

function normaliserParentOriginPlanningParc(valeur) {
  const origin = String(valeur || "").trim();

  if (!origin) {
    return window.location.origin;
  }

  try {
    const url = new URL(origin);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return window.location.origin;
    }

    return url.origin;
  } catch (erreur) {
    return window.location.origin;
  }
}

function reponseApiOkPlanningParc(data) {
  return data && (data.ok === true || data.success === true);
}

function messageErreurApiPlanningParc(resultat, messageDefaut) {
  return resultat && (resultat.message || resultat.error)
    ? String(resultat.message || resultat.error)
    : messageDefaut;
}

function echapperHtmlPlanningParc(valeur) {
  return String(valeur ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}