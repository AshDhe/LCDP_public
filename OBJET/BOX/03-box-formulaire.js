(() => {
  "use strict";

  const siteBase = (
    window.SITE_BASE ||
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.siteBase ||
    ""
  ).replace(/\/$/, "");

  const objetBase = (
    window.SITE_CONFIG?.objetBaseUrl ||
    window.SITE_CONFIG?.OBJET_BASE ||
    (siteBase ? siteBase + "/OBJET" : "../OBJET")
  ).replace(/\/$/, "");

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

  function construireUrlObjet(chemin) {
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

    const cheminNettoye = chemin
      .replace(/^\/+/, "")
      .replace(/^OBJET\/+/, "");

    return objetBase + "/" + cheminNettoye;
  }

  function appliquerRoutesSite(racine = document) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.dataset.siteHref));
    });

    racine.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlSite(element.dataset.siteSrc));
    });
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

  function ajouterAttributs(element, attributs = {}) {
    Object.entries(attributs).forEach(([nom, valeur]) => {
      if (valeur === undefined || valeur === null || valeur === false) {
        return;
      }

      if (valeur === true) {
        element.setAttribute(nom, "");
        return;
      }

      element.setAttribute(nom, String(valeur));
    });
  }

  function ajouterClasses(element, classes) {
    String(classes || "")
      .split(/\s+/)
      .filter(Boolean)
      .forEach((nomClasse) => element.classList.add(nomClasse));
  }

  function appliquerValeurControle(element, champ) {
    if (champ.value === undefined || champ.value === null) {
      return;
    }

    element.value = String(champ.value);
  }

  function creerLabel(champ) {
    const label = document.createElement("label");
    label.className = "lcdp-box-champ-formulaire__label";
    label.setAttribute("for", champ.id || champ.name);
    label.textContent = champ.label || "";

    if (champ.required) {
      const span = document.createElement("span");
      span.className = "lcdp-box-champ-formulaire__required";
      span.textContent = "*";
      label.appendChild(span);
    }

    return label;
  }

  function creerHeading(champ) {
    const titre = document.createElement("h2");
    titre.className = "lcdp-box-champ-formulaire__heading";
    titre.textContent = champ.label || "";

    if (champ.required) {
      const span = document.createElement("span");
      span.className = "lcdp-box-champ-formulaire__required";
      span.textContent = "*";
      titre.appendChild(span);
    }

    return titre;
  }

  function creerControleStandard(champ) {
    const type = champ.type || "text";
    const element = document.createElement(
      type === "textarea" ? "textarea" : "input"
    );

    if (type !== "textarea") {
      element.type = type;
    }

    element.id = champ.id || champ.name;
    element.name = champ.name;

    ajouterAttributs(element, {
      placeholder: champ.placeholder,
      autocomplete: champ.autocomplete,
      autocapitalize: champ.autocapitalize,
      spellcheck: champ.spellcheck,
      inputmode: champ.inputmode,
      min: champ.min,
      max: champ.max,
      step: champ.step,
      maxlength: champ.maxlength,
      readonly: champ.readonly === true,
      disabled: champ.disabled === true,
      required: champ.validationNative === true && champ.required
    });

    if (champ.readonly === true) {
      element.setAttribute("aria-readonly", "true");
    }

    appliquerValeurControle(element, champ);

    return element;
  }

  function creerControleSelect(champ) {
    const select = document.createElement("select");

    select.id = champ.id || champ.name;
    select.name = champ.name;

    ajouterAttributs(select, {
      disabled: champ.disabled === true,
      required: champ.validationNative === true && champ.required
    });

    (Array.isArray(champ.options) ? champ.options : [])
      .forEach((option) => {
        const element = document.createElement("option");
        const valeur =
          option && typeof option === "object"
            ? option.value
            : option;
        const label =
          option && typeof option === "object"
            ? option.label
            : option;

        element.value = valeur === null || valeur === undefined
          ? ""
          : String(valeur);
        element.textContent = label === null || label === undefined
          ? element.value
          : String(label);

        if (option && typeof option === "object") {
          element.disabled = option.disabled === true;
        }

        select.appendChild(element);
      });

    appliquerValeurControle(select, champ);

    return select;
  }

  function creerControleCheckbox(champ) {
    const label = document.createElement("label");
    label.className = "lcdp-box-champ-formulaire__checkbox-line";
    label.setAttribute("for", champ.id || champ.name);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = champ.id || champ.name;
    input.name = champ.name;
    input.checked = champ.checked === true || champ.value === true;

    ajouterAttributs(input, {
      disabled: champ.disabled === true,
      required: champ.validationNative === true && champ.required
    });

    const span = document.createElement("span");
    span.textContent = champ.checkboxLabel || champ.label || "";

    label.appendChild(input);
    label.appendChild(span);

    return label;
  }

  async function creerChamp(champ) {
    const fragment = await chargerFragmentObjet("/BOX/03-box-champ-formulaire.html");

    const element = fragment.querySelector("[data-lcdp-box-champ-formulaire]");
    const labelZone = fragment.querySelector("[data-lcdp-champ-label-zone]");
    const description = fragment.querySelector("[data-lcdp-champ-description]");
    const control = fragment.querySelector("[data-lcdp-champ-control]");

    if (!element || !labelZone || !description || !control) {
      throw new Error("Structure du champ formulaire V3 incomplète.");
    }

    ajouterClasses(element, champ.className);

    if (champ.type === "checkbox") {
      labelZone.appendChild(creerHeading(champ));
      control.appendChild(creerControleCheckbox(champ));
    } else {
      labelZone.appendChild(creerLabel(champ));
      control.appendChild(
        champ.type === "select"
          ? creerControleSelect(champ)
          : creerControleStandard(champ)
      );
    }

    if (champ.descriptionHtml) {
      description.innerHTML = champ.descriptionHtml;
      description.hidden = false;
    } else if (champ.description) {
      description.textContent = champ.description;
      description.hidden = false;
    }

    appliquerRoutesSite(element);

    return element;
  }

  function actualiserEnteteFormulaire(header) {
    if (!header) return;

    const contientElementVisible = Array.from(header.children).some((element) => {
      return element.hidden !== true && !element.hasAttribute("hidden");
    });

    header.hidden = contientElementVisible !== true;
  }

  async function creerFormulaire(slotId, configuration) {
    const slot =
      typeof slotId === "string"
        ? document.getElementById(slotId)
        : slotId;

    if (!slot || !configuration) {
      return null;
    }

    slot.innerHTML = "";

    const fragment = await chargerFragmentObjet("/BOX/03-box-formulaire.html");
    slot.appendChild(fragment);

    const form = slot.querySelector("[data-lcdp-box-formulaire]");
    const header = slot.querySelector(".lcdp-box-formulaire__header");
    const titre = slot.querySelector("[data-lcdp-formulaire-title]");
    const sousTitre = slot.querySelector("[data-lcdp-formulaire-subtitle]");
    const intro = slot.querySelector("[data-lcdp-formulaire-intro]");
    const fields = slot.querySelector("[data-lcdp-formulaire-fields]");
    const actions = slot.querySelector("[data-lcdp-formulaire-actions]");
    const note = slot.querySelector("[data-lcdp-formulaire-note]");

    if (!form || !header || !titre || !sousTitre || !intro || !fields || !actions || !note) {
      throw new Error("Structure du formulaire V3 incomplète.");
    }

    if (configuration.id) {
      form.id = configuration.id;
    }

    if (configuration.ariaLabel) {
      form.setAttribute("aria-label", configuration.ariaLabel);
    }

    ajouterClasses(form, configuration.formClassName);
    ajouterClasses(fields, configuration.fieldsClassName);
    ajouterClasses(actions, configuration.actionsClassName);

    if (configuration.validationNative === true) {
      form.noValidate = false;
      form.removeAttribute("novalidate");
    } else {
      form.noValidate = true;
      form.setAttribute("novalidate", "novalidate");
    }

    const texteTitre = String(configuration.titre || "").trim();
    titre.textContent = texteTitre;
    titre.hidden = !texteTitre;

    const texteSousTitre = String(configuration.sousTitre || "").trim();
    sousTitre.textContent = texteSousTitre;
    sousTitre.hidden = !texteSousTitre;

    if (configuration.sousTitreClasse) {
      String(configuration.sousTitreClasse)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((nomClasse) => sousTitre.classList.add(nomClasse));
    }

    if (configuration.introHtml) {
      intro.innerHTML = configuration.introHtml;
      intro.hidden = false;
    } else {
      intro.innerHTML = "";
      intro.hidden = true;
    }

    actualiserEnteteFormulaire(header);

    if (Array.isArray(configuration.champs)) {
      for (const champ of configuration.champs) {
        fields.appendChild(await creerChamp(champ));
      }
    }

    const boutons = Array.isArray(configuration.boutons)
      ? configuration.boutons
      : configuration.bouton
        ? [configuration.bouton]
        : [];

    boutons.forEach((configurationBouton) => {
      const bouton = document.createElement("button");
      bouton.type = configurationBouton.type || "submit";

      if (configurationBouton.id) {
        bouton.id = configurationBouton.id;
      }

      bouton.className =
        "lcdp-button " +
        (configurationBouton.style || "lcdp-button-primary");
      bouton.textContent =
        configurationBouton.label || "Envoyer";

      if (configurationBouton.disabled === true) {
        bouton.disabled = true;
      }

      actions.appendChild(bouton);
    });

    if (configuration.noteHtml) {
      note.innerHTML = configuration.noteHtml;
      note.hidden = false;
    }

    appliquerRoutesSite(slot);

    return form;
  }

  window.LCDP_creerFormulaire = creerFormulaire;
  window.LCDP_construireUrlSite = construireUrlSite;
  window.LCDP_construireUrlObjet = construireUrlObjet;
  window.LCDP_chargerFragmentObjet = chargerFragmentObjet;
})();
