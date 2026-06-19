(function () {
  function initialiserMdpPerduMembre() {
    const formulaire = document.getElementById("formulaire-mdp-perdu-membre");
    const champEmail = document.getElementById("emailmembre");
    const boutonValider = document.getElementById("bouton-valider-formulaire");

    if (!formulaire || !champEmail || !boutonValider) {
      afficherMessage(
        "Erreur technique",
        "Le formulaire est incomplet.",
        { type: "erreur" }
      );
      return;
    }

    formulaire.addEventListener("submit", async (event) => {
      event.preventDefault();

      const emailmembre = champEmail.value.trim().toLowerCase();
      const urlWorkerMdpPerdu = construireUrlWorkerMdpPerdu();

      if (!urlWorkerMdpPerdu) {
        await afficherMessage(
          "Erreur technique",
          "L’endpoint mot de passe perdu n’est pas configuré.",
          { type: "erreur" }
        );
        return;
      }

      if (!emailmembre) {
        await afficherMessage(
          "Adresse e-mail manquante",
          "Veuillez saisir votre adresse e-mail.",
          { type: "erreur" }
        );
        return;
      }

      if (!emailValide(emailmembre)) {
        await afficherMessage(
          "Adresse e-mail invalide",
          "L’adresse e-mail saisie n’est pas valide.",
          { type: "erreur" }
        );
        return;
      }

      boutonValider.disabled = true;
      boutonValider.textContent = "Envoi en cours...";

      try {
        const response = await fetch(urlWorkerMdpPerdu, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "omit",
          body: JSON.stringify({
            emailmembre
          })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data || data.success !== true) {
          await afficherMessage(
            "Demande impossible",
            data?.message || "La demande n’a pas pu être enregistrée.",
            { type: "erreur" }
          );

          boutonValider.disabled = false;
          boutonValider.textContent = "Envoyer";
          return;
        }

        await afficherMessage(
          "Demande envoyée",
          "Si un compte membre correspond à cette adresse e-mail, un lien vient d’être envoyé.",
          {
            type: "validation",
            redirectUrl: construireUrlAccueil()
          }
        );

      } catch (error) {
        await afficherMessage(
          "Erreur d’envoi",
          "Une erreur est survenue. Veuillez réessayer.",
          { type: "erreur" }
        );

        boutonValider.disabled = false;
        boutonValider.textContent = "Envoyer";
      }
    });
  }

  function construireUrlWorkerMdpPerdu() {
    if (
      window.SITE_CONFIG &&
      typeof window.SITE_CONFIG.apiUrl === "function"
    ) {
      return window.SITE_CONFIG
        .apiUrl("emailtokenz-api")
        .replace(/\/+$/, "") + "/mdp-perdu";
    }

    return "";
  }

  function construireUrlAccueil() {
    const base =
      window.SITE_CONFIG?.publicBaseUrl ||
      window.SITE_CONFIG?.PUBLIC_BASE ||
      window.SITE_CONFIG?.siteBase ||
      window.SITE_BASE ||
      "";

    return base.replace(/\/$/, "") + "/index.html";
  }

  function emailValide(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function afficherMessage(titre, message, options = {}) {
    if (typeof window.afficherLightboxInformation === "function") {
      const resultat = await window.afficherLightboxInformation(
        titre,
        message,
        options
      );

      if (resultat !== false) {
        return;
      }
    }

    alert(`${titre}\n\n${message}`);

    if (options.redirectUrl) {
      window.location.href = options.redirectUrl;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserMdpPerduMembre);
  } else {
    initialiserMdpPerduMembre();
  }
})();