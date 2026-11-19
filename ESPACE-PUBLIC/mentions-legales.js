(() => {
  "use strict";

  window.SITE_BASE = window.SITE_CONFIG?.publicBaseUrl || window.SITE_CONFIG?.siteBase || "";

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

  function endpointsEditingAdmin() {
    return Array.from(new Set([
      window.SITE_CONFIG?.workerEditingAdminUrl,
      window.SITE_CONFIG?.WORKER_EDITING_ADMIN_URL,
      window.SITE_CONFIG?.workerEditingAdminFallbackUrl,
      window.SITE_CONFIG?.WORKER_EDITING_ADMIN_FALLBACK_URL
    ]
      .map((value) => String(value || "").replace(/\/+$/, ""))
      .filter(Boolean)));
  }

  async function chargerDocumentPublic(code, titreParDefaut) {
    const endpoints = endpointsEditingAdmin();

    if (endpoints.length < 1) {
      throw new Error("Worker de contenu public non configuré.");
    }

    let derniereErreur = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(
          endpoint + "/public/" + encodeURIComponent(code),
          {
            method: "GET",
            credentials: "omit",
            cache: "no-store",
            headers: {
              Accept: "application/json"
            }
          }
        );

        const data = await response.json().catch(() => null);

        if (
          !response.ok ||
          !data ||
          data.success !== true ||
          !Array.isArray(data.blocs) ||
          data.blocs.length < 1
        ) {
          throw new Error(
            data?.message ||
            data?.detail ||
            "Réponse publique inexploitable."
          );
        }

        return {
          titre: String(data.titre || titreParDefaut),
          blocs: data.blocs
        };
      } catch (error) {
        derniereErreur = error;
      }
    }

    throw derniereErreur || new Error("Chargement des mentions légales impossible.");
  }

  function nettoyerHtmlAffichage(htmlBrut) {
    const moduleLegal =
      window.LCDP_DOCUMENTS_LEGAUX;

    if (
      !moduleLegal ||
      typeof moduleLegal.nettoyerHtml !== "function"
    ) {
      throw new Error(
        "Normaliseur des documents légaux indisponible."
      );
    }

    return moduleLegal.nettoyerHtml(htmlBrut);
  }

  async function afficherMentionsLegales(documentPublic) {
    const conteneur = document.getElementById("lcdp-mentions-legales-contenu");
    const titrePage = document.getElementById("lcdp-mentions-legales-titre");
    const fragment = document.createDocumentFragment();
    let dernierContenu = null;

    titrePage.textContent = documentPublic.titre;

    for (const bloc of documentPublic.blocs) {
      const titre = String(bloc?.titre || "").trim();
      const html = nettoyerHtmlAffichage(String(bloc?.html || ""));
      if (!titre || !html) continue;

      const enveloppe = document.createElement("div");
      enveloppe.appendChild(await chargerFragment("/OBJET/HTMLBASE/01-text.html"));
      const box = enveloppe.querySelector("[data-lcdp-boxtext]");
      if (!box) throw new Error("Objet BoxText incomplet.");
      box.querySelector("[data-lcdp-boxtext-title]").textContent = titre;
      dernierContenu = box.querySelector("[data-lcdp-boxtext-content]");
      dernierContenu.innerHTML = html;
      if (!/^\s*(?:(?:article|section|chapitre)\s*)?\d+(?=\s|[.):\-])/i.test(titre)) {
        enveloppe.classList.add("lcdp-legal-section--numerotation-auto");
      }
      fragment.appendChild(enveloppe);
    }

    if (!dernierContenu) throw new Error("Aucun contenu publié.");
    const actions = document.createElement("div");
    actions.className = "lcdp-contact-juridique-actions";
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "lcdp-button lcdp-button-secondary";
    bouton.textContent = "Demande juridique";
    bouton.addEventListener("click", () => {
      window.LCDP_DOCUMENTS_LEGAUX.ouvrirDemandeJuridique().catch(console.error);
    });
    actions.appendChild(bouton);
    dernierContenu.appendChild(actions);
    conteneur.replaceChildren(fragment);
    appliquerRoutesSite(conteneur);
  }

  async function initialiserFooter() {
    const slot = document.getElementById("lcdp-footer-slot");
    slot.innerHTML = "";
    slot.appendChild(await chargerFragment("/OBJET/HTMLBASE/02-footer.html"));
    appliquerRoutesSite(slot);
  }

  async function initialiserPage() {
    appliquerRoutesSite(document);
    initialiserBandeau().catch(console.error);
    initialiserFooter().catch(console.error);
    const conteneur = document.getElementById("lcdp-mentions-legales-contenu");
    try {
      const documentPublic = await chargerDocumentPublic("mentions-legales", "Mentions légales");
      await afficherMentionsLegales(documentPublic);
    } catch (error) {
      console.error(error);
      const message = document.createElement("p");
      message.className = "lcdp-text-muted";
      message.setAttribute("role", "alert");
      message.textContent = "Les mentions légales ne peuvent pas être chargées. Rechargez la page pour réessayer.";
      conteneur.replaceChildren(message);
    } finally {
      conteneur.setAttribute("aria-busy", "false");
    }
  }

  initialiserPage().catch(console.error);
})();
