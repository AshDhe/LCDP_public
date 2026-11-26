(() => {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const souscrire = document.getElementById("lcdp-demarrer-abonnement") || document.getElementById("lcdp-boutique-abonnement");
  const listes = Array.from(document.querySelectorAll("[data-lcdp-boutique-liste]"));
  const don = document.getElementById("lcdp-boutique-don");
  const etatDon = document.getElementById("lcdp-boutique-don-etat");
  const bienfaiteur = document.getElementById("lcdp-boutique-bienfaiteur");

  const siteBase = String(window.SITE_CONFIG?.publicBaseUrl || "").replace(/\/+$/, "");
  let controleBoutiqueEnCours = false;

  // Vérification de session commune aux actions réservées aux membres.
  // Une erreur réseau ou une réponse inattendue ne signifie pas une déconnexion.
  async function lireSessionBoutique() {
    const base = config.workerIndexMembreUrl || config.WORKER_INDEX_MEMBRE_URL ||
      config.W_INDEX_MEMBRE_URL ||
      (typeof config.apiUrl === "function" ? config.apiUrl("index-membre-api") : "");
    if (!base) return "inconnu";
    try {
      const reponse = await fetch(String(base).replace(/\/+$/, "") + "/index", {
        method: "GET", credentials: "include", cache: "no-store",
        signal: AbortSignal.timeout(20000), headers: { Accept: "application/json" }
      });
      if (reponse.status === 401) return "connexion";
      const data = await reponse.json().catch(() => null);
      if (reponse.ok && data?.success === true) {
        if (data.connected === true) return data;
        if (data.connected === false) return "connexion";
      }
    } catch (error) {
      console.warn("Session boutique non vérifiable :", error);
    }
    return "inconnu";
  }

  // DFA : réutiliser le voile SVG de la boutique, sans spinner dans le bouton.
  const voileDfa = document.getElementById("lcdp-attente-arrivee");
  let delaiNavigationDfa;
  function attenteDfa(active) {
    if (voileDfa) voileDfa.hidden = !active;
    if (!active) window.clearTimeout(delaiNavigationDfa);
  }
  window.addEventListener("pageshow",event=>{
    if (event.persisted) { attenteDfa(false); controleBoutiqueEnCours=false; }
  });
  function protegerActionBoutique(bouton, action, transitionDfa = false) {
    if (!bouton) return;
    bouton.addEventListener("click", async event => {
      event.preventDefault();
      if (controleBoutiqueEnCours || document.getElementById("lcdp-lightbox-slot")?.children.length) return;
      controleBoutiqueEnCours = true;
      const ancienLabel = bouton.getAttribute("aria-label");
      let navigationDfa = false;
      if (transitionDfa) attenteDfa(true);
      else {
        bouton.setAttribute("aria-busy", "true");
        bouton.setAttribute("aria-label", "Vérification en cours");
      }
      try {
        const session = await lireSessionBoutique();
        if (session?.connected === true) navigationDfa = (await action(session)) === true && transitionDfa;
        else {
          if (transitionDfa) attenteDfa(false);
          await ouvrirDialogueBoutique({type: session === "connexion" ? "connexion" : "session-inconnue"});
        }
      } catch (error) {
        console.error("Contrôle boutique :", error);
        if (transitionDfa) attenteDfa(false);
        await ouvrirDialogueBoutique({type: "session-inconnue"}).catch(console.error);
      } finally {
        if (ancienLabel === null) bouton.removeAttribute("aria-label");
        else bouton.setAttribute("aria-label", ancienLabel);
        bouton.removeAttribute("aria-busy");
        if (navigationDfa) {
          // Maintenir le même voile jusqu'au changement de document.
          delaiNavigationDfa = window.setTimeout(()=>{attenteDfa(false);controleBoutiqueEnCours=false;},15000);
        } else {
          if (transitionDfa) attenteDfa(false);
          controleBoutiqueEnCours = false;
        }
      }
    });
  }

  function construireUrlSite(chemin) {
    if (!chemin) return chemin;
    if (/^(?:#|mailto:|tel:|https?:|data:)/i.test(chemin)) return chemin;
    if (chemin.startsWith("/ESPACE-MEMBRE/")) return urlMembre(chemin);
    if (chemin.startsWith("/OBJET/") && typeof window.SITE_CONFIG?.objetUrl === "function") {
      return window.SITE_CONFIG.objetUrl(chemin.slice("/OBJET".length));
    }
    if (siteBase) return siteBase + "/" + String(chemin).replace(/^\/+/, "");
    return chemin.startsWith("/") ? ".." + chemin : chemin;
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

  function urlMembre(chemin) {
    const config = window.SITE_CONFIG || {};
    if (typeof config.membreUrl === "function") return config.membreUrl(chemin);
    const base = String(config.membreBaseUrl || config.MEMBRE_BASE || "").replace(/\/+$/, "");
    if (!base) throw new Error("L'espace membre n'est pas configuré.");
    return base + "/" + String(chemin).replace(/^\/+/, "");
  }

  // Même contexte et mêmes conditions d'éligibilité que le worker DA.
  // Ne jamais assimiler une session absente ou une erreur réseau à une DA absente.
  function determinerSituationDa(data, maintenant = Date.now()) {
    if (!data || !Object.hasOwn(data, "statuda") || !Object.hasOwn(data, "daactive")) return { type: "inconnu" };
    const statut = String(data.statuda ?? "").trim().toLowerCase();
    if (!["", "oui", "non", "encours"].includes(statut) || ![true, false, null].includes(data.daactive)) return { type: "inconnu" };
    if (statut === "oui") return { type: "validee" };
    if (data.daactive === true && statut !== "encours" && statut !== "non") return { type: "inconnu" };
    if (data.daactive === true && statut === "encours") return { type: "encours" };
    if (data.daactive === false) {
      const date = data.datenext ? Date.parse(data.datenext) : NaN;
      if (Number.isFinite(date) && date <= maintenant) return { type: "renouvelable" };
      return { type: "refusee", date: Number.isFinite(date) ? date : null };
    }
    if (statut === "oui") return { type: "validee" };
    if (statut === "encours") return { type: "encours" };
    if (statut === "non") return { type: "refusee", date: null };
    return { type: "absente" };
  }

  async function lireSituationDaSouscription() {
    const config = window.SITE_CONFIG || {};
    const base = config.workerDaMembreUrl || config.WORKER_DA_MEMBRE_URL ||
      (typeof config.apiUrl === "function" ? config.apiUrl("da-membre-api") : "");
    if (!base) return { type: "inconnu" };
    try {
      const reponse = await fetch(String(base).replace(/\/+$/, "") + "/contexte", {
        method: "GET", credentials: "include", cache: "no-store",
        signal: AbortSignal.timeout(20000), headers: { Accept: "application/json" }
      });
      if (reponse.status === 401) return { type: "connexion" };
      const data = await reponse.json().catch(() => null);
      return reponse.ok && (data?.ok === true || data?.success === true)
        ? determinerSituationDa(data) : { type: "inconnu" };
    } catch (error) {
      console.warn("Statut DA non vérifiable :", error);
      return { type: "inconnu" };
    }
  }

  function presentationSituationDa(situation) {
    switch (situation.type) {
      case "impaye":
        return { titre: "Abonnement impayé", message: "Vous avez un impayé sur un abonnement. Vous ne pouvez pas souscrire un nouvel abonnement tant que cet impayé n’est pas régularisé." };
      case "compte-ferme":
        return { titre: "Compte en cours de fermeture", message: "Vous avez demandé la fermeture de votre compte. Votre activité est limitée jusqu’à la fermeture définitive. Vous avez la possibilité de rouvrir votre compte avant sa fermeture définitive." };
      case "compte-suspendu":
        return { titre: "Souscription indisponible", message: "Votre compte ne permet pas actuellement de souscrire un abonnement." };
      case "absente":
        return { titre: "Droit d’abonnement (DA) nécessaire", message: "Vous ne disposez pas encore d’un droit d’abonnement. Vous pouvez faire votre demande de DA.", action: "Faire ma demande", destination: "da" };
      case "renouvelable":
        return { titre: "Droit d’abonnement (DA) nécessaire", message: "Votre précédente demande de DA n’a pas été accordée. Vous pouvez faire une nouvelle demande.", action: "Faire ma demande", destination: "da" };
      case "encours":
        return { titre: "Demande de DA en cours", message: "Votre demande de DA est à l’étude. Nous vous tenons informé(e)." };
      case "refusee":
        return { titre: "Droit d’abonnement non accordé", message: situation.date !== null
          ? "Votre demande de DA n’a pas été accordée. Vous pouvez faire une nouvelle demande à partir du " + new Date(situation.date).toLocaleDateString("fr-FR", {timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric"}) + "."
          : "Votre demande de DA n’a pas été accordée. Vous ne pouvez pas faire de nouvelle demande actuellement." };
      case "connexion":
        return { titre: "Connexion nécessaire", message: "Vous devez vous connecter à votre compte pour continuer.", action: "Mon compte", destination: "connexion" };
      case "session-inconnue":
        return { titre: "Vérification de connexion", message: "Votre connexion ne peut pas être vérifiée. Veuillez réessayer." };
      default:
        return { titre: "Droit d’abonnement", message: "Votre droit d’abonnement ne peut pas être vérifié. Veuillez réessayer." };
    }
  }

  async function ouvrirDialogueBoutique(situation) {
    const slot = document.getElementById("lcdp-lightbox-slot");
    const wrapper = slot?.closest(".lcdp-site-page.lcdp-app-wrapper");
    if (!slot || !wrapper || slot.children.length) return;
    const elementActif = document.activeElement;
    const contenu = presentationSituationDa(situation);
    const choix = Boolean(contenu.action);
    const impaye = situation.type === "impaye";
    const fermeture = situation.type === "compte-ferme";
    const type = fermeture ? "compte-ferme" : impaye ? "abonnement-impaye" : choix ? "choix" : "information";
    const fragment = await chargerFragment("/OBJET/HTMLBASE/02-dialogue-reference-" + type + ".html");
    if (slot.children.length) return;
    const dialogue = fragment.querySelector('[data-lcdp-dialogue-reference="' + type + '"]');
    const titre = dialogue?.querySelector("[data-lcdp-dialogue-titre]");
    const message = dialogue?.querySelector("[data-lcdp-dialogue-message]");
    const fermerBouton = dialogue?.querySelector('[data-lcdp-dialogue-action="' + (choix ? "annuler" : "compris") + '"]');
    const confirmer = choix ? dialogue?.querySelector('[data-lcdp-dialogue-action="confirmer"]') : null;
    if (!dialogue || !titre || !message || !fermerBouton || (choix && !confirmer)) throw new Error("Dialogue DA incomplet.");
    dialogue.dataset.lcdpDialogueContext = "conteneur";
    titre.textContent = contenu.titre;
    // Le contenu reste du texte : seuls les retours entre phrases sont des éléments HTML.
    if (fermeture) {
      const limite = message.querySelector("[data-lcdp-fermeture-date-limite]");
      const date = situation.dateLimite ? new Date(situation.dateLimite) : null;
      if (limite && date && Number.isFinite(date.getTime())) {
        limite.textContent = "avant le " + new Intl.DateTimeFormat("fr-FR", {
          timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric"
        }).format(date);
      }
    } else {
      const phrases = contenu.message.split(/(?<=[.!?])\s+(?=[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇŒ])/u);
      message.replaceChildren(...phrases.flatMap((phrase, index) =>
        index ? [document.createElement("br"), document.createTextNode(phrase)] : [document.createTextNode(phrase)]));
    }
    fermerBouton.textContent = fermeture ? "Réouvrir" : impaye ? "Payer" : choix ? "Annuler" : "Fermer";
    if (confirmer) confirmer.textContent = contenu.action;
    const etats = Array.from(wrapper.children).filter(element => element !== slot).map(element => [element, element.inert]);
    const fermer = () => {
      document.removeEventListener("keydown", gererClavier);
      dialogue.remove();
      slot.classList.remove("lcdp-souscription-dialogue-actif");
      etats.forEach(([element, inert]) => { element.inert = inert; });
      if (elementActif?.isConnected) elementActif.focus();
    };
    const gererClavier = event => {
      if (event.key === "Escape") { event.preventDefault(); fermer(); }
      else if (event.key === "Tab") {
        event.preventDefault();
        (confirmer && document.activeElement === fermerBouton ? confirmer : fermerBouton).focus();
      }
    };
    fermerBouton.addEventListener("click", () => {
      if (impaye) {
        // Garder le dialogue affiché jusqu'à la navigation, sans flash de la boutique.
        fermerBouton.disabled = true;
        fermerBouton.setAttribute("aria-busy","true");
        window.addEventListener("pageshow", event => { if (event.persisted) fermer(); }, { once: true });
        window.location.assign(urlMembre("/ESPACE-MEMBRE/paiements-en-attente.html?origine=boutique"));
        return;
      }
      fermer();
      if (fermeture) window.location.assign(urlMembre("/ESPACE-MEMBRE/mes-informations.html?mode=rouvrir"));
    }, { once: true });
    confirmer?.addEventListener("click", () => {
      fermer();
      if (contenu.destination === "da") {
        const lienDa = document.createElement("a");
        lienDa.href = urlMembre("/ESPACE-MEMBRE/abonnement-membre.html?mode=da");
        lienDa.target = "_blank";
        lienDa.rel = "noopener noreferrer";
        lienDa.click();
      }
      else if (contenu.destination === "connexion") window.location.assign(construireUrlSite("/ESPACE-PUBLIC/connexion-membre.html"));
    }, { once: true });
    dialogue.addEventListener("click", event => { if (event.target === dialogue) fermer(); });
    slot.classList.add("lcdp-souscription-dialogue-actif");
    slot.appendChild(fragment);
    etats.forEach(([element]) => { element.inert = true; });
    document.addEventListener("keydown", gererClavier);
    { const boiteFocus = fermerBouton?.closest('[data-lcdp-dialogue-reference], dialog, [role="dialog"], [role="alertdialog"], .lcdp-dialogue-ref'); if (boiteFocus) { const cibleFocus = boiteFocus.querySelector('[data-lcdp-dialogue-titre], h1, h2, h3') || boiteFocus; cibleFocus.tabIndex = -1; cibleFocus.focus({ preventScroll: true }); } }
  }

  const boutonsSouscription = [souscrire, bienfaiteur].filter(Boolean);
  for (const bouton of boutonsSouscription) {
    try {
      bouton.href = urlMembre("/ESPACE-MEMBRE/reserver-membre.html?mode=aboreza&origine=boutique");
    } catch (error) {
      console.error(error);
      bouton.removeAttribute("href");
    }
  }

  function situationSouscriptionDepuisIndex(session) {
    // Le statut global du compte prévaut sur le statut de l'abonnement du jour.
    if (!Array.isArray(session?.causesSuspension) || typeof session.ecritureAutorisee !== "boolean") return { type: "inconnu" };
    if (session.causesSuspension.includes("impaye")) return { type: "impaye" };
    if (session.causesSuspension.includes("fermeture_volontaire")) return { type: "compte-ferme" };
    if (!session.ecritureAutorisee) return { type: "compte-suspendu" };
    if (!Object.hasOwn(session, "statuda")) return { type: "inconnu" };
    const statut = String(session.statuda ?? "").trim().toLowerCase();
    if (statut === "oui") return { type: "validee" };
    if (statut === "encours") return { type: "encours" };
    if (statut === "non" || statut === "") return { type: "contexte-da" };
    return { type: "inconnu" };
  }

  async function lireDateLimiteFermetureBoutique() {
    const base = config.workerMonCompteMembreUrl || config.WORKER_MON_COMPTE_MEMBRE_URL ||
      (typeof config.apiUrl === "function" ? config.apiUrl("mon-compte-membre-api") : "");
    if (!base) return null;
    try {
      const reponse = await fetch(String(base).replace(/\/+$/, "") + "/compte", {
        credentials: "include", cache: "no-store", signal: AbortSignal.timeout(12000),
        headers: { Accept: "application/json" }
      });
      const data = await reponse.json().catch(() => null);
      const fermeture = data?.compte?.fermetureCompte;
      if (!reponse.ok || data?.ok !== true || fermeture?.etat !== "suspendu") return null;
      return fermeture.dateLimite || null;
    } catch (error) {
      console.warn("Date limite de fermeture non vérifiable :", error);
      return null;
    }
  }

  for (const bouton of boutonsSouscription) protegerActionBoutique(bouton, async session => {
    let situation = situationSouscriptionDepuisIndex(session);
    if (situation.type === "compte-ferme") {
      situation.dateLimite = await lireDateLimiteFermetureBoutique();
    }
    if (situation.type === "contexte-da") {
      situation = await lireSituationDaSouscription();
      // Une divergence entre deux lectures n'est jamais présentée comme une DA en cours.
      if (situation.type === "encours" || situation.type === "validee") situation = { type: "inconnu" };
    }
    if (situation.type === "validee" && bouton.hasAttribute("href")) {
      window.location.assign(bouton.href);
      return;
    }
    await ouvrirDialogueBoutique(situation.type === "validee" ? {type: "inconnu"} : situation);
  });

  const destinationsAccessoires = {
    "lcdp-boutique-temoins": "/ESPACE-MEMBRE/accessoires-acces.html",
    "lcdp-boutique-goodies": "/ESPACE-MEMBRE/accessoires-cadeau.html"
  };
  listes.forEach(lien => {
    const destination = destinationsAccessoires[lien.dataset.lcdpBoutiqueListe];
    if (!destination) return;
    try {
      lien.href = urlMembre(destination);
    } catch (error) {
      console.error("Destination accessoires :", error);
    }
    protegerActionBoutique(lien, () => {
      window.location.assign(urlMembre(destination));
    });
  });

  // Navigation entre les vues dans le main existant, sans accordéon ni lightbox.
  const accueil = document.getElementById("lcdp-boutique-accueil");
  const vues = Array.from(document.querySelectorAll("[data-lcdp-boutique-vue]"));
  const services = Array.from(document.querySelectorAll("[data-lcdp-boutique-service]"));
  const defilement = document.querySelector(".lcdp-site-main");
  let vueActive = "";
  let positionBoutique = 0;

  function afficherVueBoutique(focus = true) {
    if (!accueil || !defilement) return;
    const hash = window.location.hash.slice(1);
    const cible = vues.find(vue => vue.dataset.lcdpBoutiqueVue === hash);
    const suivante = cible ? hash : "";
    if (suivante === vueActive) return;
    const precedente = vueActive;
    if (!precedente) positionBoutique = defilement.scrollTop;
    accueil.hidden = Boolean(cible);
    accueil.inert = Boolean(cible);
    vues.forEach(vue => {
      vue.hidden = vue !== cible;
      vue.inert = vue !== cible;
    });
    vueActive = suivante;
    defilement.scrollTop = cible ? 0 : positionBoutique;
    if (focus) {
      const element = cible
        ? cible.querySelector("h1")
        : services.find(lien => lien.dataset.lcdpBoutiqueService === precedente);
      element?.focus({ preventScroll: true });
    }
  }

  if (accueil) {
    window.addEventListener("hashchange", () => afficherVueBoutique());
    afficherVueBoutique(false);
  }

  // Lien direct depuis Mon compte : ouvrir la liste des témoins sans clic supplémentaire.
  const cibleInitiale = window.location.hash;
  const lienInitial = listes.find(lien => "#" + lien.dataset.lcdpBoutiqueListe === cibleInitiale);
  if (lienInitial) lienInitial.click();

  // La DFA individuelle conserve son propre tunnel ; les deux boutons
  // de souscription utilisent le même contrôle et la même entrée ABO-RÉZA.
  if (don && etatDon) protegerActionBoutique(don, async () => {
    const situation = await lireSituationDaSouscription();
    if (situation.type !== "validee") {
      attenteDfa(false);
      await ouvrirDialogueBoutique(situation);
      return;
    }
    window.location.assign(urlMembre("/ESPACE-MEMBRE/dfa-membre.html?v=20261126-dfa-direct-v9"));
    return true;
  }, true);

  const journee = document.getElementById("lcdp-boutique-journee-benevole") || document.querySelector('a[href$="/journee-benevole.html"]');
  if (journee) protegerActionBoutique(journee, () => {
    window.location.assign(urlMembre("/ESPACE-MEMBRE/journee-benevole.html"));
  });

})();
