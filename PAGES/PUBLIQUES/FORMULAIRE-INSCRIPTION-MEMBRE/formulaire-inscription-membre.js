const WORKER_URL = "https://form-inscription-membre-api.lacleduparc.fr";
const REDIRECT_URL = "/index.html?source=formulaire-inscription-membre";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".formulaire-inscription");

  if (!form) {
    console.error("Formulaire introuvable.");
    return;
  }

  const submitButton = document.getElementById("bouton-envoyer-inscription");

  if (!submitButton) {
    console.error("Bouton d'envoi introuvable.");
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  submitButton.addEventListener("click", async () => {
    if (submitButton.disabled) return;

    const erreur = verifierFormulaire(form);

    if (erreur) {
      await afficherAlerte("Attention", erreur);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Envoi en cours...";

    const data = lireDonneesFormulaire(form);

    try {
      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const messageErreur = result.erreurs
          ? result.erreurs[0]
          : result.message || "Erreur lors de l’envoi du formulaire.";

        await afficherAlerte("Attention", messageErreur);

        submitButton.disabled = false;
        submitButton.textContent = "Envoyer";
        return;
      }

      form.reset();

      submitButton.disabled = false;
      submitButton.textContent = "Envoyer";

      await afficherValidation(
        "Votre demande d'inscription est enregistrée, merci",
        "Un e-mail vient de vous être envoyé. Cliquez sur le lien reçu pour confirmer votre adresse e-mail et finaliser votre inscription au club."
      );

    } catch (error) {
      await afficherAlerte(
        "Information technique",
        "Il n'est pas possible d'envoyer le formulaire pour le moment."
      );

      submitButton.disabled = false;
      submitButton.textContent = "Envoyer";
    }
  });
});

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

async function afficherValidation(titre, message) {
  if (typeof window.afficherLightboxInformation === "function") {
    const affichageOk = await window.afficherLightboxInformation(titre, message, {
      type: "validation",
      redirectUrl: REDIRECT_URL
    });

    if (affichageOk === true) {
      return;
    }
  }

  alert(message);
  window.location.href = (window.SITE_BASE || "") + REDIRECT_URL;
}

document.addEventListener("DOMContentLoaded", () => {
  const emailMembre = document.getElementById("emailmembre");
  const emailParrain = document.getElementById("emailparrain");

  if (!emailMembre || !emailParrain) return;

  setTimeout(() => {
    const valeurMembre = emailMembre.value.trim().toLowerCase();
    const valeurParrain = emailParrain.value.trim().toLowerCase();

    if (valeurMembre && valeurParrain && valeurMembre === valeurParrain) {
      emailParrain.value = "";
    }
  }, 300);
});