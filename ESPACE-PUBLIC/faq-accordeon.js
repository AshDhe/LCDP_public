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
    // Le contenu de la FAQ défile dans le main du wrapper.
    const defilement = racine.closest(".lcdp-site-main") || document.scrollingElement;
    let imageDeCorrection = 0;

    function ouvrir(item, ouvert) {
      item.button.setAttribute("aria-expanded", String(ouvert));
      item.panel.hidden = !ouvert;
      item.panel.inert = !ouvert;
      item.panel.setAttribute("aria-hidden", String(!ouvert));
    }

    function maintenirQuestion(item, positionInitiale) {
      // Conserver la position de la question lorsque le conteneur peut défiler,
      // sans créer d'espace artificiel au-dessus de la FAQ.
      const ecart = item.button.getBoundingClientRect().top - positionInitiale;
      if (defilement && Math.abs(ecart) > 0.5) defilement.scrollTop += ecart;
    }

    function basculer(item) {
      const position = item.button.getBoundingClientRect().top;
      const estOuvert = item.button.getAttribute("aria-expanded") === "true";

      // Le nouvel élément s'ouvre et le précédent se ferme sans
      // deux animations de hauteur qui déplacent la position à l'écran.
      if (!estOuvert) ouvrir(item, true);
      for (const autre of elements) {
        if (autre !== item && !autre.panel.hidden) ouvrir(autre, false);
      }
      if (estOuvert) ouvrir(item, false);

      maintenirQuestion(item, position);
      if (imageDeCorrection) window.cancelAnimationFrame(imageDeCorrection);
      imageDeCorrection = window.requestAnimationFrame(() => {
        imageDeCorrection = 0;
        maintenirQuestion(item, position);
      });
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
      const item = { button, panel, inner, article }; elements.push(item);
      button.addEventListener("click", () => basculer(item));
    }
    if (elements.length) {
      ouvrir(elements[0], true);
    }
    controles.set(racine, () => {
      if (imageDeCorrection) window.cancelAnimationFrame(imageDeCorrection);
    });
    if (!elements.length) { const p = document.createElement("p"); p.textContent = "Aucune FAQ publiée pour le moment."; racine.appendChild(p); }
  }
  window.LCDP_FAQ = Object.freeze({ afficher });
})();
