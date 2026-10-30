(() => {
      "use strict";

      const siteBase = (
        window.SITE_BASE ||
        window.SITE_CONFIG?.publicBaseUrl ||
        window.SITE_CONFIG?.siteBase ||
        ""
      ).replace(/\/$/, "");

      const CONFIG_PAGE = window.SITE_CONFIG || {};

      const ENDPOINT_INDEX_MEMBRE = construireEndpointApi(
        "workerIndexMembreUrl",
        "WORKER_INDEX_MEMBRE_URL",
        "W_INDEX_MEMBRE_URL",
        "index-membre-api"
      );

      const ENDPOINT_LA_CLE_DU_PARC = construireEndpointApi(
        "workerLaCleDuParcUrl",
        "WORKER_LA_CLE_DU_PARC_URL",
        "W_LA_CLE_DU_PARC_URL",
        "la-cle-du-parc-api"
      );

      let etatMembrePublicCharge = false;
      let etatMembrePublic = null;

      function construireUrlSite(chemin) {
        if (!chemin) return chemin;

        if (
          chemin.startsWith("#") ||
          chemin.startsWith("mailto:") ||
          chemin.startsWith("tel:") ||
          chemin.startsWith("http://") ||
          chemin.startsWith("https://") ||
          chemin.startsWith("data:")
        ) {
          return chemin;
        }

        if (siteBase) {
          return chemin.startsWith("/")
            ? siteBase + chemin
            : siteBase + "/" + chemin.replace(/^\.\//, "");
        }

        return chemin.startsWith("/") ? ".." + chemin : chemin;
      }

      function construireUrlMembre(chemin) {
        if (typeof window.SITE_CONFIG?.membreUrl === "function") {
          return window.SITE_CONFIG.membreUrl(chemin);
        }

        const membreBase =
          window.SITE_CONFIG?.membreBaseUrl ||
          window.SITE_CONFIG?.MEMBRE_BASE ||
          "";

        if (membreBase) {
          return membreBase.replace(/\/$/, "") + "/" + String(chemin || "").replace(/^\/+/, "");
        }

        return construireUrlSite(chemin);
      }

      function appliquerRoutesSite(racine = document) {
        racine.querySelectorAll("[data-site-href]").forEach((element) => {
          element.setAttribute("href", construireUrlSite(element.dataset.siteHref));
        });

        racine.querySelectorAll("[data-site-src]").forEach((element) => {
          element.setAttribute("src", construireUrlSite(element.dataset.siteSrc));
        });
      }

      function lireCookie(nom) {
        return document.cookie
          .split(";")
          .map((part) => part.trim())
          .some((part) => part.startsWith(nom + "="));
      }

      async function chargerFragment(chemin) {
        const reponse = await fetch(construireUrlSite(chemin), {
          method: "GET",
          credentials: "same-origin",
          cache: "no-cache"
        });

        if (!reponse.ok) {
          throw new Error("Fragment introuvable : " + chemin);
        }

        const html = await reponse.text();
        const template = document.createElement("template");
        template.innerHTML = html.trim();

        return template.content.cloneNode(true);
      }

      function chargerScriptUneFois(chemin) {
        const src = construireUrlSite(chemin);

        if (document.querySelector(`script[data-lcdp-script="${chemin}"]`)) {
          return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.defer = true;
          script.dataset.lcdpScript = chemin;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Script introuvable : " + chemin));
          document.body.appendChild(script);
        });
      }

      function appliquerVarianteAlerteAccueil(alerte, variante) {
        if (["reserver", "planning", "ouvrir"].includes(variante)) {
          alerte.classList.add("lcdp-alerte-accueil-" + variante);
        }
      }

      function construireUrlConnexionMembrePublic() {
        return construireUrlSite("/ESPACE-PUBLIC/connexion-membre.html");
      }

      function optionsAlerteConnexionRequise(variante) {
        return {
          variante,
          boutonOkLabel: "Me connecter",
          redirectionOk: construireUrlConnexionMembrePublic()
        };
      }

      async function afficherAlerte(message, options = {}) {
        const slot = document.getElementById("lcdp-lightbox-slot");
        slot.innerHTML = "";

        const fragment = await chargerFragment("/OBJET/BOX/02-box-alerte.html");
        slot.appendChild(fragment);

        const alerte = slot.querySelector("[data-lcdp-box-alerte]");
        const texte = slot.querySelector("[data-lcdp-alerte-message]");
        const boutonFermer = slot.querySelector("[data-lcdp-alerte-close]");
        const boutonOk = slot.querySelector("[data-lcdp-alerte-ok]");

        if (!alerte || !texte || !boutonFermer || !boutonOk) {
          throw new Error("Structure de l’alerte incomplète.");
        }

        texte.textContent = message;

        if (options.boutonOkLabel) {
          boutonOk.textContent = options.boutonOkLabel;
        }

        appliquerVarianteAlerteAccueil(alerte, options.variante);

        const fermer = () => {
          slot.innerHTML = "";
        };

        const fermerEtRediriger = () => {
          fermer();

          if (options.redirectionOk) {
            window.location.href = options.redirectionOk;
          }
        };

        boutonFermer.addEventListener("click", fermer);
        boutonOk.addEventListener("click", options.redirectionOk ? fermerEtRediriger : fermer);

        alerte.addEventListener("click", (event) => {
          if (event.target === alerte) {
            fermer();
          }
        });

        document.addEventListener(
          "keydown",
          (event) => {
            if (event.key === "Escape") {
              fermer();
            }
          },
          { once: true }
        );
      }

      function ouvrirDialogueConnexion() {
        if (typeof window.LCDP_ouvrirDialogueMonCompte === "function") {
          window.LCDP_ouvrirDialogueMonCompte();
          return;
        }

        document.dispatchEvent(new CustomEvent("lcdp:ouvrir-dialogue-mon-compte"));
      }

      async function chargerEtatMembrePublic() {
        if (etatMembrePublicCharge) {
          return etatMembrePublic;
        }

        etatMembrePublicCharge = true;

        if (!ENDPOINT_INDEX_MEMBRE) {
          return null;
        }

        try {
          const reponse = await fetch(ENDPOINT_INDEX_MEMBRE + "/index", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              "Accept": "application/json"
            }
          });

          const resultat = await reponse.json().catch(() => null);

          if (reponse.status === 401) {
            etatMembrePublic = null;
            return null;
          }

          if (!reponse.ok || !resultat || resultat.success !== true || resultat.connected !== true) {
            etatMembrePublic = null;
            return null;
          }

          etatMembrePublic = {
            abonne: valeurBooleenneVraie(resultat.abonne),
            parrainRenseigne: valeurBooleenneVraie(resultat.parrainRenseigne),
            aReservationEnCours: valeurBooleenneVraie(resultat.aReservationEnCours || resultat.aReservationValidable),
            reservationEnCours: resultat.reservationEnCours || resultat.reservationValidable || null
          };

          return etatMembrePublic;

        } catch (erreur) {
          console.error("Erreur état membre depuis accueil public :", erreur);
          etatMembrePublic = null;
          return null;
        }
      }

      async function ouvrirDialogueBoutons(options) {
        const slot = document.getElementById("lcdp-lightbox-slot");
        slot.innerHTML = "";

        const fragment = await chargerFragment("/OBJET/BOX/02-box-dialogue-bouton.html");
        slot.appendChild(fragment);

        const dialogue = slot.querySelector("[data-lcdp-box-dialogue-bouton]");
        const titre = slot.querySelector("[data-lcdp-dialogue-title]");
        const texte = slot.querySelector("[data-lcdp-dialogue-text]");
        const actions = slot.querySelector("[data-lcdp-dialogue-actions]");
        const boutonFermer = slot.querySelector("[data-lcdp-dialogue-close]");

        if (!dialogue || !titre || !texte || !actions || !boutonFermer) {
          throw new Error("Structure de dialogue bouton incomplète.");
        }

        titre.textContent = options.titre || "";
        texte.textContent = options.texte || "";
        actions.innerHTML = "";

        return new Promise((resolve) => {
          let resolu = false;

          function fermer(valeur) {
            if (resolu) return;
            resolu = true;
            slot.innerHTML = "";
            resolve(valeur || null);
          }

          (options.boutons || []).forEach((configuration) => {
            const bouton = document.createElement("button");
            bouton.type = "button";
            bouton.className = "lcdp-button " + (configuration.style || "lcdp-button-primary");
            bouton.textContent = configuration.label || "Valider";

            bouton.addEventListener("click", () => {
              fermer(configuration.valeur || configuration.label || true);
            });

            actions.appendChild(bouton);
          });

          boutonFermer.addEventListener("click", () => fermer(null));

          dialogue.addEventListener("click", (event) => {
            if (event.target === dialogue) fermer(null);
          });

          document.addEventListener(
            "keydown",
            (event) => {
              if (event.key === "Escape") fermer(null);
            },
            { once: true }
          );
        });
      }

      function normaliserNomFonction(libelle) {
        return (String(libelle || "").trim() || "cette fonction").toLocaleUpperCase("fr-FR");
      }

      function messageConnexionRequise(libelleBouton) {
        return "Vous devez être connecté(e) à votre compte membre pour utiliser la fonction " + normaliserNomFonction(libelleBouton) + ".";
      }

      function messageAbonnementRequis(libelleBouton) {
        return "Vous devez être membre abonné pour utiliser la fonction " + normaliserNomFonction(libelleBouton) + ".";
      }

      async function gererBoutonAccueilConnecte(action, libelleBouton, variante) {
        const issue = await window.LCDP_AccueilDroits.executer(action);
        if (issue === "non_connecte") {
          await afficherAlerte(messageConnexionRequise(libelleBouton), optionsAlerteConnexionRequise(variante));
        }
      }

      async function gererEtreInvitePublic() {
        const etat = await chargerEtatMembrePublic();

        if (!etat) {
          window.location.href = construireUrlSite("/ESPACE-PUBLIC/inscription.html");
          return;
        }

        if (!etat.parrainRenseigne) {
          await afficherAlerte('Renseignez votre parrain dans la rubrique "Mes informations"');
          return;
        }

        await afficherAlerte("Votre parrain peut vous inviter depuis son espace.");
      }

      function construireEndpointApi(cleModerne, cleLegacy, cleCourte, sousDomaineWorker) {
        const depuisConfig =
          (cleModerne ? CONFIG_PAGE?.[cleModerne] : "") ||
          (cleLegacy ? CONFIG_PAGE?.[cleLegacy] : "") ||
          (cleCourte ? CONFIG_PAGE?.[cleCourte] : "") ||
          "";

        if (depuisConfig) return String(depuisConfig).replace(/\/+$/, "");

        if (typeof CONFIG_PAGE.apiUrl === "function") {
          return CONFIG_PAGE.apiUrl(sousDomaineWorker).replace(/\/+$/, "");
        }

        return "";
      }

      function valeurBooleenneVraie(valeur) {
        return valeur === true || valeur === "true" || valeur === 1 || valeur === "1";
      }

      async function initialiserBandeau() {
        const slot = document.getElementById("lcdp-bandeau-slot");
        slot.innerHTML = "";

        const bandeau = await chargerFragment("/ESPACE-PUBLIC/box-bandeau-nav-public.html");
        slot.appendChild(bandeau);

        appliquerRoutesSite(slot);

        await chargerScriptUneFois("/ESPACE-PUBLIC/box-menu-burger-public.js");

        if (typeof window.LCDP_initialiserMenuBurgerPublic === "function") {
          await window.LCDP_initialiserMenuBurgerPublic();
        }
      }

      async function initialiserMenuCentral() {
        const slot = document.getElementById("lcdp-menu-central-slot");
        slot.innerHTML = "";

        const fragment = await chargerFragment("/OBJET/BOX/02-box-menu-bouton.html");
        slot.appendChild(fragment);

        const liste = slot.querySelector("[data-lcdp-menu-bouton-list]");

        if (!liste) {
          throw new Error("Structure du menu bouton incomplète.");
        }

        liste.classList.add("lcdp-accueil-actions");

        const boutons = [
          {
            label: "Planifier",
            style: "lcdp-button-accueil lcdp-button-accueil-orange",
            variante: "reserver",
            action: (libelleBouton) => gererBoutonAccueilConnecte("planifier", libelleBouton, "reserver")
          },
          {
            label: "Mes accès",
            style: "lcdp-button-accueil lcdp-button-accueil-green",
            variante: "planning",
            action: (libelleBouton) => gererBoutonAccueilConnecte("mes_acces", libelleBouton, "planning")
          },
          {
            label: "Ma clé",
            style: "lcdp-button-accueil lcdp-button-accueil-blue",
            variante: "ouvrir",
            action: (libelleBouton) => gererBoutonAccueilConnecte("ma_cle", libelleBouton, "ouvrir")
          }
        ];

        boutons.forEach((configurationBouton) => {
          const bouton = document.createElement("button");
          bouton.type = "button";
          bouton.className = "lcdp-button " + configurationBouton.style;
          bouton.classList.add("lcdp-accueil-picto");
          const pictos = {
            reserver: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="3" y="3" width="18" height="18" rx="4" ry="4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="7" y="7" width="2.3" height="2.3" rx="0.4" fill="currentColor"/>
  <rect x="10.85" y="7" width="2.3" height="2.3" rx="0.4" fill="currentColor"/>
  <rect x="14.7" y="7" width="2.3" height="2.3" rx="0.4" fill="currentColor"/>
  <rect x="7" y="10.85" width="2.3" height="2.3" rx="0.4" fill="currentColor"/>
  <rect x="10.85" y="10.85" width="2.3" height="2.3" rx="0.4" fill="currentColor"/>
  <rect x="14.7" y="10.85" width="2.3" height="2.3" rx="0.4" fill="currentColor"/>
  <rect x="7" y="14.7" width="2.3" height="2.3" rx="0.4" fill="currentColor"/>
  <rect x="10.85" y="14.7" width="2.3" height="2.3" rx="0.4" fill="currentColor"/>
  <rect x="14.7" y="14.7" width="2.3" height="2.3" rx="0.4" fill="currentColor"/>
</svg>`,
            planning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="3" y="3" width="18" height="18" rx="4" ry="4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 8.5h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 15.5h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
            ouvrir: '<img src="data:image/webp;base64,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" alt="" aria-hidden="true">'
          };
          bouton.innerHTML = pictos[configurationBouton.variante] || "";
          const libelle = document.createElement("span");
          libelle.textContent = configurationBouton.label;
          bouton.appendChild(libelle);

          bouton.addEventListener("click", () => {
            const libelleBouton = bouton.textContent.trim() || configurationBouton.label || "";

            Promise.resolve(configurationBouton.action(libelleBouton)).catch((erreur) => {
              console.error(erreur);
              afficherAlerte(erreur.message || "Erreur technique. Merci de réessayer.", { variante: configurationBouton.variante }).catch(console.error);
            });
          });

          liste.appendChild(bouton);
        });
      }

      async function initialiserFooter() {
        const slot = document.getElementById("lcdp-footer-slot");
        slot.innerHTML = "";

        const footer = await chargerFragment("/OBJET/BOX/02-box-footer.html");
        slot.appendChild(footer);

        appliquerRoutesSite(slot);
      }

      appliquerRoutesSite(document);

      initialiserBandeau()
        .then(initialiserMenuCentral)
        .then(initialiserFooter)
        .catch((erreur) => {
          console.error(erreur);
        });
    })();