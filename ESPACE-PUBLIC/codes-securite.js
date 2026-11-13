(() => {
  "use strict";
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialiserCode);
  else initialiserCode();

  async function initialiserCode() {
    appliquerRoutesSite(document);
    const type = document.body.dataset.codeType;
    const flow = String(window.LCDP_SIGNUP_FLOW || "");
    delete window.LCDP_SIGNUP_FLOW;
    // Écran isolé : aucun bandeau ni footer, y compris hors inscription.
    // Présentation du tunnel uniquement ; aucune modification des règles de sécurité.
    if (flow && (type === "coda" || type === "codr")) {
      document.body.classList.add("lcdp-security-tunnel");
      document.body.dataset.securityStep = type === "coda" ? "1" : "2";
      const feuille = document.createElement("link");
      feuille.rel = "stylesheet";
      feuille.href = new URL("../OBJET/CSSBASE/securite-compte.css", location.href).href;
      document.head.appendChild(feuille);
      const entete = document.querySelector("#formulaire-code-securite .lcdp-box-formulaire__header");
      if (entete) {
        const titre = entete.querySelector(".lcdp-box-formulaire__title");
        const sousTitre = entete.querySelector(".lcdp-box-formulaire__subtitle");
        const progression = document.createElement("div");
        progression.className = "lcdp-step-progress";
        progression.style.setProperty("--lcdp-step-progress-value", type === "coda" ? "33.3333%" : "66.6667%");
        progression.setAttribute("role", "progressbar");
        progression.setAttribute("aria-valuemin", "0");
        progression.setAttribute("aria-valuemax", "3");
        progression.setAttribute("aria-valuenow", type === "coda" ? "1" : "2");
        progression.setAttribute("aria-label", "Progression de la sécurisation du compte");
        progression.innerHTML = '<span class="lcdp-step-progress__fill"></span>';
        if (titre) {
          const badge = document.createElement("span");
          badge.className = "lcdp-step-progress__badge";
          badge.textContent = type === "coda" ? "Étape 1 / 3" : "Étape 2 / 3";
          titre.after(badge);
        }
        if (sousTitre) sousTitre.before(progression);
      }
      const consignes = document.querySelector("#formulaire-code-securite > ul.lcdp-box-formulaire__note");
      if (consignes) {
        consignes.classList.add("lcdp-security-rules");
        const enteteRegles = document.createElement("li");
        enteteRegles.className = "lcdp-security-rules__heading";
        enteteRegles.textContent = type === "coda" ? "Consignes de sécurité" : "Règles du code de récupération";
        consignes.prepend(enteteRegles);
      }
      const valider = document.getElementById("bouton-valider-code");
      if (valider) {
        valider.classList.remove("lcdp-button-logo");
        valider.classList.add("lcdp-security-submit");
        valider.replaceChildren(document.createTextNode("Valider et continuer"));
        valider.setAttribute("aria-label", "Valider et continuer");
        valider.title = "Valider et continuer";
      }
      document.querySelectorAll("#formulaire-code-securite .lcdp-box-champ-formulaire--code input").forEach(champ => {
        champ.setAttribute("aria-autocomplete", "none");
      });
    }
    let token = String(window.LCDP_CODE_TOKEN || "");
    delete window.LCDP_CODE_TOKEN;
    const form = document.getElementById("formulaire-code-securite");
    const bouton = document.getElementById("bouton-valider-code");
    const message = document.getElementById("message-code");
    const attente = document.createElement("div");
    attente.className = "lcdp-setup-loading lcdp-attente-plein-ecran";
    attente.hidden = true;
    attente.setAttribute("role", "status");
    attente.setAttribute("aria-live", "polite");
    attente.setAttribute("aria-label", "Traitement en cours");
    attente.innerHTML = '<div class="lcdp-loading-spinner" aria-hidden="true"><svg class="lcdp-loading-spinner__track" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></circle></svg><svg class="lcdp-loading-spinner__arc" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="75"></circle></svg><span class="lcdp-loading-spinner__dot"></span></div><span class="lcdp-setup-loading__text" hidden aria-hidden="true"></span>';
    document.body.appendChild(attente);
    const afficherAttente = (actif, texte = "Validation en cours…") => {
      attente.querySelector(".lcdp-setup-loading__text").textContent = texte;
      attente.hidden = !actif;
    };
    const saisie = [...document.querySelectorAll("[data-code-value]")];
    const confirmation = [...document.querySelectorAll("[data-code-confirmation]")];
    const endpoint = nettoyerBaseUrl(window.SITE_CONFIG?.workerMdptokenzUrl || window.SITE_CONFIG?.WORKER_MDPTOKENZ_URL ||
      (typeof window.SITE_CONFIG?.apiUrl === "function" ? window.SITE_CONFIG.apiUrl("mdptokenz-api") : ""));
    let enCours = false, autorise = false;
    const normaliser = v => v;
    const afficher = texte => { message.textContent = texte; };
    const etat = actif => { [...saisie, ...confirmation].forEach(champ => { champ.disabled = !actif; }); bouton.disabled = !actif; };
    if(flow) {
      const titre=document.querySelector(".lcdp-box-formulaire__title");
      if(titre) {
        const instruction=document.createElement("small");
        instruction.textContent=type==="coda"?"Démarrer - 1/3":"Continuer - 2/3";
        titre.replaceChildren(document.createTextNode("Sécurité de votre compte"),document.createElement("br"),instruction);
      }
      const sousTitre=document.querySelector(".lcdp-box-formulaire__subtitle");
      if(sousTitre) sousTitre.textContent=type==="coda"?"CODA — Définir votre code d’accès":"CODR — Définir votre code de récupération";
      const note=document.getElementById("note-creation-code");
      if(note) note.textContent=type==="coda"
        ?"Conservez votre CODA. Il vous est demandé à l’étape de sécurité 3/3."
        :"Conservez votre CODR dans un endroit sûr et confidentiel, ainsi que votre CODA. Votre CODR sert à la récupération de votre compte. Ne partagez pas ces codes.";
      if(note && type==="coda") {
        const actions=bouton.closest(".lcdp-box-formulaire__actions");
        if(actions) actions.before(note);
      }
    }
    let operation = "creation";
    async function erreurSaisie(detail) {
      enCours=true;
      try { await afficherInformation("", "Votre code n’est pas conforme à ce qui est demandé. " + detail, "erreur"); }
      finally { enCours=false; saisie[0].focus(); }
    }
    etat(false);
    document.getElementById("afficher-code").addEventListener("change", event => {
      [...saisie,...confirmation].forEach(champ => { champ.type = event.target.checked ? "text" : "password"; });
    });
    for (const groupe of [saisie,confirmation]) groupe.forEach((champ,i) => {
      if (type === "coda") champ.addEventListener("input", () => {
        champ.value = champ.value.replace(/[^0-9]/g, "").slice(-1);
        if (champ.value && i < 3) groupe[i+1].focus();
      });
      champ.addEventListener("keydown", event => {
        if (event.key === "Backspace" && !champ.value && i > 0) groupe[i-1].focus();
      });
    });
    async function appeler(action, valeurs = {}) {
      const reponse = await fetch(endpoint, { method: "POST", credentials: "omit", cache: "no-store",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, type, token, ...(flow?{flow}:{}), ...valeurs }) });
      const resultat = await reponse.json().catch(() => null);
      if (!resultat) throw new Error("Le service est momentanément indisponible.");
      return { reponse, resultat };
    }
    if (!endpoint || !/^[a-f0-9]{64}$/.test(token) || !["coda","codr"].includes(type)) {
      await afficherInformation("", "Ouvrez cette page depuis le lien reçu par e-mail.", "erreur"); return;
    }
    afficherAttente(true, "Vérification de votre parcours…");
    try {
      if(flow) {
        const state=await appeler("flow-state");
        if(!state.reponse.ok||!state.resultat.success) throw new Error("Parcours expiré.");
        if(state.resultat.stage!==type) { window.location.replace(state.resultat.nextUrl); return; }
      }
      const { reponse, resultat } = await appeler("setup-status");
      if (!reponse.ok || !resultat.success) {
        await afficherInformation("", resultat.message || "Le lien est invalide ou expiré.", "erreur"); return;
      }
      operation = resultat.operation || "creation";
      if (operation === "modification") {
        const titre=document.querySelector(".lcdp-box-formulaire__title");
        if (titre) titre.textContent="Modifier le code d’accès (CODA)";
        const note=document.getElementById("note-creation-code");
        if (note) note.textContent="Gardez ce code personnel. Ce lien sert uniquement à la modification autorisée de votre CODA.";
      }
      autorise = true; etat(true); afficher("Choisissez votre code, puis confirmez-le avec le bouton La Clé.");
    } catch { await afficherInformation("", "La vérification est indisponible. Rouvrez le lien reçu par e-mail pour réessayer.", "erreur"); }
    finally { afficherAttente(false); }
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (enCours || !autorise) return;
      const valeurs = saisie.map(champ => normaliser(champ.value));
      const confirmations = confirmation.map(champ => normaliser(champ.value));
      const format = type === "coda" ? /^[0-9]$/ : /^[A-Z]{4}$/;
      if (valeurs.some(v => !format.test(v))) { await erreurSaisie(type === "coda" ? "Saisissez les quatre chiffres." : "Saisissez quatre mots de quatre lettres, en majuscules et sans accent."); return; }
      if (valeurs.some((v,i) => v !== confirmations[i])) { await erreurSaisie("La confirmation ne correspond pas. Vérifiez la saisie et l’ordre."); return; }
      if (valeurs.some(v => valeurs.filter(x => x === v).length > 2)) { await erreurSaisie(type === "coda" ? "Un même chiffre apparaît au maximum deux fois." : "Répétition d'un même mot autorisée une fois."); return; }
      if (type === "coda" && valeurs[0] === valeurs[2] && valeurs[1] === valeurs[3]) {
        await erreurSaisie("La même paire de chiffres ne peut pas être répétée."); return;
      }
      if (type === "coda" && valeurs.some((v,i) => i < 3 && Math.abs(Number(v) - Number(valeurs[i+1])) === 1)) {
        await erreurSaisie("Deux chiffres côte à côte ne doivent pas se suivre, dans un sens ou dans l’autre."); return;
      }
      enCours = true; etat(false); afficherAttente(true);
      try {
        const { reponse, resultat } = await appeler("setup-save", type === "coda" ? { coda: valeurs.join("") } : { mots: valeurs });
        if (!reponse.ok || !resultat.success) {
          await afficherInformation("",resultat.message || "Le code n’a pas pu être enregistré.","erreur");
          if (![400,409,503].includes(reponse.status)) etat(true);
          else autorise = false;
          return;
        }
        if(flow && resultat.nextUrl) {
          token="";autorise=false;
          [...saisie,...confirmation].forEach(champ=>{champ.value="";});
          window.location.replace(resultat.nextUrl);
          return;
        }
        token = ""; autorise = false;
        [...saisie,...confirmation].forEach(champ => { champ.value = ""; });
        const nom=type==="coda"?"CODA":"CODR";
        const texte=operation==="modification" ? "Votre CODA est mis à jour. Vous pouvez vous reconnecter à votre compte." : "Votre " + nom + " est enregistré. Retrouvez les informations relatives à vos codes de sécurité depuis votre page Mon Compte dans l’application.";
        await afficherInformation("",texte,"information",construireUrlPublique("/ESPACE-PUBLIC/hello.html"));
      } catch { autorise = false; await afficherInformation("","La réponse n’a pas pu être confirmée. Rouvrez le lien reçu par e-mail pour vérifier si le code a été enregistré.","erreur"); }
      finally { enCours = false; afficherAttente(false); }
    });
  }
  function appliquerRoutesSite(racine = document) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlPublique(element.dataset.siteHref));
    });

    racine.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlPublique(element.dataset.siteSrc));
    });

    racine.querySelectorAll("a[href^='/']").forEach((element) => {
      element.setAttribute("href", construireUrlPublique(element.getAttribute("href")));
    });

    racine.querySelectorAll("img[src^='/']").forEach((element) => {
      element.setAttribute("src", construireUrlPublique(element.getAttribute("src")));
    });
  }


  async function initialiserBandeauRestreint() {
    const slot = document.getElementById("lcdp-bandeau-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const fragment = await chargerFragmentSite("/ESPACE-PUBLIC/box-bandeau-nav-public.html");
    slot.appendChild(fragment);
    configurerBandeauRestreint(slot);
    appliquerRoutesSite(slot);
  }

  function configurerBandeauRestreint(slot) {
    const lien = slot.querySelector(".lcdp-box-bandeau-nav__logo-link");
    const libelle = slot.querySelector("[data-lcdp-bandeau-nav-label], .lcdp-box-bandeau-nav__space-label");
    const burgerSlot = slot.querySelector("[data-lcdp-burger-slot], .lcdp-box-bandeau-nav__burger-slot");

    if (lien) {
      lien.setAttribute("href", construireUrlPublique("/ESPACE-PUBLIC/hello.html"));
      lien.dataset.siteHref = "/ESPACE-PUBLIC/hello.html";
      lien.setAttribute("aria-label", "Accueil restreint La Clé du Parc");
    }

    if (libelle) {
      libelle.textContent = "";
      libelle.appendChild(document.createTextNode("La Clé du Parc |"));
      libelle.appendChild(document.createElement("br"));
      libelle.appendChild(document.createTextNode("Accueil restreint"));
    }

    if (burgerSlot) {
      burgerSlot.remove();
    }
  }


  async function initialiserFooter() {
  const slot = document.getElementById("lcdp-footer-slot");

  if (!slot) {
    return;
  }

  slot.innerHTML = "";

  const footer = await chargerFragmentObjet("/HTMLBASE/02-footer.html");
  slot.appendChild(footer);

  appliquerRoutesSite(slot);

  const lien = slot.querySelector('a[href*="mentions-legales.html"]');

  if (lien) {
    const url = new URL(lien.getAttribute("href"), document.baseURI);
    url.searchParams.set("source", window.location.pathname);

    lien.setAttribute("href", url.href);
    lien.setAttribute(
      "data-site-href",
      url.pathname + url.search + url.hash
    );
    lien.target = "_blank";
    lien.rel = "noopener noreferrer";
  }
}


  async function afficherInformation(titre, message, type = "information", redirectUrl = null) {
    const slot = document.getElementById("lcdp-lightbox-slot");

    if (!slot) {
      alert(message || titre);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }

      return;
    }

    slot.innerHTML = "";

    try {
      const information = type === "information";
      {
        const href = construireUrlObjet("/CSSBASE/lcdp-lightbox-convergence.css");
        if (!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link => link.href === new URL(href, document.baseURI).href)) {
          await new Promise((resolve, reject) => {
            const feuille = document.createElement("link");
            feuille.rel = "stylesheet";
            feuille.href = href;
            feuille.onload = resolve;
            feuille.onerror = () => { feuille.remove(); reject(new Error("CSS INFORMATION indisponible.")); };
            document.head.appendChild(feuille);
          });
        }
      }
      const fragment = await chargerFragmentObjet(information
        ? "/HTMLBASE/02-dialogue-reference-information.html"
        : "/HTMLBASE/02-dialogue-reference-erreur.html");
      slot.appendChild(fragment);

      const alerte = slot.querySelector(information
        ? '[data-lcdp-dialogue-reference="information"]'
        : '[data-lcdp-dialogue-reference="erreur"]');
      const messageElement = slot.querySelector("[data-lcdp-dialogue-message]");
      const titreElement = slot.querySelector("[data-lcdp-dialogue-titre]");
      const boutonOk = slot.querySelector(information
        ? '[data-lcdp-dialogue-action="compris"]'
        : '[data-lcdp-dialogue-action="fermer"]');

      if (!alerte || !messageElement || !titreElement || !boutonOk) {
        throw new Error("Structure du dialogue incomplète.");
      }

      titreElement.textContent = titre || (information ? "Information" : "Erreur");
      messageElement.textContent = message || "";
      boutonOk.textContent = "Fermer";

      await new Promise((resolve) => {
        const fermer = () => {
          slot.innerHTML = "";
          resolve();
        };

         boutonOk.addEventListener("click", () => {
           if (redirectUrl) { const a = document.querySelector(".lcdp-setup-loading"); if (a) { a.querySelector(".lcdp-setup-loading__text").textContent = "Ouverture de la page…"; a.hidden = false; } }
           fermer();
         }, { once: true });

      });

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }

    } catch (error) {
      console.error("Erreur alerte V3 :", error);

      alert(message || titre);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }
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

  function construireUrlObjet(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.objetUrl === "function") {
      return config.objetUrl(valeur);
    }

    const objetBaseUrl = nettoyerBaseUrl(
      config.objetBaseUrl ||
      config.OBJET_BASE ||
      ""
    );

    if (objetBaseUrl) {
      return joindreBaseEtChemin(objetBaseUrl, valeur.replace(/^\/?OBJET\//, ""));
    }

    return construireUrlPublique("/OBJET/" + valeur.replace(/^\/+/, "").replace(/^BOX\//, "BOX/"));
  }

  function construireUrlPublique(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.publicUrl === "function") {
      return config.publicUrl(valeur);
    }

    const publicBaseUrl = nettoyerBaseUrl(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    );

    if (publicBaseUrl) {
      return joindreBaseEtChemin(publicBaseUrl, valeur);
    }

    return valeur.startsWith("/") ? ".." + valeur : valeur;
  }

  function construireUrlMembre(chemin) {
    const valeur = String(chemin || "");

    if (urlTechniqueOuAbsolue(valeur)) {
      return valeur;
    }

    const config = window.SITE_CONFIG || {};

    if (typeof config.membreUrl === "function") {
      return config.membreUrl(valeur);
    }

    const membreBaseUrl = nettoyerBaseUrl(
      config.membreBaseUrl ||
      config.MEMBRE_BASE ||
      ""
    );

    if (membreBaseUrl) {
      return joindreBaseEtChemin(membreBaseUrl, valeur);
    }

    return valeur.startsWith("/") ? valeur : "/" + valeur;
  }

  function joindreBaseEtChemin(baseUrl, chemin) {
    const base = nettoyerBaseUrl(baseUrl);
    const cheminNettoye = "/" + String(chemin || "").replace(/^\/+/, "");

    if (!base) {
      return cheminNettoye;
    }

    return base + cheminNettoye;
  }

  function nettoyerBaseUrl(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function urlTechniqueOuAbsolue(value) {
    return (
      !value ||
      value.startsWith("#") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:")
    );
  }

})();