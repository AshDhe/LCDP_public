(() => {
  "use strict";

  const siteBase = (
    window.SITE_BASE ||
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.siteBase ||
    ""
  ).replace(/\/$/, "");

  function construireUrlSite(chemin) {
    if (!chemin) return chemin;

    if (
      chemin.startsWith("#") ||
      chemin.startsWith("mailto:") ||
      chemin.startsWith("tel:") ||
      chemin.startsWith("http://") ||
      chemin.startsWith("https://") ||
      chemin.startsWith("data:")
    ) {
      return chemin;
    }

    if (siteBase) {
      return chemin.startsWith("/")
        ? siteBase + chemin
        : siteBase + "/" + chemin.replace(/^\.\//, "");
    }

    return chemin.startsWith("/") ? ".." + chemin : chemin;
  }

  function cheminImageGalerie(nomFichier) {
    return construireUrlSite("/OBJET/IMAG/GALERIE/INSCRIPTION-MEMBRE/" + nomFichier);
  }

  function appliquerRoutesSite(racine = document) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.dataset.siteHref));
    });

    racine.querySelectorAll("[data-site-src]").forEach((element) => {
      element.setAttribute("src", construireUrlSite(element.dataset.siteSrc));
    });

    racine.querySelectorAll("a[href^='/']").forEach((element) => {
      element.setAttribute("href", construireUrlSite(element.getAttribute("href")));
    });

    racine.querySelectorAll("img[src^='/']").forEach((element) => {
      element.setAttribute("src", construireUrlSite(element.getAttribute("src")));
    });
  }

  async function chargerFragment(chemin) {
    const reponse = await fetch(construireUrlSite(chemin), {
      method: "GET",
      credentials: "same-origin",
      cache: "no-cache"
    });

    if (!reponse.ok) {
      throw new Error("Fragment introuvable : " + chemin);
    }

    const html = await reponse.text();
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.cloneNode(true);
  }

  function chargerScriptUneFois(chemin) {
    const src = construireUrlSite(chemin);

    if (document.querySelector(`script[data-lcdp-script="${chemin}"]`)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.dataset.lcdpScript = chemin;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Script introuvable : " + chemin));
      document.body.appendChild(script);
    });
  }

  async function initialiserBandeau() {
    const slot = document.getElementById("lcdp-bandeau-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const bandeau = await chargerFragment("/ESPACE-PUBLIC/box-bandeau-nav-public.html");
    slot.appendChild(bandeau);

    appliquerRoutesSite(slot);

    await chargerScriptUneFois("/ESPACE-PUBLIC/box-menu-burger-public.js");

    if (typeof window.LCDP_initialiserMenuBurgerPublic === "function") {
      await window.LCDP_initialiserMenuBurgerPublic();
    }
  }

  async function initialiserFooter() {
    const slot = document.getElementById("lcdp-footer-slot");

    if (!slot) {
      return;
    }

    slot.innerHTML = "";

    const footer = await chargerFragment("/OBJET/BOX/02-box-footer.html");
    slot.appendChild(footer);

    appliquerRoutesSite(slot);
  }

  async function ajouterBoxText(slotId, titre, contenuHtml, options = {}) {
    const slot = document.getElementById(slotId);

    if (!slot) {
      throw new Error("Slot introuvable : " + slotId);
    }

    slot.innerHTML = "";

    const fragment = await chargerFragment("/OBJET/BOX/01-box-text.html");
    slot.appendChild(fragment);

    const box = slot.querySelector("[data-lcdp-boxtext]");
    const titreElement = slot.querySelector("[data-lcdp-boxtext-title]");
    const contenuElement = slot.querySelector("[data-lcdp-boxtext-content]");

    if (!box || !titreElement || !contenuElement) {
      throw new Error("Structure du bloc texte V3 incomplète.");
    }

    titreElement.textContent = titre;

    if (options.titreCentre === true) {
      box.setAttribute("data-lcdp-boxtext-align", "center");
      titreElement.classList.add("lcdp-boxtext__title--center");
    }

    contenuElement.innerHTML = contenuHtml;

    appliquerRoutesSite(slot);

    return contenuElement;
  }

  function remplirLibelleBouton(element, bouton) {
    element.textContent = "";

    if (Array.isArray(bouton.labelLignes) && bouton.labelLignes.length > 0) {
      bouton.labelLignes.forEach((ligne, index) => {
        if (index > 0) {
          element.appendChild(document.createElement("br"));
        }
        element.appendChild(document.createTextNode(ligne));
      });
      return;
    }

    element.textContent = bouton.label || "";
  }

  async function ajouterMenuBoutonsDansElement(conteneur, boutons, options = {}) {
    if (!conteneur) {
      throw new Error("Conteneur menu bouton introuvable.");
    }

    const fragment = await chargerFragment("/OBJET/BOX/02-box-menu-bouton.html");
    const menu = fragment.querySelector("[data-lcdp-box-menu-bouton]");
    const liste = fragment.querySelector("[data-lcdp-menu-bouton-list]");

    if (!menu || !liste) {
      throw new Error("Structure du menu bouton V3 incomplète.");
    }

    if (options.ariaLabel) {
      menu.setAttribute("aria-label", options.ariaLabel);
    }

    if (options.single === true) {
      liste.classList.add("lcdp-box-menu-bouton__list--single");
    }

    boutons.forEach((bouton) => {
      const lien = document.createElement("a");
      lien.className = "lcdp-button " + bouton.style;
      remplirLibelleBouton(lien, bouton);
      lien.href = construireUrlSite(bouton.href);

      liste.appendChild(lien);
    });

    conteneur.appendChild(fragment);
    appliquerRoutesSite(conteneur);
  }

  async function ajouterGalerie(slotId, configuration) {
    if (typeof window.LCDP_ajouterGalerie !== "function") {
      throw new Error("Objet galerie V3 introuvable.");
    }

    await window.LCDP_ajouterGalerie(slotId, configuration);
  }

  async function initialiserPage() {
    appliquerRoutesSite(document);

    await initialiserBandeau();

    const boxHaut = await ajouterBoxText(
      "lcdp-boxtext-haut-slot",
      "Bénéficiez de La Clé du Parc sans payer d'abonnement",
      `
        <p>
          En devenant membre invité La Clé du Parc, vous bénéficiez gratuitement d'un accès nominatif à l'ensemble des parcs du club. Aucune limite ne s'applique au nombre d'invitations que vous recevez, ni au nombre de membres abonnés qui peuvent vous inviter et vous restez membre aussi longtemps que vous souhaitez, sous réserve de respecter le règlement du club.
        </p>

        <p>
          Consultez le
          <a
            class="lcdp-link-secondary"
            href="/ESPACE-PUBLIC/reglement-club.html?source=inscription-membre"
          >règlement du club</a>
          et le
          <a
            class="lcdp-link-secondary"
            href="/ESPACE-PUBLIC/reglement-app.html?source=inscription-membre"
          >règlement de l'application</a>
          pour en savoir plus.
        </p>

        <div data-inscription-menu-ouverture></div>

        <p class="lcdp-boxtext__text--center">
          <strong>Déjà membre du club ?</strong><br>
          Connectez-vous ici.
        </p>

        <div data-inscription-menu-connexion></div>
      `,
      {
        titreCentre: true
      }
    );

    await ajouterMenuBoutonsDansElement(
      boxHaut.querySelector("[data-inscription-menu-ouverture]"),
      [
        {
          labelLignes: ["J’ouvre mon compte", "de membre invité"],
          href: "/ESPACE-PUBLIC/formulaire-inscription-membre.html?source=inscription-membre",
          style: "lcdp-button-primary"
        }
      ],
      {
        single: true,
        ariaLabel: "Ouverture du compte invité"
      }
    );

    await ajouterMenuBoutonsDansElement(
      boxHaut.querySelector("[data-inscription-menu-connexion]"),
      [
        {
          label: "Connexion membre",
          href: "/ESPACE-PUBLIC/connexion-membre.html?source=inscription-membre",
          style: "lcdp-button-secondary"
        }
      ],
      {
        single: true,
        ariaLabel: "Connexion membre existant"
      }
    );

    await ajouterGalerie(
      "lcdp-galerie-invitation-slot",
      {
        titre: "Pourquoi devenir membre invité ?",
        ariaLabel: "Pourquoi devenir membre invité ?",
        cartes: [
          {
            titre: "Faites-vous inviter",
            imageSrc: cheminImageGalerie("membre-invite.jpg"),
            imageAlt: "Membre invité La Clé du Parc",
            imageLegende: "Image recomposée d'illustration - Non contractuelle",
            texte: "Accédez gratuitement à des espaces plein air d'exception grâce aux invitations de membres abonnés. Vous pouvez rester membre du club autant que vous souhaitez sous réserve de respecter le règlement du club."
          },
          {
            titre: "Venez vous ressourcer",
            imageSrc: cheminImageGalerie("petit-groupe.jpg"),
            imageAlt: "Se ressourcer seul ou en groupe avec La Clé du Parc",
            imageLegende: "Image recomposée d'illustration - Non contractuelle",
            texte: "Prenez le temps de vous ressourcer et de partager vos passions dans un cadre calme, naturel et sécurisé. La Clé du Parc vous donne un accès contrôlé à des parcs plein air d'exception sélectionnés pour leur capacité à vous apporter une véritable respiration."
          },
          {
            titre: "Venez en famille",
            imageSrc: cheminImageGalerie("invite-famille.jpg"),
            imageAlt: "Invité famille La Clé du Parc",
            imageLegende: "Image recomposée d'illustration - Non contractuelle",
            texte: "Partagez en famille des moments d'exception. Un membre qui est abonné famille peut inviter les membres de sa famille autant de fois que nécessaire. Sous réserve de respecter le règlement du club."
          },
          {
            titre: "Invité(e) par un coach",
            imageSrc: cheminImageGalerie("activite-coach.jpg"),
            imageAlt: "Activités et coachs avec La Clé du Parc",
            imageLegende: "Image recomposée d'illustration - Non contractuelle",
            texte: "La Clé du Parc valorise les activités de plein air, les rencontres bénéfiques et un usage respectueux des lieux. En tant que membre invité, vous pouvez suivre votre coach dans le cadre d'activités qu'il organise à travers les parcs du réseau."
          },
          {
            titre: "Des moments uniques",
            imageSrc: cheminImageGalerie("vous-ressourcer.jpg"),
            imageAlt: "Partager des moments uniques avec La Clé du Parc",
            imageLegende: "Image recomposée d'illustration - Non contractuelle",
            texte: "La Clé du Parc donne à ses membres un accès contrôlé à des parcs plein air d'exception sélectionnés pour leur capacité à vous faire ressentir des moments uniques. Autorisez-vous à vivre de belles émotions le plus souvent possible."
          },
          {
            titre: "Des lieux d'émotion",
            imageSrc: cheminImageGalerie("lieux-inoubliables.jpg"),
            imageAlt: "Des parcs d'exception avec La Clé du Parc",
            imageLegende: "Image recomposée d'illustration - Non contractuelle",
            texte: "La Clé du Parc sélectionne des parcs plein air d'exception choisis pour leur qualité esthétique remarquable et un environnement naturel et culturel à la fois original, préservé et prestigieux."
          }
        ]
      }
    );

    const boxCommentCaMarche = await ajouterBoxText(
      "lcdp-boxtext-comment-ca-marche-slot",
      "Comment ça marche ?",
      `
        <div data-inscription-menu-informations></div>
      `,
      {
        titreCentre: true
      }
    );

    await ajouterMenuBoutonsDansElement(
      boxCommentCaMarche.querySelector("[data-inscription-menu-informations]"),
      [
        {
          label: "Contrôle des accès",
          href: "/ESPACE-PUBLIC/controle-des-acces.html?source=inscription-membre",
          style: "lcdp-button-primary"
        },
        {
          label: "Le club et l'association",
          href: "/ESPACE-PUBLIC/la-cle-du-parc.html?source=inscription-membre",
          style: "lcdp-button-primary"
        },
        {
          label: "Le règlement du club",
          href: "/ESPACE-PUBLIC/reglement-club.html?source=inscription-membre",
          style: "lcdp-button-primary"
        },
        {
          label: "Le règlement de l’application",
          href: "/ESPACE-PUBLIC/reglement-app.html?source=inscription-membre",
          style: "lcdp-button-primary"
        },
        {
          labelLignes: ["J’ouvre mon compte", "de membre invité"],
          href: "/ESPACE-PUBLIC/formulaire-inscription-membre.html?source=inscription-membre",
          style: "lcdp-button-orange"
        }
      ],
      {
        ariaLabel: "Informations sur le fonctionnement du club"
      }
    );

    const boxResponsables = await ajouterBoxText(
      "lcdp-boxtext-responsables-slot",
      "Responsable de parc / Responsable d'activité",
      `
        <p>
          Vous êtes responsable de parc ou d'une activité conciliable avec le plein air ?
          Demandez à être rappelé(e) par notre équipe.
        </p>

        <p>
          Chaque demande est étudiée et fait l’objet d’une réponse personnalisée.
        </p>

        <div data-inscription-menu-contact></div>
      `,
      {
        titreCentre: true
      }
    );

    await ajouterMenuBoutonsDansElement(
      boxResponsables.querySelector("[data-inscription-menu-contact]"),
      [
        {
          label: "Je suis responsable de parc",
          href: "/ESPACE-PUBLIC/formulaire-contact-parc.html?source=inscription-membre",
          style: "lcdp-button-secondary"
        },
        {
          label: "Je suis responsable d'activité",
          href: "/ESPACE-PUBLIC/formulaire-contact-coach.html?source=inscription-membre",
          style: "lcdp-button-secondary"
        }
      ],
      {
        ariaLabel: "Demandes de contact"
      }
    );

    await initialiserFooter();
  }

  initialiserPage().catch((erreur) => {
    console.error(erreur);
  });
})();
