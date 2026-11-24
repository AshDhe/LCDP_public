(() => {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const abonnement = document.getElementById("lcdp-boutique-abonnement");
  const listes = Array.from(document.querySelectorAll("[data-lcdp-boutique-liste]"));
  const don = document.getElementById("lcdp-boutique-don");
  const etatDon = document.getElementById("lcdp-boutique-don-etat");

  if (typeof config.membreUrl === "function") {
    abonnement.href = config.membreUrl("/ESPACE-MEMBRE/reserver-membre.html?mode=aboreza");
  }

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

  // Point de raccordement du futur tunnel w-don-parc.js.
  // Son URL d'entrée reste à définir dans SITE_CONFIG : aucun appel API anticipé.
  don.addEventListener("click", event => {
    event.preventDefault();
    const url = config.donParcTunnelUrl;
    if (typeof url === "string" && url.trim()) {
      window.location.assign(url);
      return;
    }
    etatDon.hidden = false;
  });
})();
