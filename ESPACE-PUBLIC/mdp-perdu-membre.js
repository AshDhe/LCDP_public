(() => {
  "use strict";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserMdpPerduMembre);
  } else {
    initialiserMdpPerduMembre();
  }

  function initialiserMdpPerduMembre() {
    const formulaire = document.getElementById("formulaire-mdp-perdu-membre");
    const champEmail = document.getElementById("emailmembre");
    const boutonValider = document.getElementById("bouton-valider-formulaire");

    let envoiEnCours = false;

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

      if (envoiEnCours) {
        return;
      }

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

      envoiEnCours = true;
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

          envoiEnCours = false;
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
        console.error("Erreur mot de passe perdu membre :", error);

        await afficherMessage(
          "Erreur d’envoi",
          "Une erreur est survenue. Veuillez réessayer.",
          { type: "erreur" }
        );

        envoiEnCours = false;
        boutonValider.disabled = false;
        boutonValider.textContent = "Envoyer";
      }
    });
  }

  function construireUrlWorkerMdpPerdu() {
    const config = window.SITE_CONFIG || {};

    const endpointDirect = nettoyerBaseUrl(
      config.workerEmailtokenzUrl ||
      config.WORKER_EMAILTOKENZ_URL ||
      ""
    );

    if (endpointDirect) {
      return joindreBaseEtChemin(endpointDirect, "/mdp-perdu");
    }

    if (typeof config.apiUrl === "function") {
      return joindreBaseEtChemin(
        config.apiUrl("emailtokenz-api"),
        "/mdp-perdu"
      );
    }

    return "";
  }

  function construireUrlAccueil() {
    const config = window.SITE_CONFIG || {};

    if (typeof config.publicUrl === "function") {
      return config.publicUrl("/index.html");
    }

    const base = nettoyerBaseUrl(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    );

    if (base) {
      return joindreBaseEtChemin(base, "/index.html");
    }

    return "/index.html";
  }

  function emailValide(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function afficherMessage(titre, message, options = {}) {
    const slot = document.getElementById("lcdp-lightbox-slot");

    if (!slot) {
      alert(`${titre}\n\n${message}`);

      if (options.redirectUrl) {
        window.location.href = options.redirectUrl;
      }

      return;
    }

    slot.innerHTML = "";

    try {
      const fragment = await chargerFragmentObjet("/BOX/02-box-alerte.html");
      slot.appendChild(fragment);

      const alerte = slot.querySelector("[data-lcdp-box-alerte]");
      const messageElement = slot.querySelector("[data-lcdp-alerte-message]");
      const boutonFermer = slot.querySelector("[data-lcdp-alerte-close]");
      const boutonOk = slot.querySelector("[data-lcdp-alerte-ok]");

      if (!alerte || !messageElement || !boutonFermer || !boutonOk) {
        throw new Error("Structure de l'alerte V3 incomplète.");
      }

      messageElement.textContent = titre && message
        ? titre + " — " + message
        : titre || message || "";

      await new Promise((resolve) => {
        let ferme = false;

        const fermer = () => {
          if (ferme) return;
          ferme = true;
          slot.innerHTML = "";
          resolve();
        };

        boutonFermer.addEventListener("click", fermer, { once: true });
        boutonOk.addEventListener("click", fermer, { once: true });

        alerte.addEventListener("click", (event) => {
          if (event.target === alerte) {
            fermer();
          }
        });
      });

      if (options.redirectUrl) {
        window.location.href = options.redirectUrl;
      }

    } catch (error) {
      console.error("Erreur alerte V3 :", error);

      alert(`${titre}\n\n${message}`);

      if (options.redirectUrl) {
        window.location.href = options.redirectUrl;
      }
    }
  }

  async function chargerFragmentObjet(chemin) {
    const reponse = await fetch(construireUrlObjet(chemin), {
      method: "GET",
      credentials: "same-origin",
      cache: "force-cache"
    });

    if (!reponse.ok) {
      throw new Error("Fragment objet introuvable : " + chemin);
    }

    const html = await reponse.text();
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.cloneNode(true);
  }

  function construireUrlObjet(chemin) {
    const config = window.SITE_CONFIG || {};
    const objetBase = nettoyerBaseUrl(
      config.objetBaseUrl ||
      config.OBJET_BASE ||
      ""
    );

    const cheminNettoye = String(chemin || "")
      .replace(/^\/+/, "")
      .replace(/^OBJET\/+/, "");

    if (objetBase) {
      return joindreBaseEtChemin(objetBase, cheminNettoye);
    }

    return "../OBJET/" + cheminNettoye;
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
})();
