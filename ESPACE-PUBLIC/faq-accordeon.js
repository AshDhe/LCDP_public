(() => {
  "use strict";
  const controles = new WeakMap();
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
    controles.get(racine)?.();
    racine.replaceChildren();
    racine.classList.add("lcdp-faq", "lcdp-stack-large");
    const elements = [];
    const prefixe = "lcdp-faq-" + (++compteur);
    function ouvrir(item, ouvert, animer = true) {
      item.terminer?.();
      const hauteurInitiale = item.panel.hidden ? 0 : item.panel.getBoundingClientRect().height;
      item.button.setAttribute("aria-expanded", String(ouvert));
      item.panel.hidden = false;
      item.panel.inert = !ouvert;
      item.panel.setAttribute("aria-hidden", String(!ouvert));
      const hauteurFinale = ouvert ? item.inner.scrollHeight : 0;
      const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      return new Promise(resolve => {
        const finir = () => {
          item.terminer = null;
          if (item.animation) { item.animation.onfinish = null; item.animation.cancel(); item.animation = null; }
          item.panel.hidden = !ouvert; item.panel.style.height = ""; resolve();
        };
        if (!animer || reduit || !item.panel.animate) { finir(); return; }
        item.animation = item.panel.animate([{ height: hauteurInitiale + "px" }, { height: hauteurFinale + "px" }], { duration: 220, easing: "ease-out" });
        item.terminer = finir;
        item.animation.onfinish = finir;
      });
    }
    function cibler(item) {
      // Une seule réponse ouverte, sans modifier l'URL ni faire défiler la page.
      // Fermer avec la même transition que l'ouverture évite un saut de mise en page.
      for (const autre of elements) {
        if (autre !== item && (!autre.panel.hidden || autre.button.getAttribute("aria-expanded") === "true")) {
          void ouvrir(autre, false);
        }
      }
      void ouvrir(item, true);
    }
    for (const bloc of Array.isArray(blocs) ? blocs : []) {
      if (!String(bloc.titre || "").trim()) continue;
      const id = prefixe + "-" + elements.length;
      const article = document.createElement("section"); article.className = "lcdp-faq__item lcdp-component lcdp-box-carousel lcdp-editorial-card";
      article.id = id;
      const titre = document.createElement("h2"); titre.className = "lcdp-faq__heading lcdp-box-carousel__title lcdp-boxtext__title--center"; titre.setAttribute("data-lcdp-boxtext-title", "");
      const button = document.createElement("button"); button.type = "button"; button.className = "lcdp-faq__question";
      button.id = id + "-question"; button.textContent = String(bloc.titre).replace(/([^\s?])\s*\?/gu, "$1\u00a0?");
      button.setAttribute("aria-expanded", "false"); button.setAttribute("aria-controls", id + "-reponse");
      const panel = document.createElement("div"); panel.id = id + "-reponse"; panel.className = "lcdp-faq__panel";
      panel.hidden = true; panel.inert = true; panel.setAttribute("aria-hidden", "true");
      panel.setAttribute("role", "region"); panel.setAttribute("aria-labelledby", button.id);
      const inner = document.createElement("div"); inner.className = "lcdp-faq__reponse lcdp-boxtext__content lcdp-editorial-copy"; inner.setAttribute("data-lcdp-boxtext-content", ""); inner.appendChild(nettoyer(bloc.html));
      panel.appendChild(inner); titre.appendChild(button); article.append(titre, panel); racine.appendChild(article);
      const item = { button, panel, inner, article, animation: null, terminer: null }; elements.push(item);
      button.addEventListener("click", () => {
        if (button.getAttribute("aria-expanded") === "true") {
          void ouvrir(item, false);
        } else {
          cibler(item);
        }
      });
    }
    if (elements.length) {
      void ouvrir(elements[0], true, false);
    }
    controles.set(racine, () => {
      elements.forEach(item => item.terminer?.());
    });
    if (!elements.length) { const p = document.createElement("p"); p.textContent = "Aucune FAQ publiée pour le moment."; racine.appendChild(p); }
  }
  window.LCDP_FAQ = Object.freeze({ afficher });
})();
