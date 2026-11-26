/* Dialogue transversal : règlement d'un impayé. Le paiement reste dans le workflow membre. */
(() => {
  "use strict";
  if (window.LCDP_DialogueImpaye) return;
  let ouverture = null;
  function urlObjet(chemin) {
    const config = window.SITE_CONFIG || {};
    const fn = window.LCDP_urlObjet || config.objetUrl;
    if (typeof fn === "function") return fn(chemin);
    const base = config.objetBaseUrl || config.OBJET_BASE;
    if (!base) throw Error("Objets LCDP non configurés.");
    return String(base).replace(/\/+$/, "") + "/" + chemin.replace(/^\/+/, "");
  }
  async function monter({hote, message, titre = "Abonnement impayé", payer}) {
    if (!hote?.isConnected || typeof payer !== "function") throw Error("Dialogue de régularisation non configuré.");
    const r = await fetch(urlObjet("/HTMLBASE/02-dialogue-reference-impaye.html?v=20261126-v1"), {
      credentials: "omit", cache: "no-cache", signal: AbortSignal.timeout(12000)
    });
    if (!r.ok) throw Error("Dialogue de régularisation indisponible.");
    const template = document.createElement("template");
    template.innerHTML = (await r.text()).trim();
    const boite = template.content.querySelector('[data-lcdp-dialogue-reference="impaye"]');
    const bouton = boite?.querySelector('[data-lcdp-dialogue-action="payer"]');
    const libelle = boite?.querySelector("[data-lcdp-dialogue-titre]");
    const texte = boite?.querySelector("[data-lcdp-dialogue-message]");
    if (!boite || !bouton || !libelle || !texte) throw Error("Dialogue de régularisation incomplet.");
    boite.dataset.lcdpDialogueContext = "conteneur";
    libelle.textContent = titre;
    if (message) texte.textContent = message;
    const focus = document.activeElement;
    const wrapper = hote.closest(".lcdp-app-wrapper, .lcdp-site-page");
    const etats = Array.from(wrapper?.children || []).filter(el => el !== hote && !el.contains(hote)).map(el => [el, el.inert]);
    hote.appendChild(boite);
    etats.forEach(([el]) => { el.inert = true; });
    const selection = await new Promise(resolve => {
      let termine = false;
      function clore(choix) {
        if (termine) return;
        termine = true;
        document.removeEventListener("keydown", clavier);
        boite.remove();
        etats.forEach(([el, inert]) => { el.inert = inert; });
        if (focus?.isConnected) focus.focus();
        resolve(choix);
      }
      function clavier(e) {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); clore(false); }
        else if (e.key === "Tab") { e.preventDefault(); bouton.focus(); }
      }
      bouton.addEventListener("click", () => clore(true), { once: true });
      boite.addEventListener("click", e => { if (e.target === boite) clore(false); });
      document.addEventListener("keydown", clavier);
      bouton.focus();
    });
    if (selection) await payer();
    return selection;
  }
  function ouvrir(options) {
    if (ouverture) return ouverture;
    ouverture = monter(options).finally(() => { ouverture = null; });
    return ouverture;
  }
  window.LCDP_DialogueImpaye = Object.freeze({ouvrir});
})();
