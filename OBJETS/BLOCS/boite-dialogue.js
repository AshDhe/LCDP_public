let boiteDialogueReady = null;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiserBoiteDialogue);
} else {
  initialiserBoiteDialogue();
}

function initialiserBoiteDialogue() {
  boiteDialogueReady = chargerBoiteDialogue();
}

async function chargerBoiteDialogue() {
  const container = document.getElementById("boite-dialogue-container");

  if (!container) {
    console.error("Conteneur boite-dialogue-container introuvable.");
    return false;
  }

  const siteBase = (
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.PUBLIC_BASE ||
    window.SITE_CONFIG?.siteBase ||
    window.SITE_BASE ||
    ""
  ).replace(/\/$/, "");

  try {
    const response = await fetch(siteBase + "/OBJETS/BLOCS/boite-dialogue.html");

    if (!response.ok) {
      throw new Error("Impossible de charger la boîte de dialogue.");
    }

    const html = await response.text();
    container.innerHTML = html;

    return true;
  } catch (error) {
    console.error("Erreur boîte de dialogue :", error);
    return false;
  }
}

window.afficherBoiteDialogue = async function (options = {}) {
  if (boiteDialogueReady) {
    await boiteDialogueReady;
  }

  const boite = document.getElementById("boite-dialogue");
  const box = boite ? boite.querySelector(".dialog-box") : null;
  const titre = document.getElementById("boite-dialogue-titre");
  const form = document.getElementById("boite-dialogue-form");
  const contenu = document.getElementById("boite-dialogue-contenu");
  const erreur = document.getElementById("boite-dialogue-erreur");
  const boutonAnnuler = document.getElementById("boite-dialogue-annuler");
  const boutonValider = document.getElementById("boite-dialogue-valider");

  if (!boite || !box || !titre || !form || !contenu || !erreur || !boutonAnnuler || !boutonValider) {
    console.error("Boîte de dialogue introuvable ou incomplète.");
    return null;
  }

  titre.textContent = options.titre || "";
  contenu.innerHTML = "";
  erreur.textContent = "";
  erreur.hidden = true;
  form.reset();

  boutonAnnuler.textContent = options.texteAnnuler || "Annuler";
  boutonValider.textContent = options.texteValider || "Valider";

  const champs = Array.isArray(options.champs) ? options.champs : [];

  champs.forEach((champ) => {
    ajouterChampBoiteDialogue(champ, contenu);
  });

  boite.hidden = false;

  const premierChamp = contenu.querySelector("input, textarea, select");

  if (premierChamp) {
    premierChamp.focus();
  }

  return new Promise((resolve) => {
    function fermer(resultat) {
      boite.hidden = true;
      form.reset();
      contenu.innerHTML = "";
      erreur.textContent = "";
      erreur.hidden = true;

      boutonAnnuler.onclick = null;
      form.onsubmit = null;
      boite.onclick = null;

      resolve(resultat);
    }

    boutonAnnuler.onclick = () => {
      fermer(null);
    };

    boite.onclick = (event) => {
      if (event.target === boite) {
        fermer(null);
      }
    };

    form.onsubmit = (event) => {
      event.preventDefault();

      erreur.textContent = "";
      erreur.hidden = true;

      if (!form.checkValidity()) {
        erreur.textContent = options.texteErreur || "Merci de vérifier le champ saisi.";
        erreur.hidden = false;
        return;
      }

      const formData = new FormData(form);
      const valeurs = {};

      for (const [key, value] of formData.entries()) {
        valeurs[key] = String(value || "").trim();
      }

      fermer(valeurs);
    };
  });
};

function ajouterChampBoiteDialogue(champ, contenu) {
  const wrapper = document.createElement("div");
  wrapper.className = "dialog-field";

  const type = champ.type || "text";

  if (type === "radio" || type === "checkbox") {
    const label = document.createElement("label");
    label.className = "dialog-choice";

    const input = document.createElement("input");
    input.type = type;
    input.id = champ.id;
    input.name = champ.name || champ.id;
    input.value = champ.value || "";

    if (champ.required) input.required = true;
    if (champ.checked) input.checked = true;

    const texte = document.createElement("span");
    texte.textContent = champ.label || "";

    label.appendChild(input);
    label.appendChild(texte);
    wrapper.appendChild(label);
    contenu.appendChild(wrapper);

    return;
  }

  const label = document.createElement("label");
  label.setAttribute("for", champ.id);
  label.textContent = champ.label || "";

  let champFormulaire;

  if (type === "textarea") {
    champFormulaire = document.createElement("textarea");
  } else if (type === "select") {
    champFormulaire = document.createElement("select");

    const options = Array.isArray(champ.options) ? champ.options : [];

    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value || "";
      optionElement.textContent = option.label || "";
      champFormulaire.appendChild(optionElement);
    });
  } else {
    champFormulaire = document.createElement("input");
    champFormulaire.type = type;
  }

  champFormulaire.id = champ.id;
  champFormulaire.name = champ.name || champ.id;
  champFormulaire.value = champ.value || "";

  if (champ.placeholder) champFormulaire.placeholder = champ.placeholder;
  if (champ.autocomplete) champFormulaire.autocomplete = champ.autocomplete;
  if (champ.required) champFormulaire.required = true;

  wrapper.appendChild(label);
  wrapper.appendChild(champFormulaire);
  contenu.appendChild(wrapper);
}