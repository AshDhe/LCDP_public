if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiserFormulaireListeAttente);
} else {
  initialiserFormulaireListeAttente();
}

function initialiserFormulaireListeAttente() {
  const formulaire = document.getElementById("formulaire-liste-attente");
  const boutonEnvoyer = document.getElementById("bouton-envoyer-liste-attente");
  const champAge = document.getElementById("age");

  const endpoint = obtenirEndpointListeAttente();
  const redirectUrl = construireUrlAccueilPublic();

  let envoiEnCours = false;
  let texteBoutonInitial = "M'inscrire sur liste d'attente";

  if (boutonEnvoyer) {
    texteBoutonInitial = boutonEnvoyer.textContent.trim() || texteBoutonInitial;
  }

  if (champAge) {
    champAge.setAttribute("min", "18");
    champAge.setAttribute("max", "100");
  }

  if (!formulaire) {
    console.error("Formulaire liste d'attente introuvable.");
    afficherInformationListeAttente(
      "Erreur technique",
      "Le formulaire est introuvable. Veuillez réessayer plus tard.",
      "erreur"
    );
    return;
  }

  if (!boutonEnvoyer) {
    console.error("Bouton d'envoi liste d'attente introuvable.");
    afficherInformationListeAttente(
      "Erreur technique",
      "Le bouton d'envoi est introuvable. Veuillez réessayer plus tard.",
      "erreur"
    );
    return;
  }

  if (!endpoint) {
    boutonEnvoyer.disabled = true;

    afficherInformationListeAttente(
      "Configuration manquante",
      "L’adresse du service de liste d'attente n’est pas configurée.",
      "erreur"
    );
    return;
  }

  formulaire.addEventListener("submit", async (event) => {
    event.preventDefault();
    await envoyerFormulaireListeAttente();
  });

  async function envoyerFormulaireListeAttente() {
    if (envoiEnCours || boutonEnvoyer.disabled) return;

    const payload = lireDonneesListeAttente();
    const erreur = validerPayloadListeAttente(payload);

    if (erreur) {
      await afficherInformationListeAttente("Formulaire incomplet", erreur, "erreur");
      return;
    }

    envoiEnCours = true;
    boutonEnvoyer.disabled = true;
    boutonEnvoyer.textContent = "Envoi en cours...";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || data.success !== true) {
        await afficherInformationListeAttente(
          "Inscription non enregistrée",
          data?.message || "Votre inscription n'a pas pu être enregistrée.",
          "erreur"
        );

        envoiEnCours = false;
        boutonEnvoyer.disabled = false;
        boutonEnvoyer.textContent = texteBoutonInitial;
        return;
      }

      formulaire.reset();

      await afficherInformationListeAttente(
        "Merci",
        "Votre inscription sur la liste d'attente est enregistrée. Un e-mail de confirmation vient de vous être envoyé avec le récapitulatif de vos informations.",
        "validation",
        {
          redirectUrl
        }
      );

      envoiEnCours = false;
      boutonEnvoyer.disabled = false;
      boutonEnvoyer.textContent = texteBoutonInitial;

    } catch (error) {
      console.error("Erreur formulaire liste d'attente :", error);

      await afficherInformationListeAttente(
        "Erreur",
        "Il n'est pas possible d'envoyer le formulaire pour le moment.",
        "erreur"
      );

      envoiEnCours = false;
      boutonEnvoyer.disabled = false;
      boutonEnvoyer.textContent = texteBoutonInitial;
    }
  }
}

function lireDonneesListeAttente() {
  return {
    nom: lireValeurListeAttente("nom"),
    prenom: lireValeurListeAttente("prenom"),
    departement: normaliserDepartementListeAttente(lireValeurListeAttente("departement")),
    age: lireNombreOptionnelListeAttente("age"),
    email: lireValeurListeAttente("email").toLowerCase(),
    texte_libre: lireValeurListeAttente("texte_libre"),
    responsable_parc: document.getElementById("responsable_parc")?.checked === true,
    responsable_activite: document.getElementById("responsable_activite")?.checked === true
  };
}

function lireValeurListeAttente(id) {
  return String(document.getElementById(id)?.value || "").trim();
}

function lireNombreOptionnelListeAttente(id) {
  const valeur = lireValeurListeAttente(id);

  if (!valeur) return null;

  const nombre = Number.parseInt(valeur, 10);

  return Number.isInteger(nombre) ? nombre : null;
}

function normaliserDepartementListeAttente(valeur) {
  const departement = String(valeur || "").trim().toUpperCase();

  if (/^\d$/.test(departement)) {
    return "0" + departement;
  }

  return departement;
}

function validerPayloadListeAttente(payload) {
  if (!payload.nom) {
    return "Veuillez renseigner votre nom.";
  }

  if (!payload.prenom) {
    return "Veuillez renseigner votre prénom.";
  }

  if (!payload.departement) {
    return "Veuillez renseigner votre département.";
  }

  if (!/^(?:\d{2,3}|2A|2B)$/i.test(payload.departement)) {
    return "Le numéro de département n'est pas valide.";
  }

  if (
    payload.age !== null &&
    (
      !Number.isInteger(payload.age) ||
      payload.age < 18 ||
      payload.age > 100
    )
  ) {
    return "Veuillez renseigner un âge valide.";
  }

  if (!payload.email) {
    return "Veuillez renseigner votre adresse e-mail.";
  }

  if (!isValidEmailListeAttente(payload.email)) {
    return "Veuillez renseigner une adresse e-mail valide.";
  }

  return "";
}

function isValidEmailListeAttente(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function obtenirEndpointListeAttente() {
  const config = window.SITE_CONFIG || {};

  const depuisConfig =
    config.workerLaUrl ||
    config.WORKER_LA_URL ||
    "";

  if (depuisConfig) {
    return nettoyerBaseUrlListeAttente(depuisConfig);
  }

  if (typeof config.apiUrl === "function") {
    return nettoyerBaseUrlListeAttente(config.apiUrl("la-api"));
  }

  return "";
}

function construireUrlAccueilPublic() {
  const config = window.SITE_CONFIG || {};

  if (typeof config.publicUrl === "function") {
    return config.publicUrl("/index.html");
  }

  const base = nettoyerBaseUrlListeAttente(
    config.publicBaseUrl ||
    config.PUBLIC_BASE ||
    window.SITE_BASE ||
    ""
  );

  return base ? base + "/index.html" : "/index.html";
}

function nettoyerBaseUrlListeAttente(value) {
  return String(value || "").replace(/\/+$/, "");
}

async function afficherInformationListeAttente(titre, message, type = "information", options = {}) {
  const slot = document.getElementById("lcdp-lightbox-slot");
  const texte = titre ? `${titre}\n\n${message}` : message;

  if (slot) {
    slot.innerHTML = `
      <div class="lcdp-box-alerte" role="alertdialog" aria-modal="true" data-lcdp-box-alerte>
        <div class="lcdp-box-alerte__card">
          <button
            class="lcdp-box-alerte__close"
            type="button"
            aria-label="Fermer"
            data-lcdp-alerte-close
          >×</button>
          <p class="lcdp-box-alerte__message" data-lcdp-alerte-message></p>
          <button class="lcdp-button lcdp-button-primary" type="button" data-lcdp-alerte-ok>OK</button>
        </div>
      </div>
    `;

    const alerte = slot.querySelector("[data-lcdp-box-alerte]");
    const messageElement = slot.querySelector("[data-lcdp-alerte-message]");
    const boutonsFermeture = slot.querySelectorAll("[data-lcdp-alerte-close], [data-lcdp-alerte-ok]");

    if (alerte) {
      alerte.dataset.type = type;
    }

    if (messageElement) {
      messageElement.textContent = texte;
    }

    await new Promise((resolve) => {
      const fermer = () => {
        slot.innerHTML = "";
        resolve();
      };

      boutonsFermeture.forEach((bouton) => {
        bouton.addEventListener("click", fermer, { once: true });
      });

      alerte?.addEventListener("click", (event) => {
        if (event.target === alerte) {
          fermer();
        }
      }, { once: true });
    });

    if (options.redirectUrl) {
      window.location.href = options.redirectUrl;
    }

    return;
  }

  alert(message);

  if (options.redirectUrl) {
    window.location.href = options.redirectUrl;
  }
}
