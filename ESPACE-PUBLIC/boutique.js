(() => {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const souscrire = document.getElementById("lcdp-demarrer-abonnement") || document.getElementById("lcdp-boutique-abonnement");
  const listes = Array.from(document.querySelectorAll("[data-lcdp-boutique-liste]"));
  const don = document.getElementById("lcdp-boutique-don");
  const etatDon = document.getElementById("lcdp-boutique-don-etat");

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
        if (data.connected === true) return "connecte";
        if (data.connected === false) return "connexion";
      }
    } catch (error) {
      console.warn("Session boutique non vérifiable :", error);
    }
    return "inconnu";
  }

  function protegerActionBoutique(bouton, action) {
    if (!bouton) return;
    bouton.addEventListener("click", async event => {
      event.preventDefault();
      if (controleBoutiqueEnCours || document.getElementById("lcdp-lightbox-slot")?.children.length) return;
      controleBoutiqueEnCours = true;
      const ancienLabel = bouton.getAttribute("aria-label");
      bouton.setAttribute("aria-busy", "true");
      bouton.setAttribute("aria-label", "Vérification en cours");
      try {
        const session = await lireSessionBoutique();
        if (session === "connecte") await action();
        else await ouvrirDialogueBoutique({type: session === "connexion" ? "connexion" : "session-inconnue"});
      } catch (error) {
        console.error("Contrôle boutique :", error);
        await ouvrirDialogueBoutique({type: "session-inconnue"}).catch(console.error);
      } finally {
        if (ancienLabel === null) bouton.removeAttribute("aria-label");
        else bouton.setAttribute("aria-label", ancienLabel);
        bouton.removeAttribute("aria-busy");
        controleBoutiqueEnCours = false;
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
        return { titre: "Connexion nécessaire", message: "Vous devez vous connecter à votre compte pour continuer.", action: "Mon compte", destination: "connexion" };
      case "session-inconnue":
        return { titre: "Vérification de connexion", message: "Votre connexion ne peut pas être vérifiée. Veuillez réessayer." };
      case "commande-demo":
        return { titre: "Commande de démonstration", message: "Cet accessoire et son prix sont fictifs. Aucun achat ni paiement n’est effectué." };
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

  if (souscrire) {
    try {
      souscrire.href = urlMembre("/ESPACE-MEMBRE/reserver-membre.html?mode=aboreza");
    } catch (error) {
      console.error(error);
      souscrire.removeAttribute("href");
    }
  }

  protegerActionBoutique(souscrire, async () => {
    const situation = await lireSituationDaSouscription();
    if (situation.type === "validee" && souscrire.hasAttribute("href")) {
      window.location.assign(souscrire.href);
      return;
    }
    await ouvrirDialogueBoutique(situation.type === "validee" ? {type: "inconnu"} : situation);
  });

  listes.forEach(lien => {
    protegerActionBoutique(lien, () => {
      window.location.assign(lien.href);
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

  // Raccordement commun au futur tunnel DFA (w-don-parc.js).
  // L'URL d'entrée reste à définir dans SITE_CONFIG : aucun appel API anticipé.
  // Mode bienfaiteur : commande simultanée d'un abonnement permanent 1A et
  // d'une DFA personnelle de 150 EUR. Aucune garantie d'accès à planifier
  // à la commande ; le club prend en charge son équivalent.
  // Ces règles doivent être contrôlées par le tunnel et côté serveur.
  const bienfaiteur = document.getElementById("lcdp-boutique-bienfaiteur");
  const etatBienfaiteur = document.getElementById("lcdp-boutique-bienfaiteur-etat");

  function raccorderDfa(bouton, etat, mode) {
    if (!bouton || !etat) return;
    protegerActionBoutique(bouton, async () => {
      if (mode === "bienfaiteur") {
        const situation = await lireSituationDaSouscription();
        if (situation.type !== "validee") {
          await ouvrirDialogueBoutique(situation);
          return;
        }
      }
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

  const journee = document.getElementById("lcdp-boutique-journee-benevole") || document.querySelector('a[href$="/journee-benevole.html"]');
  if (journee) protegerActionBoutique(journee, () => {
    window.location.assign(urlMembre("/ESPACE-MEMBRE/journee-benevole.html"));
  });

  // La liste reste masquée tant que la session n'est pas confirmée,
  // y compris à l'ouverture directe d'une URL ou au retour de l'historique.
  const catalogue = document.querySelector("[data-lcdp-accessoires-reserves]");
  if (catalogue) {
    const etat = document.getElementById("lcdp-accessoires-etat");
    let controle = 0;
    let renduCatalogue;
    // Articles fictifs uniquement : aucun catalogue commercial ni paiement.
    const demonstrations = {
      acces: { nom: "Bracelet de présence", prix: "12 € — prix indicatif fictif", description: "Bracelet fluorescent · réglable · témoin de présence nominatif.", image: "/OBJET/IMAG/BOUTIQUE/ACCES/bracelet-presence-demo.svg" },
      cadeau: { nom: "Gourde La Clé du Parc", prix: "19 € — prix indicatif fictif", description: "Gourde inox · 500 ml · réutilisable en promenade.", image: "/OBJET/IMAG/BOUTIQUE/CADEAU/gourde-demo.svg" }
    };
    async function rendreCatalogueDemo() {
      const produit = demonstrations[catalogue.dataset.lcdpAccessoiresReserves];
      const liste = catalogue.querySelector("[data-lcdp-liste-card-diaporama-list]");
      const message = catalogue.querySelector("[data-lcdp-liste-card-message]");
      if (!produit || !liste || !message) throw new Error("Catalogue accessoire incomplet.");
      const fragment = await chargerFragment("/OBJET/HTMLBASE/04-card-accessoire.html");
      const carte = fragment.querySelector("[data-lcdp-card-accessoire]");
      if (!carte) throw new Error("Gabarit accessoire introuvable.");
      const recto = carte.querySelector("[data-lcdp-diaporama-retourner]");
      const dos = carte.querySelector("[data-lcdp-diaporama-dos]");
      const fermer = carte.querySelector("[data-lcdp-diaporama-fermer]");
      const image = carte.querySelector("[data-lcdp-accessoire-image]");
      const commander = carte.querySelector("[data-lcdp-accessoire-commander]");
      image.alt = produit.nom + " — illustration de démonstration";
      image.src = construireUrlSite(produit.image);
      recto.setAttribute("aria-label", "Découvrir : " + produit.nom);
      carte.querySelector("[data-lcdp-accessoire-nom-image]").textContent = produit.nom;
      carte.querySelector("[data-lcdp-accessoire-nom]").textContent = produit.nom;
      carte.querySelector("[data-lcdp-accessoire-prix]").textContent = produit.prix;
      carte.querySelector("[data-lcdp-card-parc-description-texte]").textContent = produit.description;
      function retourner(ouvert) {
        carte.classList.toggle("is-retourne", ouvert);
        recto.setAttribute("aria-expanded", String(ouvert));
        recto.inert = ouvert;
        dos.inert = !ouvert;
        dos.setAttribute("aria-hidden", String(!ouvert));
        (ouvert ? fermer : recto).focus({preventScroll:true});
      }
      recto.addEventListener("click", () => retourner(true));
      fermer.addEventListener("click", () => retourner(false));
      carte.addEventListener("keydown", event => {
        if (event.key === "Escape" && carte.classList.contains("is-retourne")) {
          event.preventDefault();
          retourner(false);
        }
      });
      protegerActionBoutique(commander, () => ouvrirDialogueBoutique({type:"commande-demo"}));
      liste.replaceChildren(fragment);
      carte.classList.add("is-ready");
      message.textContent = "Catalogue de démonstration — articles et prix fictifs.";
      if (typeof image.decode === "function") await image.decode().catch(() => {});
    }
    async function initialiserCatalogue() {
      const generation = ++controle;
      catalogue.hidden = true;
      if (etat) etat.hidden = false;
      const [session] = await Promise.all([
        lireSessionBoutique(),
        window.LCDP_pagePubliquePrete || Promise.resolve()
      ]);
      if (generation !== controle) return;
      if (session === "connecte") {
        try {
          renduCatalogue ||= rendreCatalogueDemo().catch(error => { renduCatalogue = null; throw error; });
          await renduCatalogue;
        } catch (error) {
          console.error(error);
          if (generation !== controle) return;
          if (etat) etat.textContent = "Le catalogue est momentanément indisponible.";
          window.LCDP_terminerAttentePagePublique?.();
          return;
        }
        if (generation !== controle) return;
        catalogue.hidden = false;
        if (etat) etat.hidden = true;
        window.LCDP_terminerAttentePagePublique?.();
        return;
      }
      window.LCDP_terminerAttentePagePublique?.();
      if (etat) etat.textContent = session === "connexion"
        ? "Vous devez vous connecter à votre compte pour continuer."
        : "Votre connexion ne peut pas être vérifiée. Veuillez réessayer.";
      await ouvrirDialogueBoutique({type: session === "connexion" ? "connexion" : "session-inconnue"});
    }
    initialiserCatalogue().catch(console.error);
    window.addEventListener("pagehide", () => { ++controle; catalogue.hidden = true; });
    window.addEventListener("pageshow", event => {
      if (event.persisted) initialiserCatalogue().catch(console.error);
    });
  }
})();
