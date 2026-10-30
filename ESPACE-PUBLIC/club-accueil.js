(() => {
  "use strict";
  const section = document.getElementById("le-club");
  const box = document.getElementById("lcdp-actualite-bandeau");
  if (!section || !box) return;
  let chargement, ouverture;

  function urlSite(path) {
    const cfg = window.SITE_CONFIG || {};
    if (typeof cfg.publicUrl === "function") return cfg.publicUrl(path);
    const base = String(cfg.publicBaseUrl || cfg.PUBLIC_BASE || window.SITE_BASE || "").replace(/\/+$/, "");
    return new URL(base ? base + path : ".." + path, document.baseURI).href;
  }

  function urlObjet(path) {
    const cfg = window.SITE_CONFIG || {};
    if (typeof cfg.objetUrl === "function") return cfg.objetUrl(path);
    const base = String(cfg.objetBaseUrl || cfg.OBJET_BASE || "").replace(/\/+$/, "");
    return base ? base + path : urlSite("/OBJET" + path);
  }

  function chargerRessource(tag, url) {
    const attr = tag === "link" ? "href" : "src";
    const absolue = new URL(url, document.baseURI).href;
    if ([...document.querySelectorAll(tag + "[" + attr + "]")].some(el => el[attr] === absolue)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const el = document.createElement(tag);
      if (tag === "link") el.rel = "stylesheet";
      el[attr] = absolue;
      el.onload = resolve;
      el.onerror = () => { el.remove(); reject(new Error("Chargement du Club impossible.")); };
      document.head.appendChild(el);
    });
  }

  async function chargerClub() {
    const response = await fetch(urlSite("/ESPACE-PUBLIC/le-club.html"), { credentials: "same-origin", cache: "no-cache" });
    if (!response.ok) throw new Error("Le contenu du Club est indisponible.");
    const source = await response.text();
    const doc = new DOMParser().parseFromString(source, "text/html");
    const contenu = doc.querySelector("main");
    if (!contenu) throw new Error("Le contenu du Club est indisponible.");
    const css = [...doc.querySelectorAll('link[rel="stylesheet"]')].map(el => {
      const path = el.getAttribute("data-site-href") || el.getAttribute("href");
      return path.startsWith("/OBJET/") ? urlObjet(path.slice(6)) : new URL(path, urlSite("/ESPACE-PUBLIC/le-club.html")).href;
    });
    await Promise.all(css.map(url => chargerRessource("link", url)));
    await chargerRessource("script", urlObjet("/BOX/01-box-carrousel.js"));
    contenu.querySelectorAll("script").forEach(el => el.remove());
    contenu.querySelectorAll("[data-site-href], [data-site-src], a[href], img[src]").forEach(el => {
      const attr = el.tagName === "IMG" ? "src" : "href";
      const path = el.getAttribute("data-site-" + attr) || el.getAttribute(attr);
      if (path && !path.startsWith("#")) el.setAttribute(attr, path.startsWith("/") ? urlSite(path) : new URL(path, urlSite("/ESPACE-PUBLIC/le-club.html")).href);
    });
    section.replaceChildren(...[...contenu.childNodes].map(el => document.importNode(el, true)));
    const slot = section.querySelector("#lcdp-carrousel-hello-slot");
    if (slot) {
      const scripts = [...doc.querySelectorAll("script:not([src])")].map(el => el.textContent).join("\n");
      const match = scripts.match(/const IMAGES_CARROUSEL_HELLO\s*=\s*(\[[\s\S]*?\]);/);
      if (!match) throw new Error("Les images du Club sont indisponibles.");
      const images = JSON.parse(match[1]
        .replace(/([{,]\s*)(src|alt|texte)\s*:/g, '$1"$2":')
        .replace(/,\s*([}\]])/g, "$1"));
      creerCarrousel(slot, images);
    }
  }

  function creerCarrousel(slot, images) {
    slot.innerHTML = '<section class="lcdp-component lcdp-box-carousel" data-lcdp-box-carousel><div class="lcdp-box-carousel__frame" data-lcdp-carousel-frame><div class="lcdp-box-carousel__viewport"><div class="lcdp-box-carousel__list" data-lcdp-carousel-list></div></div><button class="lcdp-box-carousel__button lcdp-box-carousel__button--prev" type="button" aria-label="Image précédente" data-lcdp-carousel-prev>‹</button><button class="lcdp-box-carousel__button lcdp-box-carousel__button--next" type="button" aria-label="Image suivante" data-lcdp-carousel-next>›</button></div><p class="lcdp-image-legend" data-lcdp-carousel-legend>Illustration recomposée par IA - Non contractuelle</p><div class="lcdp-box-carousel__dots" aria-label="Navigation carrousel" data-lcdp-carousel-dots></div></section>';
    const liste = slot.querySelector("[data-lcdp-carousel-list]");
    images.forEach((image, index) => {
      const figure = document.createElement("figure");
      figure.className = "lcdp-box-carousel__item" + (index === 0 ? " is-active" : "");
      figure.setAttribute("aria-hidden", index === 0 ? "false" : "true");
      const img = document.createElement("img");
      img.className = "lcdp-box-carousel__image";
      img.src = urlSite(image.src); img.alt = image.alt || "";
      img.decoding = "async"; img.loading = "lazy";
      figure.append(img);
      if (image.texte) {
        const titre = document.createElement("figcaption");
        titre.className = "lcdp-box-carousel__overlay-title";
        titre.textContent = image.texte;
        figure.append(titre); figure.classList.add("lcdp-box-carousel__item--with-title");
      }
      liste.append(figure);
    });
  }

  function ouvrirClub() {
    if (ouverture) return ouverture;
    ouverture = (async () => {
      if (!chargement) chargement = chargerClub().catch(error => { chargement = null; throw error; });
      await chargement;
      section.hidden = false;
      if (typeof window.LCDP_initialiserCarrousels === "function" && !section.dataset.carrouselInitialise) {
        window.LCDP_initialiserCarrousels(section);
        section.dataset.carrouselInitialise = "true";
      }
      if (location.hash !== "#le-club") history.pushState(null, "", "#le-club");
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const header = document.querySelector(".lcdp-box-bandeau-nav");
      const top = section.getBoundingClientRect().top + window.scrollY - (header ? header.getBoundingClientRect().height : 72) - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    })().catch(error => {
      console.error(error);
      alert("Le Club n’a pas pu être chargé. Cliquez à nouveau pour réessayer.");
    }).finally(() => { ouverture = null; });
    return ouverture;
  }

  box.addEventListener("click", event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); ouvrirClub();
  });
  window.addEventListener("hashchange", () => {
    if (location.hash === "#le-club") ouvrirClub();
    else section.hidden = true;
  });
  const navigation = performance.getEntriesByType("navigation")[0];
  if (navigation?.type === "reload") {
    section.hidden = true;
    if (location.hash === "#le-club") history.replaceState(history.state, "", location.pathname + location.search);
    const revenirEnHaut = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    };
    if (document.readyState === "complete") revenirEnHaut();
    else window.addEventListener("load", revenirEnHaut, { once: true });
  } else if (location.hash === "#le-club") {
    if (document.readyState === "complete") ouvrirClub();
    else window.addEventListener("load", ouvrirClub, { once: true });
  }
})();
