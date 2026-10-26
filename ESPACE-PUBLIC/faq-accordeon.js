(() => {
  "use strict";
  let compteur = 0;
  const autorisees = new Set(["P", "BR", "STRONG", "EM", "UL", "OL", "LI", "A"]);
  const dangereuses = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT", "TEMPLATE"]);
  function nettoyer(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    function copier(source, cible) {
      for (const node of source.childNodes) {
        if (node.nodeType === 3) { cible.appendChild(document.createTextNode(node.textContent)); continue; }
        if (node.nodeType !== 1 || dangereuses.has(node.tagName)) continue;
        if (!autorisees.has(node.tagName)) { copier(node, cible); continue; }
        const element = document.createElement(node.tagName.toLowerCase());
        if (node.tagName === "A") {
          let href = String(node.getAttribute("data-site-href") || node.getAttribute("href") || "").trim();
          if (href.startsWith("/") && !href.startsWith("//")) {
            const config = window.SITE_CONFIG || {};
            const membre = href.startsWith("/ESPACE-MEMBRE/");
            const fonction = membre ? config.membreUrl : config.publicUrl;
            const base = membre ? config.membreBaseUrl || config.MEMBRE_BASE : config.publicBaseUrl || config.PUBLIC_BASE;
            if (typeof fonction === "function") href = fonction(href);
            else if (base) href = String(base).replace(/\/+$/, "") + href;
          }
          if (!/[\x00-\x20\x7f]/.test(href) && /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href)) {
            element.setAttribute("href", href);
            if (/^https?:/i.test(href)) element.setAttribute("rel", "noopener noreferrer");
          }
        }
        copier(node, element); cible.appendChild(element);
      }
    }
    const fragment = document.createDocumentFragment();
    copier(template.content, fragment);
    return fragment;
  }
  function afficher(racine, blocs) {
    racine.replaceChildren();
    racine.classList.add("lcdp-faq");
    const elements = [];
    function ouvrir(item, ouvert) {
      if (item.animation) { item.animation.cancel(); item.animation = null; }
      const hauteurInitiale = item.panel.hidden ? 0 : item.panel.getBoundingClientRect().height;
      item.button.setAttribute("aria-expanded", String(ouvert));
      item.panel.hidden = false;
      item.panel.inert = !ouvert;
      item.panel.setAttribute("aria-hidden", String(!ouvert));
      const hauteurFinale = ouvert ? item.inner.scrollHeight : 0;
      const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const finir = () => { item.panel.hidden = !ouvert; item.panel.style.height = ""; item.animation = null; };
      if (reduit || !item.panel.animate) { finir(); return; }
      item.animation = item.panel.animate([{ height: hauteurInitiale + "px" }, { height: hauteurFinale + "px" }], { duration: 220, easing: "ease-out" });
      item.animation.onfinish = finir;
    }
    for (const bloc of Array.isArray(blocs) ? blocs : []) {
      if (!String(bloc.titre || "").trim()) continue;
      const id = "lcdp-faq-" + (++compteur);
      const article = document.createElement("section"); article.className = "lcdp-faq__item";
      const titre = document.createElement("h2"); titre.className = "lcdp-faq__heading";
      const button = document.createElement("button"); button.type = "button"; button.className = "lcdp-faq__question";
      button.id = id + "-question"; button.textContent = bloc.titre;
      button.setAttribute("aria-expanded", "false"); button.setAttribute("aria-controls", id);
      const panel = document.createElement("div"); panel.id = id; panel.className = "lcdp-faq__panel";
      panel.hidden = true; panel.inert = true; panel.setAttribute("aria-hidden", "true");
      panel.setAttribute("role", "region"); panel.setAttribute("aria-labelledby", button.id);
      const inner = document.createElement("div"); inner.className = "lcdp-faq__reponse"; inner.appendChild(nettoyer(bloc.html));
      panel.appendChild(inner); titre.appendChild(button); article.append(titre, panel); racine.appendChild(article);
      const item = { button, panel, inner, animation: null }; elements.push(item);
      button.addEventListener("click", () => {
        const actif = button.getAttribute("aria-expanded") === "true";
        for (const autre of elements) if (autre !== item && autre.button.getAttribute("aria-expanded") === "true") ouvrir(autre, false);
        ouvrir(item, !actif);
      });
    }
    if (!elements.length) { const p = document.createElement("p"); p.textContent = "Aucune FAQ publiée pour le moment."; racine.appendChild(p); }
  }
  window.LCDP_FAQ = Object.freeze({ afficher });
})();
