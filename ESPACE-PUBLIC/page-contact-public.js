(() => {
  "use strict";

  window.SITE_BASE =
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.siteBase ||
    "";

  const estCoach = document.body.classList.contains("lcdp-page-contact-coach");

  const siteBase = (
    window.SITE_BASE ||
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.siteBase ||
    ""
  ).replace(/\/$/, "");

  function construireUrlSite(chemin) {
    if (!chemin) return chemin;
    if (chemin.startsWith("#") || chemin.startsWith("mailto:") || chemin.startsWith("tel:") || chemin.startsWith("http://") || chemin.startsWith("https://") || chemin.startsWith("data:")) return chemin;
    if (siteBase) return chemin.startsWith("/") ? siteBase + chemin : siteBase + "/" + chemin.replace(/^\.\//, "");
    return chemin.startsWith("/") ? ".." + chemin : chemin;
  }

  function appliquerRoutesSite(racine = document) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.dataset.siteHref));
    });
    racine.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlSite(element.dataset.siteSrc));
    });
  }

  async function chargerFragment(chemin) {
    const reponse = await fetch(construireUrlSite(chemin), {
      method: "GET",
      credentials: "same-origin",
      cache: "no-cache"
    });
    if (!reponse.ok) throw new Error("Fragment introuvable : " + chemin);
    const template = document.createElement("template");
    template.innerHTML = (await reponse.text()).trim();
    return template.content.cloneNode(true);
  }

  function chargerScriptUneFois(chemin) {
    const src = construireUrlSite(chemin);
    if (document.querySelector(`script[data-lcdp-script="${chemin}"]`)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.dataset.lcdpScript = chemin;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Script introuvable : " + chemin));
      document.body.appendChild(script);
    });
  }

  async function afficherDialogueMonCompte() {
    const slot = document.getElementById("lcdp-lightbox-slot");
    slot.innerHTML = "";

    const fragment = await chargerFragment("/OBJET/HTMLBASE/02-dialogue-bouton.html");
    slot.appendChild(fragment);

    const dialogue = slot.querySelector("[data-lcdp-box-dialogue-bouton]");
    dialogue.querySelector("[data-lcdp-dialogue-title]").textContent = "Mon compte";
    dialogue.querySelector("[data-lcdp-dialogue-text]").textContent = "Choisissez l’espace de connexion adapté à votre situation.";

    const actions = dialogue.querySelector("[data-lcdp-dialogue-actions]");

    [
      { label: "Me connecter", href: "/ESPACE-PUBLIC/connexion-membre.html", style: "lcdp-button-primary" },
      { label: "Être invité(e)", href: "/ESPACE-PUBLIC/inscription.html", style: "lcdp-button-secondary" }
    ].forEach((bouton) => {
      const lien = document.createElement("a");
      lien.className = "lcdp-button " + bouton.style;
      lien.textContent = bouton.label;
      lien.href = construireUrlSite(bouton.href);
      actions.appendChild(lien);
    });

    const fermer = () => {
      slot.innerHTML = "";
    };

    dialogue.querySelector("[data-lcdp-dialogue-close]").addEventListener("click", fermer);
    dialogue.addEventListener("click", (event) => {
      if (event.target === dialogue) fermer();
    });
  }

  window.LCDP_ouvrirDialogueMonCompte = afficherDialogueMonCompte;
  document.addEventListener("lcdp:ouvrir-dialogue-mon-compte", () => {
    afficherDialogueMonCompte().catch(console.error);
  });

  async function initialiserBandeau() {
    const slot = document.getElementById("lcdp-bandeau-slot");
    slot.innerHTML = "";
    slot.appendChild(await chargerFragment("/ESPACE-PUBLIC/box-bandeau-nav-public.html"));
    appliquerRoutesSite(slot);
    await chargerScriptUneFois("/ESPACE-PUBLIC/box-menu-burger-public.js");
    if (typeof window.LCDP_initialiserMenuBurgerPublic === "function") {
      await window.LCDP_initialiserMenuBurgerPublic();
    }
  }

  async function initialiserFooter() {
    const slot = document.getElementById("lcdp-footer-slot");
    slot.innerHTML = "";
    slot.appendChild(await chargerFragment("/OBJET/HTMLBASE/02-footer.html"));
    appliquerRoutesSite(slot);
  }

  async function initialiserDemande() {
    await chargerScriptUneFois("/OBJET/JSBASE/03-formulaire.js");
    await chargerScriptUneFois("/OBJET/JSBASE/03-formulaire-protege.js");
    await chargerScriptUneFois(estCoach
      ? "/ESPACE-PUBLIC/contact-coach.js"
      : "/ESPACE-PUBLIC/contact-resparc.js");
    const initialiser = estCoach
      ? window.LCDP_initialiserContactCoach
      : window.LCDP_initialiserContactResparc;
    if (typeof initialiser !== "function") {
      throw new Error("Initialisation du contact " + (estCoach ? "coach" : "parc") + " indisponible.");
    }
    await initialiser.call(window);
  }

  document.querySelector("#lcdp-contact-erreur button").addEventListener("click", () => window.location.reload());

  let formulairePret = false;
  const contenuContact = document.getElementById("lcdp-contact-contenu");
  function afficherFormulaireContact() {
    const form = contenuContact.querySelector("form");
    if (!form || !form.querySelector("button[type='submit']")) return false;
    const champsRequis = estCoach
      ? ["nomcoach", "prenomcoach", "emailcoach", "telcoach", "metiercoach", "dptmtcoach"]
      : ["nomresp", "prenomresp", "emailresp", "telresp", "nomparccontact", "dptmtresp"];
    if (!champsRequis.every(nom => form.elements.namedItem(nom))) return false;
    formulairePret = true;
    window.clearTimeout(delaiContact);
    observationContact.disconnect();
    document.getElementById("lcdp-contact-attente").hidden = true;
    document.getElementById("lcdp-contact-erreur").hidden = true;
    contenuContact.hidden = false;
    return true;
  }
  function echecChargementContact() {
    if (formulairePret || afficherFormulaireContact()) return;
    console.error("LCDP : délai de chargement du formulaire dépassé ou initialisation échouée.");
    document.getElementById("lcdp-contact-attente").hidden = true;
    document.getElementById("lcdp-contact-erreur").hidden = false;
  }
  const observationContact = new MutationObserver(afficherFormulaireContact);
  observationContact.observe(contenuContact, {childList: true, subtree: true});
  const delaiContact = window.setTimeout(echecChargementContact, 20000);
  document.addEventListener("lcdp:contact-formulaire-pret", afficherFormulaireContact);

  async function initialiserPage() {
    appliquerRoutesSite(document);
    initialiserBandeau().catch(console.error);
    initialiserFooter().catch(console.error);
    await initialiserDemande();
    afficherFormulaireContact();
  }

  initialiserPage().catch((error) => { console.error(error); echecChargementContact(); });
})();
