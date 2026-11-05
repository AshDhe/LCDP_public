(() => {
  "use strict";
  if (window.LCDP_CONTACT_INFO) return;

  const contenu = Object.freeze({
    verification: {
      titre: "Vérification",
      texte: "Écrivez à l’administrateur depuis votre messagerie personnelle en lui indiquant l’email associé à votre compte membre dans l’application.",
      email: "verification@lacleduparc.fr"
    },
    juridique: {
      titre: "Demande juridique",
      texte: "Pour toute question concernant les mentions légales ou vos données personnelles, écrivez à l’administrateur depuis votre messagerie personnelle. Si votre demande concerne votre compte membre, indiquez l’email associé à ce compte.",
      email: "juridique@lacleduparc.fr"
    }
  });

  // Présentation assurée par lcdp-central-mobile-first.css.

  function element(tag, classe, texte) {
    const node = document.createElement(tag);
    if (classe) node.className = classe;
    if (texte) node.textContent = texte;
    return node;
  }

  function ouvrir(type) {
    const config = contenu[type];
    if (!config) throw new Error("Type de contact inconnu.");
    if (document.querySelector("[data-lcdp-contact-info]")) return;
    const precedent = document.activeElement;
    const dialogue = element("dialog", "lcdp-contact-info");
    dialogue.dataset.lcdpContactInfo = type;
    dialogue.setAttribute("aria-labelledby", "lcdp-contact-titre");
    dialogue.setAttribute("aria-describedby", "lcdp-contact-texte");
    const titre = element("h2", "lcdp-contact-info__title", config.titre);
    titre.id = "lcdp-contact-titre";
    const texte = element("p", "lcdp-contact-info__text", config.texte);
    texte.id = "lcdp-contact-texte";
    const adresse = element("a", "lcdp-contact-info__email", config.email);
    adresse.href = "mailto:" + config.email;
    const actions = element("div", "lcdp-contact-info__actions");
    const ok = element("button", "lcdp-button lcdp-button-primary", "Fermer");
    ok.type = "button";
    actions.appendChild(ok);
    dialogue.append(titre, texte, adresse, actions);
    document.body.appendChild(dialogue);

    const terminer = () => dialogue.close();
    ok.addEventListener("click", terminer);
    // Éviter de fermer simultanément la fenêtre des mentions sous cette infobox.
    dialogue.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); }
    });

    dialogue.addEventListener("cancel", event => event.preventDefault());
    dialogue.addEventListener("close", () => {
      dialogue.remove();
      if (precedent?.isConnected) precedent.focus();
    }, { once: true });
    dialogue.showModal();
    ok.focus();
  }

  window.LCDP_CONTACT_INFO = Object.freeze({ ouvrir });
})();
