if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiserFormulaireInscriptionMembre);
} else {
  initialiserFormulaireInscriptionMembre();
}

function initialiserFormulaireInscriptionMembre() {
  const form = document.querySelector(".formulaire-inscription");
  const submitButton = document.getElementById("bouton-envoyer-inscription");
  const emailMembre = document.getElementById("emailmembre");
  const emailParrain = document.getElementById("emailparrain");

  const workerUrl = nettoyerBaseUrl(
    window.SITE_CONFIG?.workerFormInscriptionMembreUrl ||
    window.SITE_CONFIG?.WORKER_FORM_INSCRIPTION_MEMBRE_URL ||
    ""
  );

  const redirectUrl = construireUrlPublique(
    "/index.html?source=formulaire-inscription-membre"
  );

  let envoiEnCours = false;

  if (!form) {
    console.error("Formulaire introuvable.");
    afficherAlerte(
      "Erreur technique",
      "Le formulaire est introuvable. Veuillez réessayer plus tard."
    );
    return;
  }

  if (!submitButton) {
    console.error("Bouton d'envoi introuvable.");
    afficherAlerte(
      "Erreur technique",
      "Le bouton d'envoi est introuvable. Veuillez réessayer plus tard."
    );
    return;
  }

  if (!workerUrl) {
    submitButton.disabled = true;

    afficherAlerte(
      "Configuration manquante",
      "L’adresse du service d'inscription membre n’est pas configurée."
    );
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    envoyerFormulaire();
  });

  submitButton.addEventListener("click", (event) => {
    event.preventDefault();
    envoyerFormulaire();
  });

  if (emailMembre && emailParrain) {
    setTimeout(() => {
      const valeurMembre = emailMembre.value.trim().toLowerCase();
      const valeurParrain = emailParrain.value.trim().toLowerCase();

      if (valeurMembre && valeurParrain && valeurMembre === valeurParrain) {
        emailParrain.value = "";
      }
    }, 300);
  }

  async function envoyerFormulaire() {
    if (envoiEnCours || submitButton.disabled) return;

    const erreur = verifierFormulaire(form);

    if (erreur) {
      await afficherAlerte("Attention", erreur);
      return;
    }

    envoiEnCours = true;
    submitButton.disabled = true;
    submitButton.textContent = "Envoi en cours...";

    const data = lireDonneesFormulaire(form);

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result || result.success !== true) {
        const messageErreur = result?.erreurs
          ? result.erreurs[0]
          : result?.message || "Erreur lors de l’envoi du formulaire.";

        await afficherAlerte("Attention", messageErreur);

        envoiEnCours = false;
        submitButton.disabled = false;
        submitButton.textContent = "Envoyer";
        return;
      }

      form.reset();

      await afficherValidation(
        "Votre demande d'inscription est enregistrée, merci",
        "Un e-mail vient de vous être envoyé. Cliquez sur le lien reçu pour confirmer votre adresse e-mail et finaliser votre inscription au club."
      );

    } catch (error) {
      console.error("Erreur formulaire inscription membre :", error);

      await afficherAlerte(
        "Information technique",
        "Il n'est pas possible d'envoyer le formulaire pour le moment."
      );

      envoiEnCours = false;
      submitButton.disabled = false;
      submitButton.textContent = "Envoyer";
    }
  }

  async function afficherValidation(titre, message) {
    if (typeof window.afficherLightboxInformation === "function") {
      const affichageOk = await window.afficherLightboxInformation(titre, message, {
        type: "validation",
        redirectUrl
      });

      if (affichageOk === true) {
        return;
      }
    }

    alert(message);
    window.location.href = redirectUrl;
  }
}

function lireDonneesFormulaire(form) {
  return {
    nommembre: getValue(form, "nommembre"),
    prenommembre: getValue(form, "prenommembre"),
    dptmtmembre: getValue(form, "dptmtmembre"),
    emailmembre: getValue(form, "emailmembre"),
    emailparrain: getValue(form, "emailparrain"),
    regleclub_v1: getChecked(form, "regleclub_v1"),
    regleapp_v1: getChecked(form, "regleapp_v1")
  };
}

function getValue(form, name) {
  const field = form.querySelector(`[name="${name}"]`);
  return field ? field.value.trim() : "";
}

function getChecked(form, name) {
  const field = form.querySelector(`[name="${name}"]`);
  return field ? field.checked : false;
}

function verifierFormulaire(form) {
  const nommembre = getValue(form, "nommembre");
  const prenommembre = getValue(form, "prenommembre");
  const dptmtmembre = getValue(form, "dptmtmembre");
  const emailmembre = getValue(form, "emailmembre");
  const emailparrain = getValue(form, "emailparrain");

  const regleclub = form.querySelector("#regleclub_v1");
  const regleapp = form.querySelector("#regleapp_v1");

  if (!nommembre) {
    return "Votre nom est obligatoire.";
  }

  if (!prenommembre) {
    return "Votre prénom est obligatoire.";
  }

  if (!dptmtmembre) {
    return "Un département est nécessaire.";
  }

  if (!/^(?:\d{2,3}|2A|2B)$/i.test(dptmtmembre)) {
    return "Le numéro de département n'est pas valide.";
  }

  if (!emailmembre) {
    return "Votre adresse e-mail est obligatoire.";
  }

  if (!isValidEmail(emailmembre)) {
    return "Votre adresse e-mail n'est pas valide.";
  }

  if (emailparrain && !isValidEmail(emailparrain)) {
    return "L’adresse e-mail du parrain n'est pas valide.";
  }

  if (emailmembre && emailparrain && emailmembre.toLowerCase() === emailparrain.toLowerCase()) {
    return "L’adresse e-mail du parrain doit être différente de votre adresse e-mail.";
  }

  if (!regleclub || regleclub.checked !== true) {
    return "Le règlement du club doit être accepté.";
  }

  if (!regleapp || regleapp.checked !== true) {
    return "Le règlement de l’application doit être accepté.";
  }

  return "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function afficherAlerte(titre, message) {
  if (typeof window.afficherLightboxInformation === "function") {
    const affichageOk = await window.afficherLightboxInformation(titre, message, {
      type: "erreur"
    });

    if (affichageOk === true) {
      return;
    }
  }

  alert(message);
}

function construireUrlPublique(chemin) {
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

  const publicBaseUrl = nettoyerBaseUrl(
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.PUBLIC_BASE ||
    window.SITE_BASE ||
    ""
  );

  if (publicBaseUrl) {
    return joindreBaseEtChemin(publicBaseUrl, valeur);
  }

  if (window.location.hostname.includes("github.io")) {
    return joindreBaseEtChemin("/LCDP_public", valeur);
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