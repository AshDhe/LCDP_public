const CONFIG_HORAIRE_PARC_NOUVELLE_DATE = window.SITE_CONFIG || {};

const ENDPOINT_FLUXM = construireEndpointApiHoraireParc(
  "workerFluxmUrl",
  "WORKER_FLUXM_URL",
  "fluxm-api"
);

const ENDPOINT_NOUVELLE_DATE_MEMBRE = construireEndpointApiHoraireParc(
  "workerNouvelleDateMembreUrl",
  "WORKER_NOUVELLE_DATE_MEMBRE_URL",
  "nouvelle-date-membre-api"
);

const PAGE_CONNEXION_MEMBRE = construireUrlPublicHoraireParc(
  "/PAGES/PUBLIQUES/CONNEXION-MEMBRE/connexion-membre.html"
);

const PAGE_MON_PLANNING_MEMBRE = construireUrlMembreHoraireParc(
  "/PAGES/PRIVEES/ESPACE-MEMBRE/MON-PLANNING-MEMBRE/mon-planning-membre.html"
);

const paramsHoraireParc = new URLSearchParams(window.location.search);

const idParcHoraire = paramsHoraireParc.get("idparc") || "";
const nomParcHoraire = paramsHoraireParc.get("nom") || "";
const departementHoraire = paramsHoraireParc.get("dptmt") || "";
const dateChoisieHoraire = paramsHoraireParc.get("date") || "";
const parentOriginHoraire = normaliserParentOriginHoraireParc(
  paramsHoraireParc.get("parentOrigin")
);

const titreHoraire = document.getElementById("titre-horaire-parc");
const infosHoraire = document.getElementById("infos-horaire-parc");
const grilleHoraires = document.getElementById("grille-horaires-parc");

let plagesJourHoraire = [];

if (titreHoraire) {
  titreHoraire.textContent = dateChoisieHoraire
    ? "Votre heure d'arrivée le " + formaterDateFrHoraireParc(dateChoisieHoraire)
    : "Votre heure d'arrivée";
}

if (infosHoraire) {
  const details = [];

  if (nomParcHoraire) {
    details.push("Parc de " + nomParcHoraire);
  }

  if (departementHoraire) {
    details.push("Département " + departementHoraire);
  }

  infosHoraire.textContent = details.join(" · ");
}

document.addEventListener("click", async (event) => {
  const boutonHeure = event.target.closest("[data-action='choisir-heure-arrivee']");
  const boutonAnnuler = event.target.closest("[data-action='annuler-confirmation-heure']");
  const boutonValider = event.target.closest("[data-action='valider-confirmation-heure']");
  const boutonRetourPlanning = event.target.closest("[data-action='retour-mon-planning']");

  if (boutonHeure) {
    ouvrirConfirmationHeureHoraireParc(
      boutonHeure.dataset.heure,
      boutonHeure.dataset.plagebookd
    );
    return;
  }

  if (boutonAnnuler) {
    fermerConfirmationHeureHoraireParc();
    return;
  }

  if (boutonRetourPlanning) {
    allerMonPlanningHoraireParc();
    return;
  }

  if (boutonValider) {
    const heure = boutonValider.dataset.heure;
    const plagebookd = boutonValider.dataset.plagebookd;

    boutonValider.disabled = true;
    boutonValider.textContent = "Enregistrement...";

    try {
      await enregistrerReservationHoraireParc(heure, plagebookd);
      ouvrirConfirmationEnregistrementHoraireParc();
    } catch (erreur) {
      boutonValider.disabled = false;
      boutonValider.textContent = "Confirmer";
      alert(erreur.message);
    }
  }
});

initialiserHorairesParc();

async function initialiserHorairesParc() {
  if (!grilleHoraires) return;

  grilleHoraires.innerHTML = `
    <p class="horaire-parc-message">
      Chargement des horaires disponibles...
    </p>
  `;

  try {
    const jourPlanning = await chargerPlanningJourHoraireParc();
    plagesJourHoraire = construirePlagesJourHoraireParc(jourPlanning);
    afficherHorairesParc();
  } catch (erreur) {
    grilleHoraires.innerHTML = `
      <p class="horaire-parc-message">
        ${echapperHtmlHoraireParc(erreur.message)}
      </p>
    `;
  }
}

async function chargerPlanningJourHoraireParc() {
  if (!ENDPOINT_NOUVELLE_DATE_MEMBRE) {
    throw new Error("Le service de nouvelle date membre n’est pas configuré.");
  }

  if (!idParcHoraire || !dateChoisieHoraire) {
    throw new Error("Parc ou date manquant.");
  }

  const [annee, mois] = dateChoisieHoraire.split("-").map(Number);

  const url =
    ENDPOINT_NOUVELLE_DATE_MEMBRE +
    "/planning-parc-mois?idparc=" + encodeURIComponent(idParcHoraire) +
    "&annee=" + encodeURIComponent(annee) +
    "&mois=" + encodeURIComponent(mois);

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
    redirigerConnexionMembreHoraireParc("inactive");
    return null;
  }

  if (!reponse.ok || !data || !reponseApiOkHoraireParc(data)) {
    throw new Error(
      messageErreurApiHoraireParc(
        data,
        "Impossible de charger les horaires du parc."
      )
    );
  }

  const planning = Array.isArray(data.planning) ? data.planning : [];
  const jour = planning.find((item) => item.date === dateChoisieHoraire);

  if (!jour) {
    throw new Error("Aucun horaire disponible pour cette date.");
  }

  return jour;
}

function construirePlagesJourHoraireParc(jourPlanning) {
  if (!jourPlanning || !jourPlanning.plages) {
    return [];
  }

  const plages = [];

  ajouterPlageSiOuverteHoraireParc(plages, "plage1", jourPlanning.plages.plage1, {
    debut: "06:00",
    fin: "13:00"
  });

  ajouterPlageSiOuverteHoraireParc(plages, "plage2", jourPlanning.plages.plage2, {
    debut: "13:00",
    fin: "19:00"
  });

  ajouterPlageSiOuverteHoraireParc(plages, "plage3", jourPlanning.plages.plage3, {
    debut: "19:00",
    fin: "21:30"
  });

  return plages;
}

function ajouterPlageSiOuverteHoraireParc(plages, nomPlage, plage, defaut) {
  if (!plage || plage.ouverte !== true) {
    return;
  }

  plages.push({
    nom: nomPlage,
    debut: plage.debut || defaut.debut,
    fin: plage.fin || defaut.fin,
    couleur: normaliserCouleurHoraireParc(plage.couleur)
  });
}

function genererHeuresDisponiblesHoraireParc() {
  const heures = [];

  for (let totalMinutes = 6 * 60; totalMinutes <= 21 * 60; totalMinutes += 30) {
    const heure = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    heures.push(
      String(heure).padStart(2, "0") + ":" + String(minutes).padStart(2, "0")
    );
  }

  return heures;
}

function afficherHorairesParc() {
  if (!grilleHoraires) return;

  const heuresDisponibles = genererHeuresDisponiblesHoraireParc();

  const boutons = heuresDisponibles
    .map((heure) => {
      const plage = trouverPlagePourHeureHoraireParc(heure);

      if (!plage) {
        return "";
      }

      return `
        <button
          class="horaire-parc-bouton ${classeCouleurHoraireParc(plage.couleur)}"
          type="button"
          data-action="choisir-heure-arrivee"
          data-heure="${heure}"
          data-plagebookd="${plage.nom}"
        >
          ${formaterHeureAfficheeHoraireParc(heure)}
        </button>
      `;
    })
    .join("");

  if (!boutons.trim()) {
    grilleHoraires.innerHTML = `
      <p class="horaire-parc-message">
        Aucun horaire d'arrivée n'est disponible pour cette date.
      </p>
    `;
    return;
  }

  grilleHoraires.innerHTML = boutons;
}

function trouverPlagePourHeureHoraireParc(heure) {
  const totalMinutes = convertirHeureEnMinutesHoraireParc(heure);

  return plagesJourHoraire.find((plage) => {
    const debut = convertirHeureEnMinutesHoraireParc(plage.debut);
    const fin = convertirHeureEnMinutesHoraireParc(plage.fin);

    return totalMinutes >= debut && totalMinutes < fin;
  }) || null;
}

function convertirHeureEnMinutesHoraireParc(heure) {
  const [heures, minutes] = String(heure || "00:00").split(":").map(Number);

  if (!Number.isFinite(heures) || !Number.isFinite(minutes)) {
    return 0;
  }

  return heures * 60 + minutes;
}

function normaliserCouleurHoraireParc(couleur) {
  if (couleur === "vert") {
    return "vert";
  }

  if (couleur === "orange") {
    return "orange";
  }

  if (couleur === "gris_fonce") {
    return "gris_fonce";
  }

  if (couleur === "fonce") {
    return "gris_fonce";
  }

  return "gris_clair";
}

function classeCouleurHoraireParc(couleur) {
  if (couleur === "vert") {
    return "horaire-couleur-vert";
  }

  if (couleur === "orange") {
    return "horaire-couleur-orange";
  }

  if (couleur === "gris_fonce") {
    return "horaire-couleur-gris-fonce";
  }

  return "horaire-couleur-gris-clair";
}

function envoyerMessageParentHoraireParc(action) {
  if (!window.parent || window.parent === window) return;

  window.parent.postMessage(
    {
      source: "lcdp-planning-parc-nouvelle-date",
      action: action
    },
    parentOriginHoraire
  );
}

function masquerBoutonFermerParentHoraireParc() {
  envoyerMessageParentHoraireParc("masquer-fermer-planning");
}

function afficherBoutonFermerParentHoraireParc() {
  envoyerMessageParentHoraireParc("afficher-fermer-planning");
}

function supprimerConfirmationHeureHoraireParc() {
  const lightbox = document.getElementById("dialog-confirmation-heure");

  if (lightbox) {
    lightbox.remove();
  }
}

function ouvrirConfirmationHeureHoraireParc(heure, plagebookd) {
  masquerBoutonFermerParentHoraireParc();
  supprimerConfirmationHeureHoraireParc();

  const lightbox = document.createElement("div");
  lightbox.id = "dialog-confirmation-heure";
  lightbox.className = "dialog-overlay";

  lightbox.innerHTML = `
    <div class="dialog-box" role="dialog" aria-modal="true">

      <h2>
        Confirmer l'heure d'arrivée
      </h2>

      <p>
        Vous avez choisi le ${formaterDateFrHoraireParc(dateChoisieHoraire)} à ${formaterHeureAfficheeHoraireParc(heure)}.
      </p>

      <div class="dialog-actions">

        <button class="button button-secondary" type="button" data-action="annuler-confirmation-heure">
          Annuler
        </button>

        <button
          class="button"
          type="button"
          data-action="valider-confirmation-heure"
          data-heure="${heure}"
          data-plagebookd="${plagebookd}"
        >
          Confirmer
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(lightbox);
}

function fermerConfirmationHeureHoraireParc() {
  supprimerConfirmationHeureHoraireParc();
  afficherBoutonFermerParentHoraireParc();
}

function ouvrirConfirmationEnregistrementHoraireParc() {
  supprimerConfirmationHeureHoraireParc();
  masquerBoutonFermerParentHoraireParc();

  const lightbox = document.createElement("div");
  lightbox.id = "dialog-confirmation-enregistrement";
  lightbox.className = "dialog-overlay";

  lightbox.innerHTML = `
    <div class="dialog-box" role="dialog" aria-modal="true">

      <h2>
        Nouvelle date enregistrée
      </h2>

      <p>
        Votre nouvelle date a bien été enregistrée.
      </p>

      <div class="dialog-actions">

        <button class="button" type="button" data-action="retour-mon-planning">
          OK
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(lightbox);
}

function construireDateBookdHoraireParc(dateIso, heure) {
  const dateLocale = new Date(dateIso + "T" + heure + ":00");

  return dateLocale.toISOString();
}

async function enregistrerReservationHoraireParc(heure, plagebookd) {
  if (!ENDPOINT_FLUXM) {
    throw new Error("Le service du planning membre n’est pas configuré.");
  }

  const datebookd = construireDateBookdHoraireParc(dateChoisieHoraire, heure);

  const reponse = await fetch(ENDPOINT_FLUXM + "/creer-reservation", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      idparc: idParcHoraire,
      datebookd: datebookd,
      plagebookd: plagebookd
    })
  });

  const data = await reponse.json().catch(() => null);

  if (reponse.status === 401) {
    redirigerConnexionMembreHoraireParc("inactive");
    return null;
  }

  if (!reponse.ok || !data || !reponseApiOkHoraireParc(data)) {
    throw new Error(
      messageErreurApiHoraireParc(
        data,
        "Impossible d'enregistrer la réservation."
      )
    );
  }

  return data.reservation || null;
}

function formaterDateFrHoraireParc(dateIso) {
  if (!dateIso) return "";

  const date = new Date(dateIso + "T12:00:00");

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formaterHeureAfficheeHoraireParc(heure) {
  return String(heure || "").replace(":", "h");
}

function allerMonPlanningHoraireParc() {
  window.top.location.href = PAGE_MON_PLANNING_MEMBRE;
}

function construireEndpointApiHoraireParc(cleModerne, cleLegacy, sousDomaineWorker) {
  const depuisConfig =
    CONFIG_HORAIRE_PARC_NOUVELLE_DATE?.[cleModerne] ||
    CONFIG_HORAIRE_PARC_NOUVELLE_DATE?.[cleLegacy] ||
    "";

  if (depuisConfig) {
    return String(depuisConfig).replace(/\/$/, "");
  }

  if (typeof CONFIG_HORAIRE_PARC_NOUVELLE_DATE.apiUrl === "function") {
    return CONFIG_HORAIRE_PARC_NOUVELLE_DATE.apiUrl(sousDomaineWorker).replace(/\/$/, "");
  }

  return "";
}

function construireUrlMembreHoraireParc(chemin) {
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

  if (typeof CONFIG_HORAIRE_PARC_NOUVELLE_DATE.membreUrl === "function") {
    return CONFIG_HORAIRE_PARC_NOUVELLE_DATE.membreUrl(valeur);
  }

  if (typeof window.construireUrlMembre === "function") {
    return window.construireUrlMembre(valeur);
  }

  const base = (
    window.SITE_BASE ||
    CONFIG_HORAIRE_PARC_NOUVELLE_DATE.membreBaseUrl ||
    CONFIG_HORAIRE_PARC_NOUVELLE_DATE.MEMBRE_BASE ||
    ""
  ).replace(/\/$/, "");

  if (base) {
    return valeur.startsWith("/")
      ? base + valeur
      : base + "/" + valeur.replace(/^\.\//, "");
  }

  return valeur.startsWith("/") ? valeur : "/" + valeur;
}

function construireUrlPublicHoraireParc(chemin) {
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

  if (typeof CONFIG_HORAIRE_PARC_NOUVELLE_DATE.publicUrl === "function") {
    return CONFIG_HORAIRE_PARC_NOUVELLE_DATE.publicUrl(valeur);
  }

  const base = (
    window.ASSETS_BASE ||
    CONFIG_HORAIRE_PARC_NOUVELLE_DATE.publicBaseUrl ||
    CONFIG_HORAIRE_PARC_NOUVELLE_DATE.PUBLIC_BASE ||
    ""
  ).replace(/\/$/, "");

  if (base) {
    return valeur.startsWith("/")
      ? base + valeur
      : base + "/" + valeur.replace(/^\.\//, "");
  }

  return valeur.startsWith("/") ? valeur : "/" + valeur;
}

function redirigerConnexionMembreHoraireParc(motif) {
  const separateur = PAGE_CONNEXION_MEMBRE.includes("?") ? "&" : "?";

  window.top.location.href =
    PAGE_CONNEXION_MEMBRE +
    separateur +
    "source=horaire-parc-nouvelle-date&session=" +
    encodeURIComponent(motif || "inactive");
}

function normaliserParentOriginHoraireParc(valeur) {
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

function reponseApiOkHoraireParc(data) {
  return data && (data.ok === true || data.success === true);
}

function messageErreurApiHoraireParc(resultat, messageDefaut) {
  return resultat && (resultat.message || resultat.error)
    ? String(resultat.message || resultat.error)
    : messageDefaut;
}

function echapperHtmlHoraireParc(valeur) {
  return String(valeur ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}