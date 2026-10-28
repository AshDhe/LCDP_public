(() => {
  "use strict";
  const config = window.SITE_CONFIG || {};
  const page = window.LCDP_FAQ_PAGE;
  const joindre = (base, path) => String(base || "").replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
  const urlMembre = path => typeof config.membreUrl === "function" ? config.membreUrl(path) : joindre(config.membreBaseUrl || config.MEMBRE_BASE || (page.membre ? config.siteBase : "") || "", path);
  const urlLocale = path => page.membre ? urlMembre(path) : page.publicUrl(path);
  window.SITE_BASE = page.membre ? config.membreBaseUrl || config.MEMBRE_BASE || config.siteBase || "" : config.publicBaseUrl || config.PUBLIC_BASE || config.siteBase || "";
  window.LCDP_urlMembre = urlMembre;
  window.LCDP_urlPublic = page.publicUrl;
  window.LCDP_urlObjet = page.objetUrl;
  function appliquerRoutes(root) {
    root.querySelectorAll("[data-site-href]").forEach(element => {
      const path = element.dataset.siteHref || "";
      const membre = element.dataset.space === "membre" || path.startsWith("/ESPACE-MEMBRE/");
      element.setAttribute("href", membre ? urlMembre(path) : page.publicUrl(path));
    });
    root.querySelectorAll("[data-site-src]").forEach(element => {
      const path = element.dataset.siteSrc || "";
      element.setAttribute("src", path.startsWith("/OBJET/") ? page.objetUrl(path.slice(6)) : page.publicUrl(path));
    });
  }
  async function fragment(slotId, url) {
    const response = await fetch(url, { credentials: "same-origin", cache: "no-cache" });
    if (!response.ok) throw Error("Impossible de charger un élément de navigation.");
    const template = document.createElement("template"); template.innerHTML = await response.text();
    const slot = document.getElementById(slotId); slot.replaceChildren(template.content.cloneNode(true)); appliquerRoutes(slot);
  }
  async function script(url) {
    await new Promise((resolve,reject) => { const s = document.createElement("script"); s.src = url; s.onload = resolve; s.onerror = () => reject(Error("Navigation indisponible.")); document.body.appendChild(s); });
  }
  function endpoint(modern, legacy, sousDomaine) {
    return String(config[modern] || config[legacy] || (typeof config.apiUrl === "function" ? config.apiUrl(sousDomaine) : "") || "").replace(/\/+$/, "");
  }
  async function sessionMembre() {
    const api = endpoint("workerIndexMembreUrl", "WORKER_INDEX_MEMBRE_URL", "index-membre-api") || config.W_INDEX_MEMBRE_URL;
    if (!api) throw Error("Le service membre n’est pas configuré.");
    const response = await fetch(String(api).replace(/\/+$/, "") + "/index", { credentials:"include", cache:"no-store", headers:{Accept:"application/json"} });
    if (response.status === 401) { location.replace(page.publicUrl("/ESPACE-PUBLIC/connexion-membre.html?source=faq&session=inactive")); return null; }
    const data = await response.json();
    if (!response.ok || data.success !== true || data.connected !== true) throw Error("Impossible de vérifier votre session membre.");
    return data;
  }
  async function navigation(etat) {
    const espace = page.membre ? "MEMBRE" : "PUBLIC";
    const suffixe = page.membre ? "membre" : "public";
    await fragment("lcdp-bandeau-slot", urlLocale("/ESPACE-" + espace + "/box-bandeau-nav-" + suffixe + ".html"));
    await script(urlLocale("/ESPACE-" + espace + "/box-menu-burger-" + suffixe + ".js"));
    const init = window[page.membre ? "LCDP_initialiserMenuBurgerMembre" : "LCDP_initialiserMenuBurgerPublic"];
    if (typeof init === "function") await init(page.membre ? { etatMembre: etat } : undefined);
    await fragment("lcdp-footer-slot", page.objetUrl("/BOX/02-box-footer.html"));
  }
  // Le dialogue public existant permet de choisir son espace depuis le bandeau.
  window.LCDP_ouvrirDialogueMonCompte = async () => {
    await fragment("lcdp-lightbox-slot", page.objetUrl("/BOX/02-box-dialogue-bouton.html"));
    const slot = document.getElementById("lcdp-lightbox-slot");
    const dialogue = slot.querySelector("[data-lcdp-box-dialogue-bouton]");
    if (!dialogue) return;
    const titre = dialogue.querySelector("[data-lcdp-dialogue-title]");
    const texte = dialogue.querySelector("[data-lcdp-dialogue-text]");
    const actions = dialogue.querySelector("[data-lcdp-dialogue-actions]");
    if (!titre || !texte || !actions) { slot.replaceChildren(); return; }
    titre.textContent = "Mon compte"; texte.textContent = "Choisissez votre espace."; actions.replaceChildren();
    for (const [label,path] of [["Me connecter","/ESPACE-PUBLIC/connexion-membre.html"],["Être invité(e)","/ESPACE-PUBLIC/inscription.html"]]) {
      const lien = document.createElement("a"); lien.className = "lcdp-button lcdp-button-primary"; lien.textContent = label; lien.href = page.publicUrl(path); actions.appendChild(lien);
    }
    dialogue.querySelector("[data-lcdp-dialogue-close]")?.addEventListener("click", () => slot.replaceChildren());
  };
  document.addEventListener("lcdp:ouvrir-dialogue-mon-compte", () => window.LCDP_ouvrirDialogueMonCompte().catch(console.error));
  async function initialiser() {
    const status = document.getElementById("lcdp-faq-status");
    let etat = null;
    if (page.membre) { etat = await sessionMembre(); if (!etat) return; }
    const navigationPrete = navigation(etat).catch(error => console.error("Navigation FAQ :", error));
    const affichagePret = Promise.all([page.stylesPrets, navigationPrete]).then(() => {
      clearTimeout(window.LCDP_FAQ_SECOURS);
      document.documentElement.classList.remove("lcdp-faq-preparation");
    });
    const api = endpoint("workerEditingAdminUrl", "WORKER_EDITING_ADMIN_URL", "editing-admin-api") || "https://editing-admin-api.lacleduparc.fr";
    if (!api) throw Error("Le service FAQ n’est pas configuré.");
    const response = await fetch(api + "/public/faq", { credentials:"omit", cache:"no-store", headers:{Accept:"application/json"} });
    const data = await response.json();
    if (!response.ok || data.success !== true) throw Error(data.message || "Les FAQ sont temporairement indisponibles.");
    await affichagePret;
    window.LCDP_FAQ.afficher(document.getElementById("lcdp-faq-liste"), data.blocs);
    status.textContent = ""; status.hidden = true;
    document.getElementById("lcdp-faq-liste").setAttribute("aria-busy", "false");
  }
  initialiser().catch(async error => {
    await page.stylesPrets;
    const status = document.getElementById("lcdp-faq-status");
    status.textContent = error.message || "Les FAQ sont temporairement indisponibles.";
    status.hidden = false;
    document.getElementById("lcdp-faq-liste").setAttribute("aria-busy", "false");
    clearTimeout(window.LCDP_FAQ_SECOURS);
    document.documentElement.classList.remove("lcdp-faq-preparation");
  });
})();
