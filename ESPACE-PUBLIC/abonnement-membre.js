(() => {
  "use strict";

  window.SITE_BASE = window.SITE_CONFIG?.publicBaseUrl || window.SITE_CONFIG?.siteBase || "";
  const siteBase = String(window.SITE_BASE || "").replace(/\/+$/, "");
  let controleDaNumero = 0;
  let statutDaSouscription = "inconnu";

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
        script.src = urlMembre("/ESPACE-MEMBRE/da-membre.js?v=20261126-affichage-atomique");
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
  // Le bouton reste orange ; seul l’accès au tunnel dépend du statut DA.
  async function actualiserDroitSouscription() {
    const bouton = document.getElementById("lcdp-demarrer-abonnement");
    if (!bouton) return;
    const numero = ++controleDaNumero;
    bouton.dataset.daValidee = "false";
    statutDaSouscription = "inconnu";
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
      if (reponse.ok && (data?.ok === true || data?.success === true) &&
          Object.prototype.hasOwnProperty.call(data, "statuda")) {
        const statut = String(data.statuda || "").trim().toLowerCase();
        statutDaSouscription = ["oui", "non", "encours"].includes(statut) ? statut : statut === "" ? null : "inconnu";
      }
      bouton.dataset.daValidee = String(statutDaSouscription === "oui");
    } catch (error) {
      if (numero === controleDaNumero) bouton.dataset.daValidee = "false";
      console.warn("Statut DA non vérifiable :", error);
    }
  }

  async function ouvrirInformationSouscription() {
    const slot = document.getElementById("lcdp-lightbox-slot");
    const elementActif = document.activeElement;
    slot.replaceChildren(await chargerFragment("/OBJET/HTMLBASE/02-dialogue-reference-choix.html"));
    const dialogue = slot.querySelector('[data-lcdp-dialogue-reference="choix"]');
    if (!dialogue) throw new Error("Dialogue CHOIX indisponible.");
    dialogue.dataset.lcdpDialogueContext = "conteneur";
    dialogue.querySelector("[data-lcdp-dialogue-titre]").textContent = "Droit d’abonnement (DA) nécessaire";
    dialogue.querySelector("[data-lcdp-dialogue-message]").textContent =
      statutDaSouscription === null ? "Vous ne disposez pas encore d'un droit d'abonnement."
        : statutDaSouscription === "inconnu" ? "Votre droit d'abonnement doit être validé pour souscrire."
        : "Vous ne disposez pas actuellement d'un droit d'abonnement.";
    const annuler = dialogue.querySelector('[data-lcdp-dialogue-action="annuler"]');
    const confirmer = dialogue.querySelector('[data-lcdp-dialogue-action="confirmer"]');
    if (!annuler || !confirmer) throw new Error("Actions CHOIX introuvables.");
    annuler.textContent = "Annuler";
    confirmer.textContent = "Faire ma demande";
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
        (document.activeElement === annuler ? confirmer : annuler).focus();
      }
    };
    document.addEventListener("keydown", gererClavier);
    annuler.addEventListener("click", fermer, { once: true });
    confirmer.addEventListener("click", () => {
      const lienDa = document.getElementById("lcdp-ouvrir-da-abonnement");
      fermer();
      lienDa?.click();
    }, { once: true });
    dialogue.addEventListener("click", event => {
      if (event.target === dialogue) fermer();
    });
    annuler.focus();
  }

  // Plaquette commerciale : les noms et capacités sont lus dans les pivots
  // applicables. Seules les fenêtres de vente/démarrage et le Duo de base sont fixes.
  const CALENDRIER_OFFRES = {
    "1J": ["1 jour", "Démarrage le jour choisi · M à M+2", "Souscription chaque mois"],
    "1M": ["1 mois", "Démarrage le 1er du mois · M+1 ou M+2", "Souscription chaque mois"],
    "3M": ["3 mois", "Démarrage le 1er du mois · M+1 à M+3", "Souscription chaque mois"],
    "5M": ["5 mois", "Démarrage le 1er du mois · M+1 à M+4", "Souscription chaque mois"],
    "1A": ["12 mois", "Démarrage le 1er janvier", "Souscription de juillet à décembre"],
    "11M": ["11 mois", "Démarrage le 1er février", "Souscription en janvier"],
    "10M": ["10 mois", "Démarrage le 1er mars", "Souscription en février"]
  };
  async function chargerOffresAbonnements(dialogue) {
    const etat = dialogue.querySelector(".lcdp-offre-abonnement__etat");
    const scroll = dialogue.querySelector(".lcdp-offre-abonnement__scroll");
    const corps = scroll.querySelector(".lcdp-offre-abonnement__liste");
    const config = window.SITE_CONFIG || {};
    const base = String(config.workerAboRezaUrl || config.WORKER_ABOREZA_URL ||
      (typeof config.apiUrl === "function" ? config.apiUrl("aboreza-api") : "https://aboreza-api.lacleduparc.fr")).replace(/\/+$/, "");
    try {
      const r = await fetch(base + "/offres-abonnements", {credentials:"omit", cache:"no-store", signal:AbortSignal.timeout(15000), headers:{Accept:"application/json"}});
      const data = await r.json();
      if (!r.ok || data?.ok !== true || !Array.isArray(data.offres)) throw new Error("Offres indisponibles.");
      const parCode = new Map();
      for (const o of data.offres) {
        if (!Object.hasOwn(CALENDRIER_OFFRES,o.groupeabo) || parCode.has(o.groupeabo) ||
          typeof o.nomabo !== "string" || !o.nomabo.trim() ||
          !Number.isInteger(o.maxduo) || o.maxduo < 1 || !Number.isInteger(o.famille) || o.famille < 0) throw new Error("Offre incohérente.");
        parCode.set(o.groupeabo,o);
      }
      const fragment = document.createDocumentFragment();
      for (const [code,[duree,debut,detail]] of Object.entries(CALENDRIER_OFFRES)) {
        const o = parCode.get(code);
        if (!o) continue;
        const creer = (tag, classe, valeur, role) => {
          const el = document.createElement(tag);
          if (classe) el.className = "lcdp-offre-abonnement__" + classe;
          if (valeur != null) el.textContent = String(valeur);
          if (role) el.setAttribute("role", role);
          return el;
        };
        const ligne = creer("div","ligne",null,"row");
        const abo = creer("div","abonnement",null,"rowheader");
        const identite = creer("div","identite");
        identite.append(creer("span","nom",o.nomabo.toLocaleUpperCase("fr-FR")),creer("span","code","("+code+")"));
        abo.append(identite,creer("span","duree",duree));
        const debutCell = creer("div","demarrage",null,"cell");
        debutCell.append(creer("span","debut",debut),creer("span","detail",detail));
        const privileges = creer("div","privileges",null,"presentation");
        const quotas = creer("div","quotas",null,"presentation");
        const labels = ["Duo","Famille","MaxDuo"];
        const valeurs = [1,o.famille,o.maxduo];
        quotas.append(creer("span","libelle-vide",null,"presentation"));
        labels.forEach(label=>quotas.append(creer("span","label-mobile",label,"columnheader")));
        quotas.append(creer("span","libelle","Invité par accès","rowheader"));
        valeurs.forEach((valeur,i)=>{
          const cellule = creer("div","quota",null,"cell");
          cellule.setAttribute("aria-label",labels[i]+" : "+valeur+(i===2?" invités Duo différents sur la durée":" invité(s) par accès"));
          cellule.append(creer("span","badge",valeur));
          quotas.append(cellule);
        });
        // Possibilité de principe, pas une confirmation de disponibilité commerciale.
        const libelleExtension = creer("span","libelle","Extension abonnement","rowheader");
        libelleExtension.classList.add("lcdp-offre-abonnement__extension");
        quotas.append(libelleExtension);
        labels.forEach(label=>{
          const cellule = creer("span","extension","Oui","cell");
          cellule.setAttribute("aria-label","Extension "+label+" : oui, selon les offres disponibles");
          quotas.append(cellule);
        });
        privileges.append(quotas);
        ligne.append(abo,debutCell,privileges);
        fragment.append(ligne);
      }
      if (!parCode.size) {etat.textContent="Aucune offre en vigueur.";return;}
      corps.replaceChildren(fragment);scroll.hidden=false;
      etat.hidden=true;
    } catch (error) {
      etat.textContent="Les offres sont momentanément indisponibles. Merci de réessayer.";
      scroll.hidden=true;
      console.warn("Offres non disponibles :",error);
    }
  }

  function initialiserTableauxAbonnements() {
    const lien = document.getElementById("lcdp-afficher-tableaux-abonnements");
    const contenu = document.getElementById("lcdp-tableaux-abonnements");
    const slot = document.getElementById("lcdp-lightbox-slot");
    if (!lien || !contenu || !slot) return;
    let chargement = false;
    lien.addEventListener("click", async event => {
      event.preventDefault();
      if (chargement || slot.children.length) return;
      chargement = true;
      lien.setAttribute("aria-busy", "true");
      let dialogue, clavier, etats = [];
      const clore = () => {
        if (clavier) document.removeEventListener("keydown", clavier);
        dialogue?.remove();
        etats.forEach(([element, inert]) => { element.inert = inert; });
        lien.setAttribute("aria-expanded", "false");
        lien.focus();
      };
      try {
        const fragment = await chargerFragment("/OBJET/HTMLBASE/02-dialogue-reference-information.html");
        dialogue = fragment.querySelector('[data-lcdp-dialogue-reference="information"]');
        const titre = dialogue?.querySelector("[data-lcdp-dialogue-titre]");
        const message = dialogue?.querySelector("[data-lcdp-dialogue-message]");
        const fermer = dialogue?.querySelector('[data-lcdp-dialogue-action="compris"]');
        if (!dialogue || !titre || !message || !fermer) throw new Error("Dialogue INFORMATION incomplet.");
        dialogue.dataset.lcdpDialogueContext = "conteneur";
        dialogue.classList.add("lcdp-offre-abonnement__dialogue");
        dialogue.setAttribute("role", "dialog");
        dialogue.removeAttribute("aria-describedby");
        dialogue.querySelector(".lcdp-dialogue-ref__icone")?.remove();
        titre.textContent = "Offre des abonnements";
        message.replaceWith(contenu.content.cloneNode(true));
        await chargerOffresAbonnements(dialogue);
        if (slot.children.length) return;
        fermer.closest(".lcdp-dialogue-ref__actions")?.remove();
        fermer.remove();
        const croix = document.createElement("button");
        croix.type = "button";
        croix.className = "lcdp-box-dialogue-bouton__close";
        croix.setAttribute("aria-label", "Fermer");
        croix.textContent = "×";
        dialogue.appendChild(croix);
        croix.addEventListener("click", clore, { once: true });
        const souscrireOffre = dialogue.querySelector("[data-lcdp-offre-souscrire]");
        souscrireOffre?.addEventListener("click", () => {
          const souscrire = document.getElementById("lcdp-demarrer-abonnement");
          clore();
          souscrire?.click();
        });
        dialogue.addEventListener("click", event => { if (event.target === dialogue) clore(); });
        clavier = event => {
          if (event.key === "Escape") { event.preventDefault(); clore(); }
          else if (event.key === "Tab") {
            event.preventDefault();
            const scroll = dialogue.querySelector(".lcdp-offre-abonnement__scroll:not([hidden])");
            const cibles = [croix,scroll,scroll ? souscrireOffre : null].filter(Boolean);
            const i = cibles.indexOf(document.activeElement);
            cibles[(i + (event.shiftKey ? -1 : 1) + cibles.length) % cibles.length].focus();
          }
        };
        etats = Array.from(slot.parentElement.children)
          .filter(element => element !== slot && element.tagName !== "TEMPLATE")
          .map(element => [element, element.inert]);
        slot.replaceChildren(fragment);
        etats.forEach(([element]) => { element.inert = true; });
        lien.setAttribute("aria-expanded", "true");
        document.addEventListener("keydown", clavier);
        croix.focus();

      } catch (error) {
        clore();
        console.error("Offre des abonnements indisponible :", error);
      } finally { chargement = false; lien.removeAttribute("aria-busy"); }
    });
  }

  function initialiserExemplesAbonnements() {
    const racine = document.getElementById("lcdp-exemples-abonnements");
    if (!racine || typeof window.LCDP_FAQ?.afficher !== "function") return;
    const blocs = ["1J", "1M", "1A"].map(code => ({
      titre: "Abonnement " + code,
      html: document.getElementById("lcdp-exemple-" + code).innerHTML
    }));
    window.LCDP_FAQ.afficher(racine, blocs, { ouvrirPremier: false });
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

    actualiserDroitSouscription();
    window.addEventListener("pageshow", actualiserDroitSouscription);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) actualiserDroitSouscription();
    });
  }

  appliquerRoutesSite(document);
  initialiserTableauxAbonnements();
  initialiserExemplesAbonnements();
  initialiserActionsMembre();
  const navigationPrete = Promise.allSettled([
    initialiserBandeau(), initialiserFooter()
  ]).then(resultats => {
    for (const resultat of resultats) {
      if (resultat.status === "rejected") console.error(resultat.reason);
    }
  });

  // Le mode DA garde le pictogramme d'attente jusqu'à la vue complète.
  if (new URLSearchParams(window.location.search).get("mode") === "da") {
    Promise.all([ouvrirDaDepuisPresentation(), navigationPrete]).then(() => {
      if (!document.querySelector("#lcdp-da-membre-overlay-slot .lcdp-document-legal")) {
        throw new Error("Présentation DA non montée.");
      }
      window.LCDP_terminerInitialisationDa?.(true);
    }).catch(error => {
      console.error("Ouverture de la DA impossible :", error);
      window.LCDP_terminerInitialisationDa?.(false);
    });
  }
})();
