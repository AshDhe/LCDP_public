(() => {
  "use strict";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiserConnexionMembre);
  } else {
    initialiserConnexionMembre();
  }

  function initialiserConnexionMembre() {
    appliquerRoutesSite(document);

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

    const urlMonCompteMembre = construireUrlMembre("/index.html");

    const urlMotDePasseOublie = construireUrlPublique(
      "/ESPACE-PUBLIC/mdp-perdu-membre.html"
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

    function definirEtatBoutonConnexion(enCours) {
      bouton.disabled = enCours;
      bouton.classList.toggle("is-loading", enCours);
      bouton.setAttribute("aria-label", enCours ? "Connexion en cours" : "Connexion");
      bouton.setAttribute("title", enCours ? "Connexion en cours" : "Connexion");
    }

    definirEtatBoutonConnexion(false);

    if (!endpointConnexionMembre) {
      champEmail.disabled = true;
      champMdp.disabled = true;
      definirEtatBoutonConnexion(true);

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
      definirEtatBoutonConnexion(true);

      try {
        const response = await fetch(endpointConnexionMembre, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
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
          definirEtatBoutonConnexion(false);
          return;
        }

        programmerProchaineVerificationSessionMembre(data);

        const urlDestination = obtenirUrlDestinationApresConnexion(urlMonCompteMembre);
        effacerRetourMembreApresConnexion();

        window.location.href = urlDestination;

      } catch (error) {
        console.error("Erreur connexion membre :", error);

        afficherInformation(
          "Erreur",
          "Une erreur est survenue. Veuillez réessayer.",
          "erreur"
        );

        envoiEnCours = false;
        definirEtatBoutonConnexion(false);
      }
    }
  }

  function appliquerRoutesSite(racine = document) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlPublique(element.dataset.siteHref));
    });

    racine.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlPublique(element.dataset.siteSrc));
    });
  }

  async function afficherInformation(titre, message, type = "information", redirectUrl = null) {
    const slot = document.getElementById("lcdp-lightbox-slot");

    if (!slot) {
      alert(message || titre);

      if (redirectUrl) {
        window.location.href = redirectUrl;
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
        const fermer = () => {
          slot.innerHTML = "";
          resolve();
        };

        boutonFermer.addEventListener("click", fermer, { once: true });
        boutonOk.addEventListener("click", fermer, { once: true });

        alerte.addEventListener("click", (event) => {
          if (event.target === alerte) {
            fermer();
          }
        }, { once: true });
      });

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }

    } catch (error) {
      console.error("Erreur alerte V3 :", error);

      alert(message || titre);

      if (redirectUrl) {
        window.location.href = redirectUrl;
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
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.objetUrl === "function") {
      return config.objetUrl(valeur);
    }

    const objetBaseUrl = nettoyerBaseUrl(
      config.objetBaseUrl ||
      config.OBJET_BASE ||
      ""
    );

    if (objetBaseUrl) {
      return joindreBaseEtChemin(objetBaseUrl, valeur.replace(/^\/?OBJET\//, ""));
    }

    return construireUrlPublique("/OBJET/" + valeur.replace(/^\/+/, "").replace(/^BOX\//, "BOX/"));
  }

  function construireUrlPublique(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.publicUrl === "function") {
      return config.publicUrl(valeur);
    }

    const publicBaseUrl = nettoyerBaseUrl(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    );

    if (publicBaseUrl) {
      return joindreBaseEtChemin(publicBaseUrl, valeur);
    }

    return valeur.startsWith("/") ? ".." + valeur : valeur;
  }

  function construireUrlMembre(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.membreUrl === "function") {
      return config.membreUrl(valeur);
    }

    const membreBaseUrl = nettoyerBaseUrl(
      config.membreBaseUrl ||
      config.MEMBRE_BASE ||
      ""
    );

    if (membreBaseUrl) {
      return joindreBaseEtChemin(membreBaseUrl, valeur);
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

  function obtenirUrlDestinationApresConnexion(urlDefaut) {
    const params = new URLSearchParams(window.location.search);
    const retourExplicite = normaliserUrlRetourMembre(params.get("retour"));

    if (retourExplicite) {
      return retourExplicite;
    }

    const session = String(params.get("session") || "").trim().toLowerCase();

    if (session === "inactive" || session === "expiree" || session === "expirée") {
      const retourMemorise = normaliserUrlRetourMembre(lireCookie("retour_membre"));

      if (retourMemorise) {
        return retourMemorise;
      }
    }

    return urlDefaut;
  }

  function programmerProchaineVerificationSessionMembre(data) {
    const delai = nombreSecondesValide(
      data?.nextRefreshInSeconds,
      60 * 60 * 8
    );

    if (typeof window.LCDP_programmerProchaineVerificationSessionMembre === "function") {
      window.LCDP_programmerProchaineVerificationSessionMembre(delai);
      return;
    }

    ecrireCookiePartage(
      "lcdp_session_membre_next_refresh",
      String(Date.now() + delai * 1000),
      60 * 60 * 10
    );
  }

  function effacerRetourMembreApresConnexion() {
    if (typeof window.LCDP_effacerRetourMembre === "function") {
      window.LCDP_effacerRetourMembre();
      return;
    }

    supprimerCookiePartage("retour_membre");
  }

  function normaliserUrlRetourMembre(value) {
    const texte = String(value || "").trim();

    if (!texte) return "";

    let url;

    try {
      url = new URL(texte, window.location.href);
    } catch {
      return "";
    }

    if (typeof window.LCDP_estUrlRetourMembreValide === "function") {
      return window.LCDP_estUrlRetourMembreValide(url.href) ? url.href : "";
    }

    const config = window.SITE_CONFIG || {};
    const membreBaseUrl = nettoyerBaseUrl(
      config.membreBaseUrl ||
      config.MEMBRE_BASE ||
      ""
    );

    if (!membreBaseUrl) return "";

    let membreBase;

    try {
      membreBase = new URL(membreBaseUrl);
    } catch {
      return "";
    }

    if (url.origin !== membreBase.origin) return "";

    const basePath = membreBase.pathname.replace(/\/+$/, "");
    let chemin = url.pathname;

    if (basePath) {
      if (chemin !== basePath && !chemin.startsWith(basePath + "/")) {
        return "";
      }

      chemin = chemin.slice(basePath.length) || "/";
    }

    if (!chemin.startsWith("/ESPACE-MEMBRE/")) return "";
    if (chemin === "/ESPACE-MEMBRE/accueil-membre.html") return "";
    if (chemin === "/index.html" || chemin === "/") return "";

    return url.href;
  }

  function lireCookie(nom) {
    const valeur = document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(nom + "="))
      ?.split("=")
      .slice(1)
      .join("=") || "";

    try {
      return decodeURIComponent(valeur);
    } catch {
      return valeur;
    }
  }

  function ecrireCookiePartage(nom, valeur, maxAgeSecondes) {
    document.cookie = nom + "=" + encodeURIComponent(valeur) + attributsCookiePartage(maxAgeSecondes);
  }

  function supprimerCookiePartage(nom) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const domaine = attributDomaineCookie();

    document.cookie = nom + "=; Path=/; Max-Age=0; SameSite=Lax" + secure;

    if (domaine) {
      document.cookie = nom + "=; Path=/; Max-Age=0; SameSite=Lax" + secure + domaine;
    }
  }

  function attributsCookiePartage(maxAgeSecondes) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const domaine = attributDomaineCookie();
    const maxAge = Number.isFinite(Number(maxAgeSecondes))
      ? "; Max-Age=" + String(Math.max(0, Math.floor(Number(maxAgeSecondes))))
      : "";

    return "; Path=/; SameSite=Lax" + secure + domaine + maxAge;
  }

  function attributDomaineCookie() {
    const hostname = window.location.hostname;

    if (hostname === "lacleduparc.fr" || hostname.endsWith(".lacleduparc.fr")) {
      return "; Domain=.lacleduparc.fr";
    }

    return "";
  }

  function nombreSecondesValide(value, defaut) {
    const nombre = Number(value);

    if (!Number.isFinite(nombre) || nombre <= 0) {
      return defaut;
    }

    return Math.floor(nombre);
  }

  function nettoyerBaseUrl(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function urlTechniqueOuAbsolue(value) {
    return (
      !value ||
      value.startsWith("#") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:")
    );
  }
})();