(() => {
  "use strict";
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialiserCode);
  else initialiserCode();

  async function initialiserCode() {
    appliquerRoutesSite(document);
    initialiserBandeauRestreint().catch(() => {});
    initialiserFooter().catch(() => {});
    const type = document.body.dataset.codeType;
    let token = String(window.LCDP_CODE_TOKEN || "");
    delete window.LCDP_CODE_TOKEN;
    const form = document.getElementById("formulaire-code-securite");
    const bouton = document.getElementById("bouton-valider-code");
    const message = document.getElementById("message-code");
    const saisie = [...document.querySelectorAll("[data-code-value]")];
    const confirmation = [...document.querySelectorAll("[data-code-confirmation]")];
    const endpoint = nettoyerBaseUrl(window.SITE_CONFIG?.workerMdptokenzUrl || window.SITE_CONFIG?.WORKER_MDPTOKENZ_URL ||
      (typeof window.SITE_CONFIG?.apiUrl === "function" ? window.SITE_CONFIG.apiUrl("mdptokenz-api") : ""));
    let enCours = false, autorise = false;
    const normaliser = v => type === "coda" ? v : v.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const afficher = texte => { message.textContent = texte; };
    const etat = actif => { [...saisie, ...confirmation].forEach(champ => { champ.disabled = !actif; }); bouton.disabled = !actif; };
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
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, type, token, ...valeurs }) });
      const resultat = await reponse.json().catch(() => null);
      if (!resultat) throw new Error("Le service est momentanément indisponible.");
      return { reponse, resultat };
    }
    if (!endpoint || !/^[a-f0-9]{64}$/.test(token) || !["coda","codr"].includes(type)) {
      afficher("Ouvrez cette page depuis le lien reçu par e-mail."); return;
    }
    try {
      const { reponse, resultat } = await appeler("setup-status");
      if (!reponse.ok || !resultat.success) {
        afficher(resultat.message || "Le lien est invalide ou expiré."); return;
      }
      autorise = true; etat(true); afficher("Choisissez votre code, puis confirmez-le.");
    } catch { afficher("La vérification est indisponible. Rouvrez le lien reçu par e-mail pour réessayer."); }
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (enCours || !autorise) return;
      const valeurs = saisie.map(champ => normaliser(champ.value));
      const confirmations = confirmation.map(champ => normaliser(champ.value));
      const format = type === "coda" ? /^[0-9]$/ : /^[A-Z]{4}$/;
      if (valeurs.some(v => !format.test(v))) { afficher(type === "coda" ? "Saisissez les quatre chiffres." : "Saisissez quatre mots de quatre lettres."); return; }
      if (valeurs.some((v,i) => v !== confirmations[i])) { afficher("La confirmation ne correspond pas. Vérifiez la saisie et l’ordre."); return; }
      if (valeurs.some(v => valeurs.filter(x => x === v).length > 2)) { afficher(type === "coda" ? "Un même chiffre apparaît au maximum deux fois." : "Répétition d'un même mot autorisée une fois."); return; }
      if (type === "coda" && valeurs[0] === valeurs[2] && valeurs[1] === valeurs[3]) {
        afficher("La même paire de chiffres ne peut pas être répétée."); return;
      }
      if (type === "coda" && valeurs.some((v,i) => i < 3 && Math.abs(Number(v) - Number(valeurs[i+1])) === 1)) {
        afficher("Deux chiffres côte à côte ne doivent pas se suivre, dans un sens ou dans l’autre."); return;
      }
      enCours = true; etat(false);
      try {
        const { reponse, resultat } = await appeler("setup-save", type === "coda" ? { coda: valeurs.join("") } : { mots: valeurs });
        if (!reponse.ok || !resultat.success) {
          afficher(resultat.message || "Le code n’a pas pu être enregistré.");
          if (![400,409,503].includes(reponse.status)) etat(true);
          else autorise = false;
          return;
        }
        token = ""; autorise = false;
        [...saisie,...confirmation].forEach(champ => { champ.value = ""; });
        afficher(type === "coda" ? "Votre code d’accès (CODA) est enregistré." : "Votre code de récupération (CODR) est enregistré.");
      } catch { afficher("La réponse n’a pas pu être confirmée. Rouvrez le lien reçu par e-mail pour vérifier si le code a été enregistré."); autorise = false; }
      finally { enCours = false; }
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

    const footer = await chargerFragmentObjet("/BOX/02-box-footer.html");
    slot.appendChild(footer);

    appliquerRoutesSite(slot);
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
      const fragment = await chargerFragmentObjet("/BOX/02-box-alerte.html");
      slot.appendChild(fragment);

      const alerte = slot.querySelector("[data-lcdp-box-alerte]");
      const messageElement = slot.querySelector("[data-lcdp-alerte-message]");
      const boutonFermer = slot.querySelector("[data-lcdp-alerte-close]");
      const boutonOk = slot.querySelector("[data-lcdp-alerte-ok]");

      if (!alerte || !messageElement || !boutonFermer || !boutonOk) {
        throw new Error("Structure de l'alerte V3 incomplète.");
      }

      messageElement.textContent = titre && message
        ? titre + " — " + message
        : titre || message || "";

      await new Promise((resolve) => {
        const fermer = () => {
          slot.innerHTML = "";
          resolve();
        };

        boutonFermer.addEventListener("click", fermer, { once: true });
        boutonOk.addEventListener("click", fermer, { once: true });

        alerte.addEventListener("click", (event) => {
          if (event.target === alerte) {
            fermer();
          }
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
