(() => {
  "use strict";

  window.SITE_BASE = window.SITE_CONFIG?.publicBaseUrl || window.SITE_CONFIG?.siteBase || "";
  const siteBase = String(window.SITE_BASE || "").replace(/\/+$/, "");
  let controleDaNumero = 0;

  function construireUrlSite(chemin) {
    if (!chemin) return chemin;
    if (/^(?:#|mailto:|tel:|https?:|data:)/i.test(chemin)) return chemin;
    if (siteBase) return siteBase + "/" + String(chemin).replace(/^\/+/, "");
    return chemin.startsWith("/") ? ".." + chemin : chemin;
  }

  function appliquerRoutesSite(racine) {
    racine.querySelectorAll("[data-site-href]").forEach(element => {
      element.href = construireUrlSite(element.dataset.siteHref);
    });
    racine.querySelectorAll("[data-site-src]").forEach(element => {
      element.src = construireUrlSite(element.dataset.siteSrc);
    });
  }

  async function chargerFragment(chemin) {
    const reponse = await fetch(construireUrlSite(chemin), {
      method: "GET", credentials: "same-origin", cache: "no-cache"
    });
    if (!reponse.ok) throw new Error("Fragment introuvable : " + chemin);
    const template = document.createElement("template");
    template.innerHTML = (await reponse.text()).trim();
    return template.content.cloneNode(true);
  }

  function chargerScriptUneFois(chemin) {
    if (document.querySelector('script[data-lcdp-script="' + chemin + '"]')) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = construireUrlSite(chemin);
      script.dataset.lcdpScript = chemin;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Script introuvable : " + chemin));
      document.body.appendChild(script);
    });
  }

  async function ouvrirDialogueMonCompte() {
    const slot = document.getElementById("lcdp-lightbox-slot");
    slot.replaceChildren(await chargerFragment("/OBJET/HTMLBASE/02-dialogue-bouton.html"));
    const dialogue = slot.querySelector("[data-lcdp-box-dialogue-bouton]");
    dialogue.querySelector("[data-lcdp-dialogue-title]").textContent = "Mon compte";
    dialogue.querySelector("[data-lcdp-dialogue-text]").textContent = "Choisissez l’espace de connexion adapté à votre situation.";
    const actions = dialogue.querySelector("[data-lcdp-dialogue-actions]");
    [
      { label: "Me connecter", href: "/ESPACE-PUBLIC/connexion-membre.html", style: "lcdp-button-primary" },
      { label: "Être invité(e)", href: "/ESPACE-PUBLIC/inscription.html", style: "lcdp-button-secondary" }
    ].forEach(bouton => {
      const lien = document.createElement("a");
      lien.className = "lcdp-button " + bouton.style;
      lien.textContent = bouton.label;
      lien.href = construireUrlSite(bouton.href);
      actions.appendChild(lien);
    });
    const fermer = () => slot.replaceChildren();
    dialogue.querySelector("[data-lcdp-dialogue-close]").addEventListener("click", fermer);
    dialogue.addEventListener("click", event => {
      if (event.target === dialogue) fermer();
    });
  }

  window.LCDP_ouvrirDialogueMonCompte = ouvrirDialogueMonCompte;
  document.addEventListener("lcdp:ouvrir-dialogue-mon-compte", () => {
    ouvrirDialogueMonCompte().catch(console.error);
  });

  async function initialiserBandeau() {
    const slot = document.getElementById("lcdp-bandeau-slot");
    slot.replaceChildren(await chargerFragment("/ESPACE-PUBLIC/box-bandeau-nav-public.html"));
    appliquerRoutesSite(slot);
    await chargerScriptUneFois("/ESPACE-PUBLIC/box-menu-burger-public.js");
    if (typeof window.LCDP_initialiserMenuBurgerPublic === "function") {
      await window.LCDP_initialiserMenuBurgerPublic();
    }
  }

  async function initialiserFooter() {
    const slot = document.getElementById("lcdp-footer-slot");
    slot.replaceChildren(await chargerFragment("/OBJET/HTMLBASE/02-footer.html"));
    appliquerRoutesSite(slot);
  }

  function urlMembre(chemin) {
    const config = window.SITE_CONFIG || {};
    if (typeof config.membreUrl === "function") return config.membreUrl(chemin);
    const base = String(config.membreBaseUrl || config.MEMBRE_BASE || "").replace(/\/+$/, "");
    if (!base) throw new Error("L'espace membre n'est pas configuré.");
    return base + "/" + String(chemin).replace(/^\/+/, "");
  }

  async function ouvrirDaDepuisPresentation() {
    if (typeof window.LCDP_ouvrirPresentationDaMembre !== "function") {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = urlMembre("/ESPACE-MEMBRE/da-membre.js?v=20261125-gabarit-legal");
        script.onload = resolve;
        script.onerror = () => reject(new Error("Module DA membre indisponible."));
        document.body.appendChild(script);
      });
    }
    if (typeof window.LCDP_ouvrirPresentationDaMembre !== "function") {
      throw new Error("Module DA membre indisponible.");
    }
    await window.LCDP_ouvrirPresentationDaMembre();
  }

  // Le même service et la même valeur statuda que sur la page Abonnement membre.
  // Sans confirmation explicite "oui", le bouton reste visuellement indisponible.
  async function actualiserDroitSouscription() {
    const bouton = document.getElementById("lcdp-demarrer-abonnement");
    if (!bouton) return;
    const numero = ++controleDaNumero;
    bouton.dataset.daValidee = "false";
    const config = window.SITE_CONFIG || {};
    const baseApi = config.workerAboMembreUrl || config.WORKER_ABO_MEMBRE_URL ||
      (typeof config.apiUrl === "function" ? config.apiUrl("abo-membre-api") : "");
    if (!baseApi) return;

    try {
      const reponse = await fetch(String(baseApi).replace(/\/+$/, "") + "/mes-abonnements", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      const data = await reponse.json().catch(() => null);
      if (numero !== controleDaNumero) return;
      const daValidee = reponse.ok && (data?.ok === true || data?.success === true) &&
        String(data?.statuda || "").trim().toLowerCase() === "oui";
      bouton.dataset.daValidee = String(daValidee);
    } catch (error) {
      if (numero === controleDaNumero) bouton.dataset.daValidee = "false";
      console.warn("Statut DA non vérifiable :", error);
    }
  }

  async function ouvrirInformationSouscription() {
    const slot = document.getElementById("lcdp-lightbox-slot");
    const elementActif = document.activeElement;
    slot.replaceChildren(await chargerFragment("/OBJET/HTMLBASE/02-dialogue-reference-information.html"));
    const dialogue = slot.querySelector('[data-lcdp-dialogue-reference="information"]');
    if (!dialogue) throw new Error("Dialogue INFORMATION indisponible.");
    dialogue.querySelector("[data-lcdp-dialogue-titre]").textContent = "Souscription indisponible";
    dialogue.querySelector("[data-lcdp-dialogue-message]").textContent =
      "Vous ne pouvez pas souscrire actuellement.";
    const compris = dialogue.querySelector('[data-lcdp-dialogue-action="compris"]');
    if (!compris) throw new Error("Bouton de fermeture INFORMATION introuvable.");

    const fermer = () => {
      document.removeEventListener("keydown", gererClavier);
      slot.replaceChildren();
      if (elementActif?.isConnected && typeof elementActif.focus === "function") elementActif.focus();
    };
    const gererClavier = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        fermer();
      } else if (event.key === "Tab") {
        event.preventDefault();
        compris.focus();
      }
    };
    document.addEventListener("keydown", gererClavier);
    compris.addEventListener("click", fermer, { once: true });
    dialogue.addEventListener("click", event => {
      if (event.target === dialogue) fermer();
    });
    compris.focus();
  }

  function initialiserTableauxAbonnements() {
    const lien = document.getElementById("lcdp-afficher-tableaux-abonnements");
    const contenu = document.getElementById("lcdp-tableaux-abonnements");
    if (!lien || !contenu) return;
    lien.addEventListener("click", event => {
      event.preventDefault();
      const afficher = contenu.hidden;
      contenu.hidden = !afficher;
      lien.setAttribute("aria-expanded", String(afficher));
      lien.textContent = afficher
        ? "Masquer les formules et privilèges d’abonnement"
        : "Consulter les formules et privilèges d’abonnement";
      if (afficher) contenu.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }

  function initialiserActionsMembre() {
    const planifier = document.getElementById("lcdp-acces-planifier-abonnement");
    const souscrire = document.getElementById("lcdp-demarrer-abonnement");

    try {
      planifier.href = urlMembre("/ESPACE-MEMBRE/reserver-membre.html");
      souscrire.href = urlMembre("/ESPACE-MEMBRE/reserver-membre.html?mode=aboreza");
    } catch (error) {
      console.error(error);
      planifier.removeAttribute("href");
      souscrire.removeAttribute("href");
    }

    souscrire.addEventListener("click", event => {
      if (souscrire.dataset.daValidee !== "true" || !souscrire.hasAttribute("href")) {
        event.preventDefault();
        ouvrirInformationSouscription().catch(console.error);
      }
    });

    // Le lien DA ouvre un nouvel onglet ; la présentation s'initialise dans cet onglet.
    if (new URLSearchParams(window.location.search).get("mode") === "da") {
      ouvrirDaDepuisPresentation().catch(error => {
        console.error("Ouverture de la DA impossible :", error);
        window.alert("La demande d'abonnement est momentanément indisponible.");
      });
    }

    actualiserDroitSouscription();
    window.addEventListener("pageshow", actualiserDroitSouscription);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) actualiserDroitSouscription();
    });
  }

  appliquerRoutesSite(document);
  initialiserTableauxAbonnements();
  initialiserActionsMembre();
  initialiserBandeau().catch(console.error);
  initialiserFooter().catch(console.error);
})();
