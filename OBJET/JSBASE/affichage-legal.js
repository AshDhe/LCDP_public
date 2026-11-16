/* La Clé du Parc — 1 événement par ouverture de page ou de tunnel suivi.
   Le navigateur ne transmet jamais de nom ni d'identifiant membre. */
(() => {
  "use strict";
  if (window.LCDP_AFFICHAGE_LEGAL_ACTIF === true) return;
  window.LCDP_AFFICHAGE_LEGAL_ACTIF = true;

  const PAGES = new Set([
    "mentions-legales", "reglement-app", "reglement-club",
    "cgv", "demande-abonnement"
  ]);
  const cfg = window.SITE_CONFIG || {};
  const endpoint = typeof cfg.apiUrl === "function"
    ? cfg.apiUrl("affichage-legal-api")
    : "https://affichage-legal-api.lacleduparc.fr";

  // Les prévisualisations GitHub ne polluent pas les statistiques réelles.
  const production = ["lacleduparc.fr", "membre.lacleduparc.fr"]
    .includes(window.location.hostname);

  async function enregistrer(page) {
    if (!production || !PAGES.has(page)) return;
    try {
      const response = await fetch(endpoint.replace(/\/+$/, "") + "/affichage", {
        method: "POST",
        mode: "cors",
        credentials: "include",
        cache: "no-store",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page })
      });
      if (!response.ok) {
        console.warn("Comptage Affichage légal indisponible :", response.status);
      }
    } catch (error) {
      console.warn("Comptage Affichage légal indisponible :", error?.message || error);
    }
  }

  window.LCDP_enregistrerAffichageLegal = enregistrer;

  function viderFile() {
    const file = window.LCDP_affichagesLegauxEnAttente;
    if (!Array.isArray(file) || !file.length) return;
    while (file.length) {
      const page = String(file.shift() || "");
      void enregistrer(page);
    }
  }
  window.addEventListener("lcdp:affichage-legal", viderFile);
  viderFile();

  function auto() {
    if (document.body?.dataset?.lcdpAffichageLegalMode !== "auto") return;
    const code = document.body.dataset.lcdpAffichageLegal;
    if (PAGES.has(code)) void enregistrer(code);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", auto, { once: true });
  } else {
    auto();
  }
})();