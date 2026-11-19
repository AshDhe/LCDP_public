(() => {
  "use strict";

  window.SITE_BASE = window.SITE_CONFIG?.publicBaseUrl || window.SITE_CONFIG?.siteBase || "";
  const siteBase = String(window.SITE_BASE || "").replace(/\/+$/, "");

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
    if (typeof window.LCDP_ouvrirPremiereDaMembre !== "function") {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = urlMembre("/ESPACE-MEMBRE/da-membre.js");
        script.onload = resolve;
        script.onerror = () => reject(new Error("Module DA membre indisponible."));
        document.body.appendChild(script);
      });
    }
    if (typeof window.LCDP_ouvrirPremiereDaMembre !== "function") {
      throw new Error("Module DA membre indisponible.");
    }
    await window.LCDP_ouvrirPremiereDaMembre();
  }

  function initialiserActionsMembre() {
    const planifier = document.getElementById("lcdp-acces-planifier-abonnement");
    const souscrire = document.getElementById("lcdp-demarrer-abonnement");
    const boutonDa = document.getElementById("lcdp-ouvrir-da-abonnement");

    try {
      planifier.href = urlMembre("/ESPACE-MEMBRE/reserver-membre.html");
      souscrire.href = urlMembre("/ESPACE-MEMBRE/abonnement-membre.html?demarrer=1");
    } catch (error) {
      console.error(error);
      planifier.removeAttribute("href");
      souscrire.removeAttribute("href");
    }

    boutonDa.addEventListener("click", async () => {
      if (boutonDa.disabled) return;
      boutonDa.disabled = true;
      try {
        await ouvrirDaDepuisPresentation();
      } catch (error) {
        console.error("Ouverture de la DA impossible :", error);
        window.alert("La demande d'abonnement est momentanément indisponible.");
      } finally {
        boutonDa.disabled = false;
      }
    });
  }

  appliquerRoutesSite(document);
  initialiserActionsMembre();
  initialiserBandeau().catch(console.error);
  initialiserFooter().catch(console.error);
})();
