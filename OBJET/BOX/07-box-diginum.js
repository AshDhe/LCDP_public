/* OBJET 07-box-diginum — pavé numérique réutilisable. */
(() => {
  "use strict";

  let dialogueOuvert = false;

  const SECOURS_EFFACER = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20aria-hidden%3D%22true%22%3E%0A%20%20%3Cpath%20d%3D%22M9%204H19a2%202%200%200%201%202%202v12a2%202%200%200%201-2%202H9l-7-8%207-8Z%22%20stroke%3D%22%23242a2d%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%20%20%3Cpath%20d%3D%22m11%209%206%206m0-6-6%206%22%20stroke%3D%22%23242a2d%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3C%2Fsvg%3E%0A';
  const SECOURS_VALIDER = 'data:image/webp;base64,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';

  // Les pictogrammes se trouvent avec le composant dans OBJET/BOX.
  // L'URL du script fournit leur emplacement exact sur le domaine OBJET.
  const urlScript = document.currentScript?.src || null;


  function urlObjet(chemin) {
    if (typeof window.LCDP_urlObjet === "function") return window.LCDP_urlObjet(chemin);
    const base = String(window.LCDP_OBJET_BASE || "").replace(/\/+$/, "");
    return base + "/" + String(chemin || "").replace(/^\/+/, "");
  }

  function urlPicto(nomFichier) {
    const chemin = "/BOX/" + nomFichier;
    return urlScript ? new URL(nomFichier, urlScript).href : urlObjet(chemin);
  }

  // Si le fichier n'est pas encore servi par le CDN, l'icône reste visible.
  function installerPicto(image, nomFichier, secours) {
    if (!image) return;
    image.addEventListener("error", () => {
      image.src = secours;
    }, { once: true });
    image.src = urlPicto(nomFichier);
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
    installerPicto(
      racine.querySelector("[data-lcdp-diginum-picto-effacer]"),
      "07-diginum-effacer.svg",
      SECOURS_EFFACER
    );
    installerPicto(
      racine.querySelector("[data-lcdp-diginum-logo]"),
      "07-diginum-valider.webp",
      SECOURS_VALIDER
    );

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
