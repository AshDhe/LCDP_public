const GALERIE_INSCRIPTION_MEMBRE = {
  titre: "Pourquoi devenir membre invité ?",
  classeSection: "section-galerie-compte",
  ariaLabel: "Pourquoi devenir membre invité ?",
  cartes: [
    {
      titre: "Faites-vous inviter",
      imageSrc: "/OBJETS/IMAGES/GALERIE/INSCRIPTION-MEMBRE/membre-invite.jpg",
      imageAlt: "Membre invité La Clé du Parc",
      imageLegende: "Image recomposée d'illustration - Non contractuelle",
      texte: "Accédez gratuitement à des espaces plein air d'exception grâce aux invitations de membres abonnés. Vous pouvez rester membre du club autant que vous souhaitez sous réserve de respecter le règlement du club."
    },
    {
      titre: "Venez vous ressourcer",
      imageSrc: "/OBJETS/IMAGES/GALERIE/INSCRIPTION-MEMBRE/petit-groupe.jpg",
      imageAlt: "Se ressourcer seul ou en groupe avec La Clé du Parc",
      imageLegende: "Image recomposée d'illustration - Non contractuelle",
      texte: "Prenez le temps de vous ressourcer et de partager vos passions dans un cadre calme, naturel et sécurisé. La Clé du Parc vous donne un accès contrôlé à des parcs plein air d'exception sélectionnés pour leur capacité à vous apporter une véritable respiration."
    },
    {
      titre: "Venez en famille",
      imageSrc: "/OBJETS/IMAGES/GALERIE/INSCRIPTION-MEMBRE/invite-famille.jpg",
      imageAlt: "Invité famille La Clé du Parc",
      imageLegende: "Image recomposée d'illustration - Non contractuelle",
      texte: "Partagez en famille des moments d'exception. Un membre qui est abonné famille peut inviter les membres de sa famille autant de fois que nécessaire. Sous réserve de respecter le règlement du club."
    },
    {
      titre: "Invité(e) par un coach",
      imageSrc: "/OBJETS/IMAGES/GALERIE/INSCRIPTION-MEMBRE/activite-coach.jpg",
      imageAlt: "Activités et coachs avec La Clé du Parc",
      imageLegende: "Image recomposée d'illustration - Non contractuelle",
      texte: "La Clé du Parc valorise les activités de plein air, les rencontres bénéfiques et un usage respectueux des lieux. En tant que membre invité, vous pouvez suivre votre coach dans le cadre d'activités qu'il organise à travers les parcs du réseau."
    },
    {
      titre: "Des moments uniques",
      imageSrc: "/OBJETS/IMAGES/GALERIE/INSCRIPTION-MEMBRE/vous-ressourcer.jpg",
      imageAlt: "Partager des moments uniques avec La Clé du Parc",
      imageLegende: "Image recomposée d'illustration - Non contractuelle",
      texte: "La Clé du Parc donne à ses membres un accès contrôlé à des parcs plein air d'exception sélectionnés pour leur capacité à vous faire ressentir des moments uniques. Autorisez vous à vivre de belles émotions le plus souvent possible."
    },
    {
      titre: "Des lieux d'émotion",
      imageSrc: "/OBJETS/IMAGES/GALERIE/INSCRIPTION-MEMBRE/lieux-inoubliables.jpg",
      imageAlt: "Des parcs d'exception avec La Clé du Parc",
      imageLegende: "Image recomposée d'illustration - Non contractuelle",
      texte: "La Clé du Parc sélectionne des parcs plein air d'exception choisis pour leur qualité esthétique remarquable et un environnement naturel et culturel à la fois original, préservé et prestigieux."
    }
  ]
};

(() => {
  const siteBase = (
    window.SITE_BASE ||
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.siteBase ||
    window.SITE_CONFIG?.PUBLIC_BASE ||
    ""
  ).replace(/\/$/, "");

  const siteRootRelative = window.SITE_ROOT_RELATIVE || "../../../";

  function construireUrlSite(chemin) {
    if (!chemin) return chemin;

    if (
      chemin.startsWith("#") ||
      chemin.startsWith("mailto:") ||
      chemin.startsWith("tel:") ||
      chemin.startsWith("http://") ||
      chemin.startsWith("https://")
    ) {
      return chemin;
    }

    if (siteBase) {
      return chemin.startsWith("/")
        ? siteBase + chemin
        : siteBase + "/" + chemin.replace(/^\.\//, "");
    }

    return chemin.startsWith("/")
      ? siteRootRelative.replace(/\/?$/, "/") + chemin.replace(/^\//, "")
      : chemin;
  }

  function corrigerCheminsSite(scope) {
    scope.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlSite(element.dataset.siteSrc));
    });

    scope.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.dataset.siteHref));
    });

    scope.querySelectorAll("a[href^='/']").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.getAttribute("href")));
    });

    scope.querySelectorAll("img[src^='/']").forEach((element) => {
      element.setAttribute("src", construireUrlSite(element.getAttribute("src")));
    });
  }

  async function chargerBlocHtml(idContainer, cheminBloc) {
    const container = document.getElementById(idContainer);

    if (!container) return;

    try {
      const reponse = await fetch(construireUrlSite(cheminBloc), {
        method: "GET",
        credentials: "same-origin",
        cache: "no-cache"
      });

      if (!reponse.ok) {
        throw new Error("Erreur HTTP " + reponse.status);
      }

      const html = await reponse.text();

      container.innerHTML = html;
      corrigerCheminsSite(container);

    } catch (erreur) {
      console.error("Erreur de chargement du bloc :", cheminBloc, erreur);
    }
  }

  function renseignerGalerie(configuration) {
    const section = document.querySelector("#galerie-container .section-galerie");
    const titre = document.querySelector("#galerie-container [data-galerie-titre]");
    const grille = document.querySelector("#galerie-container [data-galerie-grid]");

    if (!section || !titre || !grille || !configuration) return;

    if (configuration.classeSection) {
      section.classList.add(configuration.classeSection);
    }

    if (configuration.ariaLabel) {
      section.setAttribute("aria-label", configuration.ariaLabel);
    }

    titre.textContent = configuration.titre || "";

    grille.innerHTML = "";

    configuration.cartes.forEach((carte) => {
      const article = document.createElement("article");
      article.className = "galerie-card";

      const h3 = document.createElement("h3");
      h3.textContent = carte.titre;

      const image = document.createElement("img");
      image.src = construireUrlSite(carte.imageSrc);
      image.alt = carte.imageAlt || "";

      article.appendChild(h3);
      article.appendChild(image);

      if (carte.imageLegende) {
        const imageLegende = document.createElement("p");
        imageLegende.className = "image-legend";
        imageLegende.textContent = carte.imageLegende;
        article.appendChild(imageLegende);
      }

      const texte = document.createElement("p");
      texte.textContent = carte.texte;

      article.appendChild(texte);

      grille.appendChild(article);
    });
  }

  window.construireUrlSite = construireUrlSite;

  corrigerCheminsSite(document);

  chargerBlocHtml(
    "galerie-container",
    "/OBJETS/BLOCS/galerie.html"
  ).then(() => {
    renseignerGalerie(GALERIE_INSCRIPTION_MEMBRE);
  });
})();