(() => {
  "use strict";

  const TEXTE_BOUTON_DEFAUT = "Connexion";
  const TEXTE_BOUTON_CHARGEMENT = "Connexion en cours...";

  const CONFIG = window.SITE_CONFIG || {};

  function lireConfig(...chemins) {
    for (const chemin of chemins) {
      const valeur = chemin.split(".").reduce((objet, cle) => {
        if (!objet || typeof objet !== "object") return undefined;
        return objet[cle];
      }, CONFIG);

      if (typeof valeur === "string" && valeur.trim() !== "") {
        return valeur.trim();
      }
    }

    return "";
  }

  function construireUrlSite(chemin) {
    if (typeof window.construireUrlSite === "function") {
      return window.construireUrlSite(chemin);
    }

    const siteBase = (
      window.SITE_BASE ||
      CONFIG.publicBaseUrl ||
      CONFIG.siteBase ||
      ""
    ).replace(/\/$/, "");

    const siteRootRelative = window.SITE_ROOT_RELATIVE || "../../../";

    if (!chemin) return chemin;

    if (
      chemin.startsWith("#") ||
      chemin.startsWith("mailto:") ||
      chemin.startsWith("tel:") ||
      chemin.startsWith("http://") ||
      chemin.startsWith("https://")
    ) {
      return chemin;
    }

    if (siteBase) {
      return chemin.startsWith("/")
        ? siteBase + chemin
        : siteBase + "/" + chemin.replace(/^\.\//, "");
    }

    return siteRootRelative.replace(/\/?$/, "/") + chemin.replace(/^\//, "");
  }

  function initialiserConnexionMembre() {
    const formulaire = document.getElementById("formulaire-connexion-membre");
    const champEmail = document.getElementById("emailmembre");
    const champMdp = document.getElementById("mdpmembre");
    const checkboxAfficherMdp = document.getElementById("afficher-mdp-membre");
    const bouton = document.getElementById("bouton-valider-formulaire");
    const lienMotDePasseOublie = document.getElementById("lien-mot-de-passe-oublie");

    if (!formulaire || !champEmail || !champMdp || !bouton) {
      afficherMessage("Une erreur est survenue au chargement de la page.");
      return;
    }

    initialiserLienMotDePasseOublie(lienMotDePasseOublie);
    initialiserAffichageMotDePasse(champMdp, checkboxAfficherMdp);

    formulaire.addEventListener("submit", (event) => {
      event.preventDefault();
      connecterMembre(champEmail, champMdp, bouton);
    });
  }

  function initialiserLienMotDePasseOublie(lien) {
    if (!lien) return;

    const routeMotDePasseOublie =
      lireConfig(
        "routes.pagePublicMdpPerduMembre",
        "routes.mdpPerduMembre",
        "pages.pagePublicMdpPerduMembre",
        "pages.mdpPerduMembre",
        "pagePublicMdpPerduMembre"
      ) ||
      lien.dataset.siteHref ||
      "/PAGES/PUBLIQUES/MDP-PERDU/mdp-perdu-membre.html";

    lien.href = construireUrlSite(routeMotDePasseOublie);
  }

  function initialiserAffichageMotDePasse(champMdp, checkboxAfficherMdp) {
    if (!champMdp || !checkboxAfficherMdp) return;

    function mettreAJourAffichageMdp() {
      champMdp.type = checkboxAfficherMdp.checked ? "text" : "password";
    }

    checkboxAfficherMdp.addEventListener("change", mettreAJourAffichageMdp);
    mettreAJourAffichageMdp();
  }

  async function connecterMembre(champEmail, champMdp, bouton) {
    if (bouton.disabled) return;

    const workerConnexionMembreUrl =
      lireConfig(
        "workers.connexionMembre",
        "workers.connexionMembreUrl",
        "api.connexionMembre",
        "api.connexionMembreUrl",
        "apis.connexionMembre",
        "apis.connexionMembreUrl",
        "endpoints.connexionMembre",
        "endpoints.connexionMembreUrl",
        "workerConnexionMembreUrl",
        "connexionMembreApiUrl"
      ) ||
      "https://connexion-membre-api.lacleduparc.fr";

    const routeMonCompteMembre =
      lireConfig(
        "routes.pagePriveeMonCompteMembre",
        "routes.monCompteMembre",
        "pages.pagePriveeMonCompteMembre",
        "pages.monCompteMembre",
        "pagePriveeMonCompteMembre"
      ) ||
      "/PAGES/PRIVEES/MON-COMPTE-MEMBRE/mon-compte-membre.html";

    const emailmembre = champEmail.value.trim().toLowerCase();
    const mdpmembre = champMdp.value;

    masquerMessage();

    if (!emailmembre) {
      afficherMessage("Veuillez renseigner votre identifiant de compte.");
      champEmail.focus();
      return;
    }

    if (!mdpmembre) {
      afficherMessage("Veuillez renseigner votre mot de passe.");
      champMdp.focus();
      return;
    }

    mettreBoutonEnChargement(bouton, true);

    try {
      const reponse = await fetch(workerConnexionMembreUrl, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emailmembre,
          mdpmembre
        })
      });

      const resultat = await lireReponseJson(reponse);

      if (!reponse.ok || !resultat || resultat.success !== true) {
        afficherMessage(
          resultat?.message || "Identifiant ou mot de passe incorrect."
        );
        return;
      }

      window.location.assign(construireUrlSite(routeMonCompteMembre));
    } catch (erreur) {
      afficherMessage("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      mettreBoutonEnChargement(bouton, false);
    }
  }

  async function lireReponseJson(reponse) {
    const contentType = reponse.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return null;
    }

    return reponse.json().catch(() => null);
  }

  function mettreBoutonEnChargement(bouton, chargement) {
    bouton.disabled = chargement;
    bouton.textContent = chargement ? TEXTE_BOUTON_CHARGEMENT : TEXTE_BOUTON_DEFAUT;
  }

  function afficherMessage(message) {
    const zoneMessage = document.getElementById("message-connexion-membre");

    if (zoneMessage) {
      zoneMessage.textContent = message;
      zoneMessage.hidden = false;
    }

    if (typeof window.afficherLightboxInformation === "function") {
      window.afficherLightboxInformation(message);
      return;
    }

    if (typeof window.ouvrirLightboxInformation === "function") {
      window.ouvrirLightboxInformation(message);
      return;
    }

    alert(message);
  }

  function masquerMessage() {
    const zoneMessage = document.getElementById("message-connexion-membre");

    if (!zoneMessage) return;

    zoneMessage.textContent = "";
    zoneMessage.hidden = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserConnexionMembre);
  } else {
    initialiserConnexionMembre();
  }
})();