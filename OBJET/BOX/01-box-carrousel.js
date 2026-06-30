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

  function initialiserCarrousel(carrousel) {
    if (!carrousel || carrousel.dataset.lcdpCarouselInitialise === "true") {
      return;
    }

    const liste = carrousel.querySelector("[data-lcdp-carousel-list]");
    const boutonPrecedent = carrousel.querySelector("[data-lcdp-carousel-prev]");
    const boutonSuivant = carrousel.querySelector("[data-lcdp-carousel-next]");
    const dotsContainer = carrousel.querySelector("[data-lcdp-carousel-dots]");

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

      items.forEach((item, itemIndex) => {
        const actif = itemIndex === indexActif;
        item.classList.toggle("is-active", actif);
        item.setAttribute("aria-hidden", actif ? "false" : "true");
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

    carrousel.addEventListener("mouseenter", arreterAutoplay);
    carrousel.addEventListener("mouseleave", lancerAutoplay);

    lancerAutoplay();
  }

  window.LCDP_initialiserCarrousels = function (racine = document) {
    racine.querySelectorAll("[data-lcdp-box-carousel]").forEach(initialiserCarrousel);
  };
})();