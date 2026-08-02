(() => {
  "use strict";

  function initialiser(options = {}) {
    const slot = resoudreSlot(options.slot);
    const columns = normaliserColonnes(options.columns);
    const rows = Array.isArray(options.rows) ? options.rows : [];

    if (!slot) {
      throw new Error("Slot de table membre introuvable.");
    }

    const racine = slot.querySelector("[data-lcdp-table-lecture]");

    if (!racine) {
      throw new Error("Objet table membre introuvable.");
    }

    const loading = racine.querySelector("[data-lcdp-table-lecture-loading]");
    const scroll = racine.querySelector("[data-lcdp-table-lecture-scroll]");
    const table = racine.querySelector("[data-lcdp-table-lecture-table]");
    const head = racine.querySelector("[data-lcdp-table-lecture-head]");
    const body = racine.querySelector("[data-lcdp-table-lecture-body]");
    const empty = racine.querySelector("[data-lcdp-table-lecture-empty]");
    const errorBox = racine.querySelector("[data-lcdp-table-lecture-error]");

    if (!scroll || !table || !head || !body || !empty || !errorBox) {
      throw new Error("Structure de table membre incomplète.");
    }

    if (options.ariaLabel) {
      racine.setAttribute("aria-label", String(options.ariaLabel));
    }

    if (options.emptyMessage) {
      empty.textContent = String(options.emptyMessage);
    }

    rendreEntete(head, columns);
    rendreLignes(body, columns, rows, options.renderCell);

    if (loading) {
      loading.hidden = true;
    }

    errorBox.hidden = true;
    scroll.hidden = columns.length === 0 || rows.length === 0;
    empty.hidden = rows.length > 0;

    return Object.freeze({
      mettreAJour(nouvellesLignes) {
        const liste = Array.isArray(nouvellesLignes)
          ? nouvellesLignes
          : [];

        rendreLignes(body, columns, liste, options.renderCell);
        scroll.hidden = columns.length === 0 || liste.length === 0;
        empty.hidden = liste.length > 0;
        errorBox.hidden = true;
      },
      afficherErreur(message) {
        scroll.hidden = true;
        empty.hidden = true;
        errorBox.textContent = String(message || "Erreur de chargement.");
        errorBox.hidden = false;
      }
    });
  }

  function rendreEntete(head, columns) {
    head.innerHTML = "";

    columns.forEach((column) => {
      const cellule = document.createElement("th");
      cellule.scope = "col";
      cellule.textContent = column.label;
      head.appendChild(cellule);
    });
  }

  function rendreLignes(body, columns, rows, renderCell) {
    body.innerHTML = "";

    rows.forEach((row) => {
      const ligne = document.createElement("tr");

      columns.forEach((column) => {
        const cellule = document.createElement("td");
        const valeur = row?.[column.key];
        const renduPersonnalise = typeof renderCell === "function"
          ? renderCell({ row, column, value: valeur, cell: cellule })
          : null;

        if (renduPersonnalise instanceof Node) {
          cellule.appendChild(renduPersonnalise);
        } else if (renduPersonnalise !== null && renduPersonnalise !== undefined) {
          cellule.textContent = String(renduPersonnalise);
        } else {
          cellule.textContent = formaterValeur(column, valeur);
        }

        ligne.appendChild(cellule);
      });

      body.appendChild(ligne);
    });
  }

  function formaterValeur(column, value) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (column.type === "number") {
      return new Intl.NumberFormat("fr-FR").format(Number(value) || 0);
    }

    if (column.type === "date") {
      const date = new Date(String(value).slice(0, 10) + "T12:00:00Z");

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("fr-FR", {
          timeZone: "Europe/Paris",
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }).format(date);
      }
    }

    return String(value);
  }

  function normaliserColonnes(value) {
    return (Array.isArray(value) ? value : [])
      .map((column) => {
        if (!column || typeof column !== "object") {
          return null;
        }

        const key = String(column.key || "").trim();

        if (!key) {
          return null;
        }

        return {
          key,
          label: String(column.label || key),
          type: String(column.type || "text")
        };
      })
      .filter(Boolean);
  }

  function resoudreSlot(value) {
    if (value instanceof Element) {
      return value;
    }

    if (typeof value === "string" && value) {
      return document.getElementById(value) || document.querySelector(value);
    }

    return null;
  }

  window.LCDP_TABLE_LECTURE = Object.freeze({
    initialiser
  });
})();
