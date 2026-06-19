(function () {
  function initialiserMdpPerduMembre() {
    const formulaire = document.getElementById("formulaire-mdp-perdu-membre");
    const champEmail = document.getElementById("emailmembre");
    const boutonValider = document.getElementById("bouton-valider-formulaire");

    if (!formulaire || !champEmail || !boutonValider) {
      afficherMessage("Erreur technique : formulaire incomplet.");
      return;
    }

    formulaire.addEventListener("submit", async (event) => {
      event.preventDefault();

      const emailmembre = champEmail.value.trim().toLowerCase();
      const urlWorkerMdpPerdu = construireUrlWorkerMdpPerdu();

      if (!urlWorkerMdpPerdu) {
        afficherMessage("Erreur technique : endpoint mot de passe perdu non configuré.");
        return;
      }

      if (!emailmembre) {
        afficherMessage("Veuillez saisir votre adresse e-mail.");
        return;
      }

      if (!emailValide(emailmembre)) {
        afficherMessage("L’adresse e-mail saisie n’est pas valide.");
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
          afficherMessage(
            data?.message || "La demande n’a pas pu être enregistrée."
          );

          boutonValider.disabled = false;
          boutonValider.textContent = "Envoyer";
          return;
        }

        afficherMessage(
          "Si un compte membre correspond à cette adresse e-mail, un lien vient d’être envoyé."
        );

        redirigerAccueilAuClicLightbox();

      } catch (error) {
        afficherMessage("Une erreur est survenue. Veuillez réessayer.");

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

  function redirigerAccueilAuClicLightbox() {
    setTimeout(() => {
      const boutonOk = document.querySelector(
        ".lightbox-information .button, .lightbox-box .button"
      );

      if (!boutonOk) {
        return;
      }

      boutonOk.addEventListener("click", () => {
        window.location.href = construireUrlAccueil();
      }, { once: true });
    }, 0);
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

  function afficherMessage(message) {
    if (typeof window.afficherLightboxInformation === "function") {
      window.afficherLightboxInformation(message);
      return;
    }

    alert(message);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserMdpPerduMembre);
  } else {
    initialiserMdpPerduMembre();
  }
})();