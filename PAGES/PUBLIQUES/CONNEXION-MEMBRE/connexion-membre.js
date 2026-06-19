if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiserConnexionMembre);
} else {
  initialiserConnexionMembre();
}

function initialiserConnexionMembre() {
  const formulaire = document.getElementById("formulaire-connexion-membre");
  const champEmail = document.getElementById("emailmembre");
  const champMdp = document.getElementById("mdpmembre");
  const bouton = document.getElementById("bouton-valider-formulaire");
  const afficherMotDePasse = document.getElementById("afficher-mdp-membre");
  const lienMotDePasseOublie = document.getElementById("lien-mot-de-passe-oublie");

  const endpointConnexionMembre = nettoyerBaseUrl(
    window.SITE_CONFIG?.workerConnexionMembreUrl ||
    window.SITE_CONFIG?.WORKER_CONNEXION_MEMBRE_URL ||
    ""
  );

  const urlMonCompteMembre = construireUrlMembre(
    "/PAGES/PRIVEES/MON-COMPTE-MEMBRE/mon-compte-membre.html"
  );

  const urlMotDePasseOublie = construireUrlPublique(
    "/PAGES/PUBLIQUES/MDP-PERDU/mdp-perdu-membre.html"
  );

  let envoiEnCours = false;

  if (lienMotDePasseOublie) {
    lienMotDePasseOublie.href = urlMotDePasseOublie;
  }

  if (!formulaire || !champEmail || !champMdp || !bouton) {
    afficherInformation(
      "Erreur technique",
      "Le formulaire de connexion est incomplet. Veuillez réessayer plus tard.",
      "erreur"
    );
    return;
  }

  if (!endpointConnexionMembre) {
    champEmail.disabled = true;
    champMdp.disabled = true;
    bouton.disabled = true;

    afficherInformation(
      "Configuration manquante",
      "L’adresse du service de connexion membre n’est pas configurée.",
      "erreur"
    );
    return;
  }

  if (afficherMotDePasse) {
    afficherMotDePasse.addEventListener("change", () => {
      champMdp.type = afficherMotDePasse.checked ? "text" : "password";
    });
  }

  formulaire.addEventListener("submit", (event) => {
    event.preventDefault();
    connecterMembre();
  });

  async function connecterMembre() {
    if (envoiEnCours) return;

    const emailmembre = champEmail.value.trim().toLowerCase();
    const mdpmembre = champMdp.value;

    if (!emailmembre) {
      afficherInformation(
        "Identifiant manquant",
        "Veuillez renseigner votre email.",
        "erreur"
      );
      return;
    }

    if (!mdpmembre) {
      afficherInformation(
        "Mot de passe manquant",
        "Veuillez renseigner votre mot de passe.",
        "erreur"
      );
      return;
    }

    envoiEnCours = true;
    bouton.disabled = true;
    bouton.textContent = "Connexion en cours...";

    try {
      const response = await fetch(endpointConnexionMembre, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emailmembre,
          mdpmembre
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || data.success !== true) {
        afficherInformation(
          "Connexion impossible",
          data?.message || "Identifiant ou mot de passe incorrect.",
          "erreur"
        );

        envoiEnCours = false;
        bouton.disabled = false;
        bouton.textContent = "Connexion";
        return;
      }

      window.location.href = urlMonCompteMembre;

    } catch (error) {
      console.error("Erreur connexion membre :", error);

      afficherInformation(
        "Erreur",
        "Une erreur est survenue. Veuillez réessayer.",
        "erreur"
      );

      envoiEnCours = false;
      bouton.disabled = false;
      bouton.textContent = "Connexion";
    }
  }
}

function construireUrlPublique(chemin) {
  const publicBaseUrl = nettoyerBaseUrl(
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.PUBLIC_BASE ||
    window.SITE_BASE ||
    ""
  );

  return construireUrlDepuisBase(publicBaseUrl, chemin, "/LCDP_public");
}

function construireUrlMembre(chemin) {
  const membreBaseUrl = nettoyerBaseUrl(
    window.SITE_CONFIG?.membreBaseUrl ||
    window.SITE_CONFIG?.MEMBRE_BASE ||
    ""
  );

  return construireUrlDepuisBase(membreBaseUrl, chemin, "/LCDP_membre");
}

function construireUrlDepuisBase(baseUrl, chemin, depotGithubFallback) {
  const valeur = String(chemin || "");

  if (
    valeur.startsWith("#") ||
    valeur.startsWith("mailto:") ||
    valeur.startsWith("tel:") ||
    valeur.startsWith("http://") ||
    valeur.startsWith("https://")
  ) {
    return valeur;
  }

  if (baseUrl) {
    return joindreBaseEtChemin(baseUrl, valeur);
  }

  if (window.location.hostname.includes("github.io")) {
    return joindreBaseEtChemin(depotGithubFallback, valeur);
  }

  return valeur.startsWith("/") ? valeur : "/" + valeur;
}

function joindreBaseEtChemin(baseUrl, chemin) {
  const base = nettoyerBaseUrl(baseUrl);
  const cheminNettoye = "/" + String(chemin || "").replace(/^\/+/, "");

  if (!base) {
    return cheminNettoye;
  }

  return base + cheminNettoye;
}

function nettoyerBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

async function afficherInformation(titre, message, type = "information", redirectUrl = null) {
  if (typeof window.afficherLightboxInformation === "function") {
    const affichageOk = await window.afficherLightboxInformation(titre, message, {
      type,
      redirectUrl
    });

    if (affichageOk === true) {
      return;
    }
  }

  alert(message);

  if (redirectUrl) {
    window.location.href = redirectUrl;
  }
}