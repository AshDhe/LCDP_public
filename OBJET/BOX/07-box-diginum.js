/* OBJET 07-box-diginum — pavé numérique réutilisable. */
(() => {
  "use strict";

  let dialogueOuvert = false;

  function urlObjet(chemin) {
    if (typeof window.LCDP_urlObjet === "function") return window.LCDP_urlObjet(chemin);
    const base = String(window.LCDP_OBJET_BASE || "").replace(/\/+$/, "");
    return base + "/" + String(chemin || "").replace(/^\/+/, "");
  }

  async function chargerModele() {
    const response = await fetch(urlObjet("/BOX/07-box-diginum.html"), {
      method: "GET", credentials: "omit", cache: "no-cache"
    });
    if (!response.ok) throw new Error("Objet Diginum indisponible.");
    const template = document.createElement("template");
    template.innerHTML = (await response.text()).trim();
    const racine = template.content.querySelector("[data-lcdp-box-diginum]");
    if (!racine) throw new Error("Structure de l'objet Diginum incomplète.");
    return racine;
  }

  /**
   * ouvrir({ titre, placeholder, longueurMax, autoValider, verifier }) → Promise<string|null>
   * autoValider(code) : retourne true si la saisie doit être soumise sans clic logo.
   * verifier(code) : retourne null/false/"" si valide, sinon un message d'erreur.
   * Sans autoValider, la touche avec le logo valide explicitement la saisie.
   */
  async function ouvrir(options = {}) {
    if (dialogueOuvert) return null;
    dialogueOuvert = true;
    let racine;
    try {
      racine = await chargerModele();
    } catch (erreur) {
      dialogueOuvert = false;
      throw erreur;
    }

    const titre = racine.querySelector("[data-lcdp-diginum-title]");
    const affichage = racine.querySelector("[data-lcdp-diginum-display]");
    const zoneMessage = racine.querySelector("[data-lcdp-diginum-message]");
    const boutonEffacer = racine.querySelector("[data-lcdp-diginum-effacer]");
    const boutonValider = racine.querySelector("[data-lcdp-diginum-valider]");
    const chiffres = Array.from(racine.querySelectorAll("[data-lcdp-diginum-digit]"));
    const boutons = Array.from(racine.querySelectorAll("button"));
    const carte = racine.querySelector(".lcdp-box-diginum__card");
    if (![titre, affichage, zoneMessage, boutonEffacer, boutonValider, carte].every(Boolean) || chiffres.length !== 10) {
      dialogueOuvert = false;
      throw new Error("Touches de l'objet Diginum incomplètes.");
    }

    titre.textContent = String(options.titre || "Saisir un code");
    affichage.placeholder = String(options.placeholder || "exemple 08");
    racine.querySelector("[data-lcdp-diginum-picto-effacer]").src = urlObjet("/IMAG/PICTO/07-diginum-effacer.svg");
    racine.querySelector("[data-lcdp-diginum-logo]").src = urlObjet("/IMAG/PICTO/07-diginum-valider.webp");

    const longueurMax = Number.isInteger(options.longueurMax) && options.longueurMax > 0 ? options.longueurMax : 6;
    const precedentFocus = document.activeElement;
    const html = document.documentElement;
    const ancienOverflow = html.style.overflow;
    const corps = document.body;
    const ancienOverflowBody = corps.style.overflow;
    let code = "";
    let verificationEnCours = false;
    let ferme = false;
    let resoudre;
    const resultat = new Promise(resolve => { resoudre = resolve; });

    function montrerMessage(message) {
      zoneMessage.textContent = String(message || "");
      zoneMessage.hidden = !message;
    }
    function fermer(valeur) {
      if (ferme) return;
      ferme = true;
      document.removeEventListener("keydown", clavier, true);
      racine.remove();
      html.style.overflow = ancienOverflow;
      corps.style.overflow = ancienOverflowBody;
      dialogueOuvert = false;
      if (precedentFocus instanceof HTMLElement && document.contains(precedentFocus)) precedentFocus.focus({ preventScroll: true });
      resoudre(valeur);
    }
    async function valider() {
      if (ferme || verificationEnCours) return;
      if (!code) { montrerMessage("Saisissez un code."); return; }
      verificationEnCours = true;
      boutons.forEach(bouton => { bouton.disabled = true; });
      racine.setAttribute("aria-busy", "true");
      montrerMessage("");
      try {
        const message = typeof options.verifier === "function" ? await options.verifier(code) : null;
        if (ferme) return;
        if (message) { montrerMessage(String(message)); return; }
        fermer(code);
      } catch (erreur) {
        if (!ferme) montrerMessage(erreur?.message || "Vérification indisponible. Réessayez.");
      } finally {
        verificationEnCours = false;
        racine.removeAttribute("aria-busy");
        if (!ferme) boutons.forEach(bouton => { bouton.disabled = false; });
      }
    }
    function ajouter(chiffre) {
      if (ferme || verificationEnCours || code.length >= longueurMax) return;
      code += chiffre;
      affichage.value = code;
      montrerMessage("");
      if (typeof options.autoValider === "function" && options.autoValider(code) === true) void valider();
    }
    function effacer() {
      if (ferme || verificationEnCours) return;
      code = code.slice(0, -1);
      affichage.value = code;
      montrerMessage("");
    }
    function clavier(event) {
      if (ferme) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); fermer(null); return; }
      // Ne jamais afficher le clavier natif : la saisie utilise les touches de la box.
      if (/^\d$/.test(event.key) || event.key === "Backspace") {
        event.preventDefault(); event.stopPropagation(); return;
      }
      if (event.key === "Tab") {
        const actifs = boutons.filter(bouton => !bouton.disabled);
        if (!actifs.length) { event.preventDefault(); return; }
        const index = actifs.indexOf(document.activeElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); actifs[actifs.length - 1].focus(); }
        else if (!event.shiftKey && index === actifs.length - 1) { event.preventDefault(); actifs[0].focus(); }
      }
    }

    chiffres.forEach(bouton => bouton.addEventListener("click", () => ajouter(bouton.dataset.lcdpDiginumDigit)));
    boutonEffacer.addEventListener("click", effacer);
    boutonValider.addEventListener("click", () => { void valider(); });
    racine.addEventListener("click", event => { if (event.target === racine) fermer(null); });
    document.addEventListener("keydown", clavier, true);
    document.body.appendChild(racine);
    html.style.overflow = "hidden";
    corps.style.overflow = "hidden";
    carte.focus({ preventScroll: true });
    return resultat;
  }

  window.LCDP_diginum = Object.freeze({ ouvrir });
})();
