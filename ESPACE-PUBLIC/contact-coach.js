(() => {
 "use strict";
 const configuration = {
  "id": "formulaire-contact-coach",
  "ariaLabel": "Formulaire de contact",
  "titre": "Formulaire de contact",
  "validationNative": true,
  "champs": [
    {
      "type": "text",
      "id": "nomcoach",
      "name": "nomcoach",
      "label": "NOM",
      "placeholder": "NOM",
      "required": true,
      "validationNative": true,
      "maxlength": 120,
      "autocomplete": "family-name"
    },
    {
      "type": "text",
      "id": "prenomcoach",
      "name": "prenomcoach",
      "label": "Prénom",
      "placeholder": "Prénom",
      "required": true,
      "validationNative": true,
      "maxlength": 120,
      "autocomplete": "given-name"
    },
    {
      "type": "email",
      "id": "emailcoach",
      "name": "emailcoach",
      "label": "Adresse mail",
      "placeholder": "Adresse mail",
      "required": true,
      "validationNative": true,
      "maxlength": 254,
      "autocomplete": "email"
    },
    {
      "type": "tel",
      "id": "telcoach",
      "name": "telcoach",
      "label": "Ligne directe",
      "placeholder": "Ligne directe",
      "required": true,
      "validationNative": true,
      "maxlength": 120,
      "autocomplete": "tel"
    },
    {
      "type": "text",
      "id": "metiercoach",
      "name": "metiercoach",
      "label": "Activité(s)",
      "placeholder": "Activité(s)",
      "required": true,
      "validationNative": true,
      "maxlength": 240
    },
    {
      "type": "text",
      "id": "dptmtcoach",
      "name": "dptmtcoach",
      "label": "Département de référence",
      "placeholder": "Département - Exemple : 08",
      "required": true,
      "validationNative": true,
      "maxlength": 3,
      "inputmode": "text"
    }
  ],
  "bouton": {
    "type": "submit",
    "label": "Envoyer ma demande",
    "style": "lcdp-button-secondary"
  },
  "introHtml": `<div class="lcdp-box-formulaire__note">Cette demande ne crée pas de compte COACH. Notre équipe vous recontacte pour étudier votre demande.</div>
    <section class="lcdp-boxtext__content" aria-labelledby="contact-coach-compte-title">
      <h2 id="contact-coach-compte-title" class="lcdp-text-strong-left" style="font-weight: 700 !important;">Le compte COACH La Clé du Parc</h2>
      <ul>
        <li>Présentez votre activité et votre territoire de référence (département).</li>
        <li>Organisez pour vos clients des moments d'exception dans le réseau des parcs.</li>
      </ul>
    </section>`
};
 window.LCDP_initialiserContactCoach = async function() {
  const form=await window.LCDP_creerFormulaire("formulaire-coach-slot",configuration);
  configuration.champs.forEach((champ, index) => {
    const controle = form.elements.namedItem(champ.name);
    if (!controle) return;
    controle.setAttribute("aria-label", champ.label);
    const zone = controle.closest(".lcdp-box-champ-formulaire")?.querySelector(".lcdp-box-champ-formulaire__label-zone");
    if (!zone) return;
    if (index === 0) {
      const label = zone.querySelector("label");
      if (label) label.textContent = "Information de contact";
    } else {
      zone.hidden = true;
    }
  });
  document.dispatchEvent(new CustomEvent("lcdp:contact-formulaire-pret", {detail: {type: "coach"}}));
  const endpoint=window.SITE_CONFIG?.workerContactCoachUrl || "https://lacleduparc.fr/api/contact-coach";
  await window.LCDP_brancherFormulaireProtege(form,{type:"coach",endpoint,champs:configuration.champs});
 };
})();
