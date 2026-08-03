(() => {
  "use strict";

  function initialiser(options = {}) {
    const racine = options.racine;
    const onglets = normaliserOnglets(options.onglets);
    const navigation = racine?.querySelector(
      "[data-lcdp-wraper-onglets-navigation]"
    );
    const contenu = racine?.querySelector(
      ".lcdp-wraper-onglets__contenu"
    );

    if (!racine || !navigation || !contenu) {
      throw new Error("Structure de l’objet onglets incomplète.");
    }

    if (!onglets.length) {
      throw new Error("Aucun onglet n’est configuré.");
    }

    const idPrefix = normaliserIdentifiant(
      options.idPrefix || "lcdp-wraper-onglets"
    );
    const actifInitial = onglets.some((onglet) => onglet.key === options.actif)
      ? options.actif
      : onglets[0].key;

    racine.classList.remove(
      "lcdp-wraper-onglets--2",
      "lcdp-wraper-onglets--3",
      "lcdp-wraper-onglets--4"
    );
    racine.classList.add(
      "lcdp-wraper-onglets--" + String(Math.min(4, onglets.length))
    );
    racine.setAttribute(
      "aria-label",
      String(options.ariaLabel || "Navigation par onglets")
    );

    navigation.innerHTML = "";
    navigation.setAttribute(
      "aria-label",
      String(options.navigationAriaLabel || options.ariaLabel || "Sections")
    );
    contenu.innerHTML = "";

    const boutons = [];
    const panneaux = [];
    const zones = {};

    onglets.forEach((onglet) => {
      const idOnglet = idPrefix + "-tab-" + onglet.key;
      const idPanneau = idPrefix + "-panel-" + onglet.key;
      const actif = onglet.key === actifInitial;

      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "lcdp-wraper-onglets__tab";
      bouton.id = idOnglet;
      bouton.setAttribute("role", "tab");
      bouton.setAttribute("aria-selected", String(actif));
      bouton.setAttribute("aria-controls", idPanneau);
      bouton.dataset.lcdpOnglet = onglet.key;
      bouton.tabIndex = actif ? 0 : -1;
      bouton.textContent = onglet.label;

      const panneau = document.createElement("section");
      panneau.id = idPanneau;
      panneau.className = "lcdp-wraper-onglets__panneau";
      panneau.setAttribute("role", "tabpanel");
      panneau.setAttribute("aria-labelledby", idOnglet);
      panneau.dataset.lcdpPanneauOnglet = onglet.key;
      panneau.hidden = !actif;

      const zone = document.createElement("div");
      zone.dataset.lcdpContenuOnglet = onglet.key;
      panneau.appendChild(zone);

      navigation.appendChild(bouton);
      contenu.appendChild(panneau);

      boutons.push(bouton);
      panneaux.push(panneau);
      zones[onglet.key] = zone;
    });

    function activer(key, placerFocus = false) {
      if (!zones[key]) {
        return false;
      }

      boutons.forEach((bouton) => {
        const actif = bouton.dataset.lcdpOnglet === key;
        bouton.setAttribute("aria-selected", String(actif));
        bouton.tabIndex = actif ? 0 : -1;

        if (actif && placerFocus) {
          bouton.focus();
        }
      });

      panneaux.forEach((panneau) => {
        panneau.hidden = panneau.dataset.lcdpPanneauOnglet !== key;
      });

      return true;
    }

    boutons.forEach((bouton, index) => {
      bouton.addEventListener("click", () => {
        activer(bouton.dataset.lcdpOnglet);
      });

      bouton.addEventListener("keydown", (event) => {
        let prochainIndex = null;

        if (event.key === "ArrowRight") {
          prochainIndex = (index + 1) % boutons.length;
        } else if (event.key === "ArrowLeft") {
          prochainIndex = (index - 1 + boutons.length) % boutons.length;
        } else if (event.key === "Home") {
          prochainIndex = 0;
        } else if (event.key === "End") {
          prochainIndex = boutons.length - 1;
        }

        if (prochainIndex === null) {
          return;
        }

        event.preventDefault();
        activer(
          boutons[prochainIndex].dataset.lcdpOnglet,
          true
        );
      });
    });

    return {
      racine,
      zones,
      boutons,
      panneaux,
      activer
    };
  }

  function normaliserOnglets(source) {
    if (!Array.isArray(source)) {
      return [];
    }

    const cles = new Set();

    return source
      .map((onglet) => ({
        key: normaliserIdentifiant(onglet?.key || ""),
        label: String(onglet?.label || "").trim()
      }))
      .filter((onglet) => {
        if (!onglet.key || !onglet.label || cles.has(onglet.key)) {
          return false;
        }

        cles.add(onglet.key);
        return true;
      });
  }

  function normaliserIdentifiant(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  window.LCDP_WRAPER_ONGLETS = Object.freeze({
    initialiser
  });
})();
