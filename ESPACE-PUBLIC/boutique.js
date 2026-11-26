(() => {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const souscrire = document.getElementById("lcdp-demarrer-abonnement") || document.getElementById("lcdp-boutique-abonnement");
  const listes = Array.from(document.querySelectorAll("[data-lcdp-boutique-liste]"));
  const don = document.getElementById("lcdp-boutique-don");
  const etatDon = document.getElementById("lcdp-boutique-don-etat");

  const siteBase = String(window.SITE_CONFIG?.publicBaseUrl || "").replace(/\/+$/, "");
  let controleSouscriptionEnCours = false;

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
    if (data.daactive === true) return { type: statut === "oui" ? "validee" : "encours" };
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
        return { titre: "Connexion nécessaire", message: "Connectez-vous à votre compte membre pour vérifier votre droit d’abonnement.", action: "Me connecter", destination: "connexion" };
      default:
        return { titre: "Droit d’abonnement", message: "Votre droit d’abonnement ne peut pas être vérifié. Veuillez réessayer." };
    }
  }

  async function ouvrirInformationSouscription(situation) {
    const slot = document.getElementById("lcdp-lightbox-slot");
    const wrapper = slot?.closest(".lcdp-site-page.lcdp-app-wrapper");
    if (!slot || !wrapper || slot.children.length) return;
    const elementActif = document.activeElement;
    const contenu = presentationSituationDa(situation);
    const choix = Boolean(contenu.action);
    const type = choix ? "choix" : "information";
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
    message.textContent = contenu.message;
    fermerBouton.textContent = choix ? "Annuler" : "Fermer";
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
    fermerBouton.addEventListener("click", fermer, { once: true });
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
    fermerBouton.focus();
  }

  try {
    souscrire.href = urlMembre("/ESPACE-MEMBRE/reserver-membre.html?mode=aboreza");
  } catch (error) {
    console.error(error);
    souscrire.removeAttribute("href");
  }

  souscrire.addEventListener("click", async event => {
    event.preventDefault();
    if (controleSouscriptionEnCours) return;
    controleSouscriptionEnCours = true;
    souscrire.setAttribute("aria-busy", "true");
    const libelle = souscrire.textContent;
    souscrire.textContent = "Vérification…";
    try {
      const situation = await lireSituationDaSouscription();
      if (situation.type === "validee" && souscrire.hasAttribute("href")) {
        window.location.assign(souscrire.href);
        return;
      }
      await ouvrirInformationSouscription(situation.type === "validee" ? {type: "inconnu"} : situation);
    } catch (error) {
      console.error("Contrôle DA :", error);
    } finally {
      souscrire.textContent = libelle;
      souscrire.removeAttribute("aria-busy");
      controleSouscriptionEnCours = false;
    }
  });

  listes.forEach(lien => {
    lien.addEventListener("click", event => {
      event.preventDefault();
      const cible = document.getElementById(lien.getAttribute("aria-controls"));
      const ouvrir = cible.hidden;

      listes.forEach(autre => {
        const panneau = document.getElementById(autre.getAttribute("aria-controls"));
        const visible = autre === lien && ouvrir;
        panneau.hidden = !visible;
        autre.setAttribute("aria-expanded", String(visible));
      });
      if (ouvrir) cible.scrollIntoView({ behavior: "auto", block: "nearest" });
    });
  });

  // Rubriques de services : accordéons statiques dans le main du wrapper,
  // avec les classes visuelles de la FAQ et sans recréer les boutons métier.
  const services = Array.from(document.querySelectorAll("[data-lcdp-boutique-service]"));
  const defilement = document.querySelector(".lcdp-site-main") || document.scrollingElement;
  let correctionServices = 0;

  function afficherService(bouton, ouvert) {
    const panneau = document.getElementById(bouton.getAttribute("aria-controls"));
    bouton.setAttribute("aria-expanded", String(ouvert));
    panneau.hidden = !ouvert;
    panneau.inert = !ouvert;
    panneau.setAttribute("aria-hidden", String(!ouvert));
  }

  services.forEach(bouton => {
    bouton.addEventListener("click", () => {
      const position = bouton.getBoundingClientRect().top;
      const ouvrir = bouton.getAttribute("aria-expanded") !== "true";
      if (ouvrir) afficherService(bouton, true);
      services.forEach(autre => {
        if (autre !== bouton && autre.getAttribute("aria-expanded") === "true") afficherService(autre, false);
      });
      if (!ouvrir) afficherService(bouton, false);
      const maintenirPosition = () => {
        const ecart = bouton.getBoundingClientRect().top - position;
        if (defilement && Math.abs(ecart) > 0.5) defilement.scrollTop += ecart;
      };
      maintenirPosition();
      if (correctionServices) window.cancelAnimationFrame(correctionServices);
      correctionServices = window.requestAnimationFrame(() => {
        correctionServices = 0;
        maintenirPosition();
      });
    });
  });

  // Lien direct depuis Mon compte : ouvrir la liste des témoins sans clic supplémentaire.
  const cibleInitiale = window.location.hash;
  const lienInitial = listes.find(lien => lien.getAttribute("href") === cibleInitiale);
  if (lienInitial) lienInitial.click();

  // Raccordement commun au futur tunnel DFA (w-don-parc.js).
  // L'URL d'entrée reste à définir dans SITE_CONFIG : aucun appel API anticipé.
  // Mode bienfaiteur : commande simultanée d'un abonnement permanent 1A et
  // d'une DFA personnelle de 150 EUR. Aucune garantie d'accès à planifier
  // à la commande ; le club prend en charge son équivalent.
  // Ces règles doivent être contrôlées par le tunnel et côté serveur.
  const bienfaiteur = document.getElementById("lcdp-boutique-bienfaiteur");
  const etatBienfaiteur = document.getElementById("lcdp-boutique-bienfaiteur-etat");

  function raccorderDfa(bouton, etat, mode) {
    bouton.addEventListener("click", event => {
      event.preventDefault();
      const entree = config.donParcTunnelUrl;
      if (typeof entree === "string" && entree.trim()) {
        try {
          const url = new URL(entree, window.location.href);
          if (mode) url.searchParams.set("mode", mode);
          window.location.assign(url.href);
          return;
        } catch (error) {
          console.error("Tunnel DFA indisponible :", error);
        }
      }
      etat.hidden = false;
    });
  }

  raccorderDfa(don, etatDon);
  raccorderDfa(bienfaiteur, etatBienfaiteur, "bienfaiteur");
})();
