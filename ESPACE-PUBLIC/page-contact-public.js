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

  async function initialiserDemande() {
    await chargerScriptUneFois("/OBJET/JSBASE/03-formulaire.js");
    await chargerScriptUneFois("/OBJET/JSBASE/03-formulaire-protege.js?v=20261119-contact-isole");
    await chargerScriptUneFois(estCoach
      ? "/ESPACE-PUBLIC/contact-coach.js?v=20261119-contact-isole"
      : "/ESPACE-PUBLIC/contact-resparc.js?v=20261119-contact-isole");
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
    await initialiserDemande();
    afficherFormulaireContact();
  }

  initialiserPage().catch((error) => { console.error(error); echecChargementContact(); });
})();
