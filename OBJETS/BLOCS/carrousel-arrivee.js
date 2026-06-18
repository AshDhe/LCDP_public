const SCRIPT_SRC_CARROUSEL_ARRIVEE = document.currentScript?.src || "";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", chargerCarrouselArrivee);
} else {
  chargerCarrouselArrivee();
}

async function chargerCarrouselArrivee() {
  const container = document.getElementById("carousel-container");

  if (!container) return;

  try {
    const response = await fetch(
      construireUrlCarrousel("/OBJETS/BLOCS/carrousel-arrivee.html"),
      {
        method: "GET",
        cache: "no-cache"
      }
    );

    if (!response.ok) {
      throw new Error("Impossible de charger le carrousel");
    }

    container.innerHTML = await response.text();

    corrigerImagesCarrousel(container);
    initCarrousel(container);

  } catch (error) {
    console.error("Erreur de chargement du carrousel :", error);
  }
}

function obtenirBasePubliqueCarrousel() {
  const config = window.SITE_CONFIG || {};

  const basesPossibles = [
    config.publicBaseUrl,
    config.PUBLIC_BASE,
    extraireBaseDepuisScriptCarrousel(),
    config.siteBase,
    window.SITE_BASE
  ];

  for (const base of basesPossibles) {
    const valeur = String(base || "").trim().replace(/\/+$/, "");

    if (valeur) {
      return valeur;
    }
  }

  return "";
}

function extraireBaseDepuisScriptCarrousel() {
  if (!SCRIPT_SRC_CARROUSEL_ARRIVEE) return "";

  const marker = "/OBJETS/BLOCS/carrousel-arrivee.js";
  const index = SCRIPT_SRC_CARROUSEL_ARRIVEE.indexOf(marker);

  if (index === -1) return "";

  return SCRIPT_SRC_CARROUSEL_ARRIVEE.slice(0, index).replace(/\/+$/, "");
}

function construireUrlCarrousel(path) {
  const base = obtenirBasePubliqueCarrousel();
  const chemin = "/" + String(path || "").replace(/^\/+/, "");

  if (!base) {
    return chemin;
  }

  return base + chemin;
}

function corrigerImagesCarrousel(scope) {
  scope.querySelectorAll("img[src]").forEach((image) => {
    const src = image.getAttribute("src");

    if (!src) return;
    if (src.startsWith("data:")) return;
    if (src.startsWith("blob:")) return;
    if (/^https?:\/\//i.test(src)) return;

    if (src.startsWith("/")) {
      image.setAttribute("src", construireUrlCarrousel(src));
    }
  });
}

function initCarrousel(container) {
  const carousel = container.querySelector(".carousel");
  const images = Array.from(container.querySelectorAll(".carousel-track img"));
  const prevButton = container.querySelector(".carousel-btn.prev");
  const nextButton = container.querySelector(".carousel-btn.next");
  const dotsContainer = container.querySelector(".carousel-dots");

  if (!carousel || images.length === 0 || !prevButton || !nextButton || !dotsContainer) {
    return;
  }

  let currentIndex = 0;
  let autoPlay = null;

  dotsContainer.innerHTML = "";

  images.forEach((image, index) => {
    image.classList.toggle("active", index === 0);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Afficher l’image ${index + 1}`);

    if (index === 0) {
      dot.classList.add("active");
    }

    dot.addEventListener("click", () => {
      afficherImage(index);
      relancerAutoPlay();
    });

    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.querySelectorAll("button"));

  function afficherImage(index) {
    images[currentIndex].classList.remove("active");
    dots[currentIndex].classList.remove("active");

    currentIndex = index;

    images[currentIndex].classList.add("active");
    dots[currentIndex].classList.add("active");
  }

  function afficherImageSuivante() {
    const nextIndex = (currentIndex + 1) % images.length;
    afficherImage(nextIndex);
  }

  function afficherImagePrecedente() {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    afficherImage(prevIndex);
  }

  function lancerAutoPlay() {
    if (images.length <= 1) return;

    autoPlay = window.setInterval(afficherImageSuivante, 5000);
  }

  function arreterAutoPlay() {
    if (autoPlay) {
      window.clearInterval(autoPlay);
      autoPlay = null;
    }
  }

  function relancerAutoPlay() {
    arreterAutoPlay();
    lancerAutoPlay();
  }

  nextButton.addEventListener("click", () => {
    afficherImageSuivante();
    relancerAutoPlay();
  });

  prevButton.addEventListener("click", () => {
    afficherImagePrecedente();
    relancerAutoPlay();
  });

  carousel.addEventListener("mouseenter", arreterAutoPlay);
  carousel.addEventListener("mouseleave", lancerAutoPlay);

  lancerAutoPlay();
}