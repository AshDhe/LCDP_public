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
          if (configurationBouton.variante === "reserver") {
            bouton.classList.add("lcdp-accueil-planifier");
            bouton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
</svg>`;
            const libelle = document.createElement("span");
            libelle.textContent = configurationBouton.label;
            bouton.appendChild(libelle);
          } else {
            bouton.textContent = configurationBouton.label;
          }

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