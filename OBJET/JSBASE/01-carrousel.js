(() => {
  "use strict";

  function creerImageDefaut(index) {
    const titre = "La Clé du Parc";
    const sousTitre = "Image provisoire " + String(index + 1);

    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'>" +
      "<rect width='1200' height='675' fill='%23f7f7f4'/>" +
      "<rect x='42' y='42' width='1116' height='591' rx='32' fill='%23ffffff' stroke='%23d7ddd5' stroke-width='3'/>" +
      "<text x='90' y='310' font-family='Arial' font-size='58' font-weight='700' fill='%231f2a24'>" +
      titre +
      "</text>" +
      "<text x='90' y='390' font-family='Arial' font-size='36' fill='%235f6861'>" +
      sousTitre +
      "</text>" +
      "</svg>";

    return "data:image/svg+xml;charset=UTF-8," + svg;
  }

  function ajouterImagesParDefaut(liste) {
    for (let index = 0; index < 3; index += 1) {
      const figure = document.createElement("figure");
      figure.className = "lcdp-box-carousel__item";

      const image = document.createElement("img");
      image.className = "lcdp-box-carousel__image";
      image.src = creerImageDefaut(index);
      image.alt = "Image provisoire La Clé du Parc";
      image.loading = "lazy";
      image.decoding = "async";

      figure.appendChild(image);
      liste.appendChild(figure);
    }
  }

  // Chevrons géométriques : même centre que le cercle CSS de navigation.
  // Aucun décalage lié à la police, à la ligne de base ou au navigateur.
  function centrerChevron(bouton, direction) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 12 12");
    svg.setAttribute("width", "10");
    svg.setAttribute("height", "10");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    Object.assign(svg.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "10px",
      height: "10px",
      display: "block",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none"
    });
    const trace = document.createElementNS(ns, "path");
    trace.setAttribute("d", direction === "prev" ? "M 8 2 L 4 6 L 8 10" : "M 4 2 L 8 6 L 4 10");
    trace.setAttribute("fill", "none");
    trace.setAttribute("stroke", "currentColor");
    trace.setAttribute("stroke-width", "1.7");
    trace.setAttribute("stroke-linecap", "round");
    trace.setAttribute("stroke-linejoin", "round");
    svg.appendChild(trace);
    bouton.replaceChildren(svg);
  }

  function initialiserCarrousel(carrousel) {
    if (!carrousel || carrousel.dataset.lcdpCarouselInitialise === "true") {
      return;
    }

    const liste = carrousel.querySelector("[data-lcdp-carousel-list]");
    const boutonPrecedent = carrousel.querySelector("[data-lcdp-carousel-prev]");
    const boutonSuivant = carrousel.querySelector("[data-lcdp-carousel-next]");
    const dotsContainer = carrousel.querySelector("[data-lcdp-carousel-dots]");
    const legendElement = carrousel.querySelector("[data-lcdp-carousel-legend]");

    if (!liste || !boutonPrecedent || !boutonSuivant || !dotsContainer) {
      return;
    }

    if (!liste.querySelector(".lcdp-box-carousel__item")) {
      ajouterImagesParDefaut(liste);
    }

    const items = Array.from(liste.querySelectorAll(".lcdp-box-carousel__item"));

    if (items.length === 0) {
      return;
    }

    // Titres hors image, avec une zone stable et un fondu synchronisé.
    const textesTitres = items.map(item => {
      const titre = item.querySelector(".lcdp-box-carousel__overlay-title, .lcdp-box-carousel__slide-title");
      const texte = titre ? titre.textContent.trim() : "";
      if (titre) titre.remove();
      item.classList.remove("lcdp-box-carousel__item--with-title");
      return texte;
    });
    const titresDiapositives = [];
    let zoneTitres = null;
    if (textesTitres.some(Boolean)) {
      zoneTitres = document.createElement("div");
      zoneTitres.className = "lcdp-box-carousel__slide-titles";
      textesTitres.forEach((texte, index) => {
        const titre = document.createElement("p");
        titre.className = "lcdp-box-carousel__slide-title";
        titre.textContent = texte;
        titre.classList.toggle("is-active", index === 0);
        titre.setAttribute("aria-hidden", index === 0 ? "false" : "true");
        zoneTitres.appendChild(titre);
        titresDiapositives.push(titre);
      });
      carrousel.setAttribute("data-lcdp-carousel-slide-titles", "");
    }

    if (legendElement) {
      const legende = legendElement.textContent.trim();
      if (!legende) {
        legendElement.textContent = "Photos non contractuelles.";
      } else if (/^illustration\b.*\bIA\b/iu.test(legende.replace(/\s+/g, " "))) {
        legendElement.textContent = "Illustration IA";
      }
    }

    // Une légende individuelle est optionnelle. Les carrousels historiques gardent leur légende commune.
    const legendesIndividuelles = items.some(item => item.hasAttribute("data-lcdp-slide-legend"));
    const legendesDiapositives = items.map(item => item.dataset.lcdpSlideLegend || "");

    // Navigation sous la légende : les contrôles restent les mêmes éléments DOM.
    const navigation = document.createElement("div");
    navigation.className = "lcdp-box-carousel__navigation";
    dotsContainer.before(navigation);
    centrerChevron(boutonPrecedent, "prev");
    centrerChevron(boutonSuivant, "next");
    navigation.append(boutonPrecedent, dotsContainer, boutonSuivant);
    if (zoneTitres) navigation.before(zoneTitres);

    carrousel.dataset.lcdpCarouselInitialise = "true";

    let indexActif = 0;
    let autoplay = null;

    dotsContainer.innerHTML = "";

    items.forEach((item, index) => {
      item.dataset.lcdpCarouselIndex = String(index);
      item.classList.toggle("is-active", index === 0);
      item.setAttribute("aria-hidden", index === 0 ? "false" : "true");

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "lcdp-box-carousel__dot";
      dot.setAttribute("aria-label", "Afficher l’image " + String(index + 1));

      if (index === 0) {
        dot.classList.add("is-active");
      }

      dot.addEventListener("click", () => {
        afficherIndex(index);
        relancerAutoplay();
      });

      dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.querySelectorAll(".lcdp-box-carousel__dot"));

    function afficherIndex(index) {
      if (!items[index]) {
        return;
      }

      indexActif = index;

      if (legendElement && legendesIndividuelles) {
        const legende = legendesDiapositives[indexActif];
        legendElement.textContent = legende;
        legendElement.hidden = !legende.trim();
      }

      items.forEach((item, itemIndex) => {
        const actif = itemIndex === indexActif;
        item.classList.toggle("is-active", actif);
        item.setAttribute("aria-hidden", actif ? "false" : "true");
      });

      titresDiapositives.forEach((titre, titreIndex) => {
        const actif = titreIndex === indexActif;
        titre.classList.toggle("is-active", actif);
        titre.setAttribute("aria-hidden", actif ? "false" : "true");
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === indexActif);
      });
    }

    function afficherSuivant() {
      const prochainIndex = (indexActif + 1) % items.length;
      afficherIndex(prochainIndex);
    }

    function afficherPrecedent() {
      const precedentIndex = (indexActif - 1 + items.length) % items.length;
      afficherIndex(precedentIndex);
    }

    function lancerAutoplay() {
      if (items.length <= 1 || autoplay) {
        return;
      }

      autoplay = window.setInterval(afficherSuivant, 5000);
    }

    function arreterAutoplay() {
      if (autoplay) {
        window.clearInterval(autoplay);
        autoplay = null;
      }
    }

    function relancerAutoplay() {
      arreterAutoplay();
      lancerAutoplay();
    }

    boutonSuivant.addEventListener("click", () => {
      afficherSuivant();
      relancerAutoplay();
    });

    boutonPrecedent.addEventListener("click", () => {
      afficherPrecedent();
      relancerAutoplay();
    });

    // Balayage tactile sur l'image : même navigation que les flèches.
    // Ne jamais intercepter le défilement vertical ni le pincement de zoom.
    const viewport = liste.closest(".lcdp-box-carousel__viewport") || liste;
    if (items.length > 1) {
      let geste = null;
      const retrouverToucher = (touches, identifiant) =>
        Array.from(touches).find(toucher => toucher.identifier === identifiant);

      function terminerGeste() {
        if (!geste) return;
        geste = null;
        relancerAutoplay();
      }

      viewport.addEventListener("touchstart", event => {
        if (event.touches.length !== 1) {
          terminerGeste();
          return;
        }
        const toucher = event.touches[0];
        geste = { id: toucher.identifier, x: toucher.clientX, y: toucher.clientY, axe: null };
        arreterAutoplay();
      }, { passive: true });

      viewport.addEventListener("touchmove", event => {
        if (!geste) return;
        if (event.touches.length !== 1) {
          terminerGeste();
          return;
        }
        const toucher = retrouverToucher(event.touches, geste.id);
        if (!toucher) return;
        const dx = toucher.clientX - geste.x;
        const dy = toucher.clientY - geste.y;
        if (!geste.axe && Math.max(Math.abs(dx), Math.abs(dy)) >= 10) {
          geste.axe = Math.abs(dx) > Math.abs(dy) * 1.25 ? "horizontal" : "vertical";
        }
        if (geste.axe === "horizontal" && event.cancelable) event.preventDefault();
      }, { passive: false });

      viewport.addEventListener("touchend", event => {
        if (!geste) return;
        const toucher = retrouverToucher(event.changedTouches, geste.id);
        if (!toucher) return;
        const dx = toucher.clientX - geste.x;
        const dy = toucher.clientY - geste.y;
        if (geste.axe !== "vertical" && Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          if (dx < 0) afficherSuivant();
          else afficherPrecedent();
        }
        terminerGeste();
      }, { passive: true });

      viewport.addEventListener("touchcancel", terminerGeste, { passive: true });
    }

    carrousel.addEventListener("mouseenter", arreterAutoplay);
    carrousel.addEventListener("mouseleave", lancerAutoplay);

    afficherIndex(0);
    lancerAutoplay();
  }

  window.LCDP_initialiserCarrousels = function (racine = document) {
    racine.querySelectorAll("[data-lcdp-box-carousel]").forEach(initialiserCarrousel);
  };
})();