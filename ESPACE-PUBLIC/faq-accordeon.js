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
  function ancre(bloc) {
    const id = String(bloc?.id || "").trim().toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
    return id ? "faq-" + id : "";
  }
  function afficher(racine, blocs) {
    controles.get(racine)?.();
    racine.replaceChildren();
    racine.classList.add("lcdp-faq");
    const elements = [];
    const liensDirects = /\/FAQ-(?:public|membre)\.html$/i.test(window.location.pathname);
    const prefixe = "lcdp-faq-" + (++compteur);
    let navigation = 0;
    function ouvrir(item, ouvert) {
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
        if (reduit || !item.panel.animate) { finir(); return; }
        item.animation = item.panel.animate([{ height: hauteurInitiale + "px" }, { height: hauteurFinale + "px" }], { duration: 220, easing: "ease-out" });
        item.terminer = finir;
        item.animation.onfinish = finir;
      });
    }
    async function cibler(item, defiler = false) {
      const sequence = ++navigation;
      await Promise.all(elements.map(autre => ouvrir(autre, autre === item)));
      if (sequence !== navigation || !defiler) return;
      item.article.scrollIntoView({ behavior: "auto", block: "start" });
      item.button.focus({ preventScroll: true });
    }
    function depuisHash() {
      let id;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const item = elements.find(element => element.ancre === id);
      if (item) void cibler(item, true);
    }
    function actualiserAdresse(item, ajouter = true) {
      if (!liensDirects || !item.ancre) return;
      const url = new URL(window.location.href); url.hash = item.ancre;
      if (url.href !== window.location.href) window.history[ajouter ? "pushState" : "replaceState"](null, "", url.href);
    }
    for (const bloc of Array.isArray(blocs) ? blocs : []) {
      if (!String(bloc.titre || "").trim()) continue;
      const idAncre = ancre(bloc);
      const id = prefixe + "-" + elements.length;
      const article = document.createElement("section"); article.className = "lcdp-faq__item";
      article.id = idAncre || id;
      const titre = document.createElement("h2"); titre.className = "lcdp-faq__heading";
      const button = document.createElement("button"); button.type = "button"; button.className = "lcdp-faq__question";
      button.id = id + "-question"; button.textContent = bloc.titre;
      button.setAttribute("aria-expanded", "false"); button.setAttribute("aria-controls", id + "-reponse");
      const panel = document.createElement("div"); panel.id = id + "-reponse"; panel.className = "lcdp-faq__panel";
      panel.hidden = true; panel.inert = true; panel.setAttribute("aria-hidden", "true");
      panel.setAttribute("role", "region"); panel.setAttribute("aria-labelledby", button.id);
      const inner = document.createElement("div"); inner.className = "lcdp-faq__reponse"; inner.appendChild(nettoyer(bloc.html));
      panel.appendChild(inner); titre.appendChild(button); article.append(titre, panel); racine.appendChild(article);
      const item = { button, panel, inner, article, ancre: idAncre, animation: null, terminer: null }; elements.push(item);
      button.addEventListener("click", () => {
        if (button.getAttribute("aria-expanded") === "true") {
          ++navigation; void ouvrir(item, false);
          if (liensDirects && window.location.hash === "#" + item.ancre) {
            const url = new URL(window.location.href); url.hash = ""; window.history.replaceState(null, "", url.href);
          }
        } else { actualiserAdresse(item); void cibler(item); }
      });
    }
    function suivreLien(event) {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const lien = event.target.closest?.("a[href]");
      if (!lien || (lien.target && lien.target !== "_self") || lien.hasAttribute("download")) return;
      let url, id;
      try { url = new URL(lien.href, window.location.href); id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
      const local = lien.getAttribute("href").startsWith("#") || (url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search);
      const item = local && elements.find(element => element.ancre === id);
      if (!item) return;
      event.preventDefault(); actualiserAdresse(item); void cibler(item, true);
    }
    racine.addEventListener("click", suivreLien);
    if (liensDirects) {
      window.addEventListener("hashchange", depuisHash);
      window.addEventListener("popstate", depuisHash);
      depuisHash();
    }
    controles.set(racine, () => {
      ++navigation;
      elements.forEach(item => item.terminer?.());
      racine.removeEventListener("click", suivreLien);
      window.removeEventListener("hashchange", depuisHash);
      window.removeEventListener("popstate", depuisHash);
    });
    if (!elements.length) { const p = document.createElement("p"); p.textContent = "Aucune FAQ publiée pour le moment."; racine.appendChild(p); }
  }
  window.LCDP_FAQ = Object.freeze({ afficher, ancre });
})();
