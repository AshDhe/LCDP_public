(() => {
  "use strict";

  if (window.LCDP_SAVOIR_PLUS) return;

  // Contenu public de la box « En savoir plus », repris du texte fourni.
  // Chaque entrée constitue un bloc indépendant avec un titre et son contenu.
  const BLOCS_SAVOIR_PLUS = [
    {
      titre: "Association de loi 1901",
      html: `
        <p>
          Les parcs partenaires du réseau La Clé du Parc sont <strong>des <span style="color: var(--lcdp-color-orange);">lieux remarquables</span> choisis pour leur beauté, leur préservation et leur dimension</strong>.
          Depuis toujours, ils se construisent et s'entretiennent pour offrir à leurs promeneurs des moments uniques qui permettent de <strong>se ressourcer et se déployer dans ces lieux d'exception</strong>.
          </p>
          <p>
          Au sein de l'association La Clé du Parc, prendre soin de soi et réunir ses proches relève d'une <strong>même logique de ressourcement personnel et de bien-être</strong>.
          Pour cette raison, les bénéfices de l'association sur ses recettes d'abonnement ne sont pas capitalisés à son profit mais reversés annuellement au profit des parcs pour <strong>les <span style="color: var(--lcdp-color-orange);">aider financièrement</span> à préserver leur tradition d'accueil</strong> et sa <strong><span style="color: var(--lcdp-color-orange);">logique partagée avec celle de l'association</span></strong>.
          </p>
          <figure class="lcdp-hello-map">
            <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_1.webp" alt="Des lieux entretenus pour se ressourcer - La Clé du Parc" width="960" height="739" loading="lazy">
            <figcaption class="lcdp-image-legend">
            Entretenir la qualité environnementale des parcs | La Clé du Parc
          </figcaption>
          </figure>
          <p>
          <strong>En complément</strong>, l'association organise des <strong><span style="color: var(--lcdp-color-orange);">journées bénévoles</span></strong> pour aider à préserver la qualité environnementale des parcs sans apporter de soutien financier direct dans ce cadre. 
        </p>
          <p>
          Initiée en région Centre-Val de Loire dans le département du Loir-et-Cher (41), La Clé du Parc répond au <strong>besoin d'une relation de proximité</strong> conviviale et sécurisée entre les amateurs et passionnés de plein air et les parcs d'exception.
        </p>
          <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_8.webp" alt="Maison des associations" width="707" height="421" loading="lazy">
      `
    },
    {
      titre: "L'accès aux parcs",
      html: `
        <p>
          La Clé du Parc utilise un <strong>dispositif nominatif, sécurisé et contrôlé</strong> pour enregistrer et vérifier la <strong><span style="color: var(--lcdp-color-orange);">validité des droit d'accès</span></strong> des utilisateurs dans le réseau des parcs.
        </p>
          <p>
          L'utilisation du droit d'accès autorisé par La Clé du Parc est obligatoirement attachée à <strong>l'utilisation conforme du dispositif d'accès et de contrôle</strong> fourni par l'association et au respect <strong>des conditions juridiques</strong> qui encadrent ce droit et ce dispositif.
        </p>
          <figure class="lcdp-hello-map">
            <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_3.webp" alt="Le dispositif nominatif, sécurisé et contrôlé de contrôle des accès avec La Clé du Parc" width="960" height="480" loading="lazy">
            <figcaption class="lcdp-image-legend">
            Le dispositif d'accès nominatif, sécurisé et contrôlé — © La Clé du Parc
          </figcaption>
          </figure>
          <p>
          Au préalable, pouvoir <strong>initier soi-même un droit d'accès</strong> dans le réseau des parcs est soumis à avis favorable de la procédure de <strong><span style="color: var(--lcdp-color-orange);">demande d'abonnement</span> (DA)</strong>.
          Cette procédure nominative est pilotée par l'association et faite sur demande de la personne concernée.
          La DA a pour objectif de contrôler le nombre de membres abonnés selon le nombre de parcs du réseau et de <strong>connaître chaque personne individuellement</strong> avant de l'autoriser à réserver personnellement un droit d'accès dans le réseau des parcs et de pouvoir utiliser ce droit.
          </p>
          <p>
          Par ailleurs, les bénéficiaires d'un accès valide et simultanément présents dans un même parc exercent entre et naturellement un <strong>contrôle visuel</strong> de comportement et d'autorisation de présence. 
          </p>
          <figure class="lcdp-hello-map">
            <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_4.webp" alt="Le dispositif nominatif, sécurisé et contrôlé de contrôle des accès avec La Clé du Parc" width="960" height="739" loading="lazy">
            <figcaption class="lcdp-image-legend">
            Contrôle naturel entre bénéficiaires — La Clé du Parc
          </figcaption>
          </figure>
          <p>
          Une personne présente dans un parc du réseau sans dispositif d'accès conforme est en <strong><span style="color: var(--lcdp-color-orange);">infraction pénale</span></strong> (présence non autorisée dans l'enceinte du parc) sauf à prouver qu'elle bénéficie de l'autorisation d'un ayant droit du parc concerné.
          </p>
      `
    },
    {
      titre: "Les parcs du réseau",
      html: `
        <p>
        <strong>La France compte un patrimoine naturel et culturel conséquent de parcs</strong> et unique en Europe et dans le monde par sa qualité environnementale.
        Ces lieux ouverts ou fermés au public sont répartis sur tout le territoire national, toutes les régions et plus de 90% des départements en France métropolitaine. 
        </p>
        <figure class="lcdp-hello-map">
          <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_2.webp" alt="Carte de France des départements et de leur nombre de parcs d'exception" width="960" height="739" loading="lazy">
          <figcaption class="lcdp-image-legend">
          Les parcs d'exception en France — © La Clé du Parc
          </figcaption>
        </figure>
        <p>
        <strong>La Clé du Parc sélectionne en France métropolitaine</strong> des parcs reconnus localement pour <strong>présenter des caractérisques remarquables de beauté, de préservation et de dimension</strong> concernant leur esthétique visuelle et leur environnement.
        </p>
        <p>
        Les parcs choisis par La Clé du Parc autorisent ensuite les <strong><span style="color: var(--lcdp-color-orange);">membres abonnés du club</span></strong> La Clé du Parc à bénéficier d'un accès autorisé fourni, sécurisé et contrôlé par l'association pour permettre aux membres de venir <strong>se ressourcer et se retrouver en solo, en duo ou en groupe (avec des amis, en famille) dans ces lieux d'exception</strong>, dans le respect des conditions de fréquentation prévues par le parc et l'association.
        </p>
        <p>
        La Clé du Parc développe le <strong><span style="color: var(--lcdp-color-orange);">réseau territorial de parcs partenaires</span></strong> au niveau départemental, régional et national.
        </p>
      `
    },
    {
      titre: "L'application mobile/PC",
      html: `
        <p>
        L'application La Clé du Parc (web app) est accessible en se connectant sur <strong><span style="color: var(--lcdp-color-orange);">lacleduparc.fr</span></strong>.
        Elle intègre les standards du développement applicatif web actuel : sécurité, RGPD, UX, IA.
        </p>
        <figure>
          <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_5.webp" alt="Aperçu de l'espace membre de l'application La Clé du Parc" width="887" height="927" loading="lazy">
          <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_6.webp" alt="Aperçu de l'espace membre de l'application La Clé du Parc" width="1286" height="902" loading="lazy">
          <figcaption class="lcdp-image-legend">
          Vues de l'application — © La Clé du Parc
          </figcaption>
        </figure>
        <p>
        L'application organise au niveau local et national plusieurs <strong>aspects clefs de la relation contractuelle</strong> entre l'association et :
        </p>
        <ul>
          <li>les membres invités et abonnés du club La Clé du Parc</li>
          <li>les parcs du réseau partenaire La Clé du Parc</li>
          <li>les membres du club La Clé du Parc ayant la qualité de coach</li>
        </ul>
          <p>
        L'application organise en particulier :
        </p>
        <ul>
          <li>la présentation numérique de l'association, de ses activités, de son actualité et des parcs</li>
          <li>l'inscription et le suivi informatique des membres (invités et abonnés) et de leur activité dans l'application</li>
          <li>la gestion informatique des plannings des parcs du réseau, des abonnements des membres, des réservations de droit d'accès des membres dans les parcs et des invitations des membres</li>
          <li>le contrôle informatique, nominatif et sécurisé, des droits d'accès et de présence des membres dans les parcs</li>
          <li>le contrôle informatique des espaces particuliers dans l'application (public, membre, coach, parc)</li>
          <li>la facturation informatique des abonnements, le paiement informatique et le remboursement informatique des abonnements</li>
          <li>la mise à jour des conditions juridiques (règlement de l'application, règlement du club, mentions légales, politique de gestion des données nominatives) à travers l'interface numérique de l'application</li>
        </ul>
      `
    },
    {
      titre: "Le livre d'or : des lieux aimés et respectés",
      html: `
        <div class="lcdp-cartouches-citation" aria-label="Témoignages">
          <blockquote class="lcdp-cartouche-citation lcdp-cartouche-citation--membre">
            <p>« C’est un cadeau de se retrouver dans ces endroits extraordinaires. »</p>
            <footer>— Membre</footer>
          </blockquote>
          <blockquote class="lcdp-cartouche-citation lcdp-cartouche-citation--coach">
            <p>« Des participants qui me parlent encore du parc des mois après. »</p>
            <footer>— Coach</footer>
          </blockquote>
          <blockquote class="lcdp-cartouche-citation lcdp-cartouche-citation--parc">
            <p>« Un lieu remarquable est souvent un personnage de la vie locale. »</p>
            <footer>— Parc</footer>
          </blockquote>
          <blockquote class="lcdp-cartouche-citation lcdp-cartouche-citation--membre">
            <p>« Ce sont des lieux vivants chargés d’histoire. On ne peut que les aimer. »</p>
            <footer>— Membre</footer>
          </blockquote>
          <blockquote class="lcdp-cartouche-citation lcdp-cartouche-citation--coach">
            <p>« Venir au parc dynamise l’atelier et lui donne aussi de l’originalité. »</p>
            <footer>— Coach</footer>
          </blockquote>
          <blockquote class="lcdp-cartouche-citation lcdp-cartouche-citation--parc">
            <p>« C’est une satisfaction de voir d’autres que nous aimer ce lieu autant que nous. »</p>
            <footer>— Parc</footer>
          </blockquote>
        </div>
      `
    },
    {
      titre: "Suivre les coachs (sport, art, culture)",
      html: `
        <p>
        <strong><span style="color: var(--lcdp-color-orange);">Un coach</span> est un membre du club</strong> dont la compétence d'accompagnement dans un domaine sportif ou culturel ou artistique ou récréatif est reconnue officiellement par l'association.
        </p>
        <p>
          Un coach abonné permanent ou non permanent peut inviter ses clients dans le réseau des parcs partenaires et selon les conditions prévues par le règlement de l'application.
        </p>
        <p>
          Les membres abonnés permanents du club sont autorisés à <strong>prendre part aux séances des coachs</strong> dans le réseau des parcs et selon les conditions prévues par le règlement de l'application.
        </p>
        <figure class="lcdp-hello-map">
          <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_7.webp" alt="Séance éphémère de prestige workout avec coach dans le réseau des parcs - La Clé du Parc" width="960" height="739" loading="lazy">
          <figcaption class="lcdp-image-legend">
          Séance éphémère de "Prestige workout" © avec coach dans le réseau des parcs — La Clé du Parc
        </figcaption>
        </figure>
      `
    },
    {
      titre: "Devenir membre invité",
      html: `
        <p>
            <strong><span style="color: var(--lcdp-color-orange);">L'inscription au club</span></strong> La Clé du Parc est <strong>gratuite et sans restriction</strong>.
            Il vous suffit de créer votre <strong>compte membre dans l'application</strong> en suivant les étapes nécessaires : formulaire d'inscription puis validation de votre adresse mail et création de votre mot de passe.
          </p>
        <p>
            En tant que membre inscrit, vous disposez de la qualité de <strong><span style="color: var(--lcdp-color-orange);">membre invité du club</span></strong>.
            Chaque membre invité bénéficie d'un <strong>accès nominatif, sécurisé et contrôlé gratuit</strong> à l'ensemble des parcs du réseau sous réserve de bénéficier d'une <strong>invitation valide</strong> de la part d'un membre abonné du club.
        </p>
        <figure class="lcdp-hello-map">
          <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_9.webp" alt="Invitation running dans un parc du réseau — La Clé du Parc" width="960" height="739" loading="lazy">
          <figcaption class="lcdp-image-legend">
          Invitation running et parc du réseau — La Clé du Parc
          </figcaption>
        </figure>
        <p>
            Les <strong><span style="color: var(--lcdp-color-orange);">membres abonnés permanents</span></strong> et les <strong><span style="color: var(--lcdp-color-orange);">membres abonnés non permanents</span></strong> peuvent envoyer des invitations aux autres membres et selon les conditions prévues par le règlement de l'application.
          </p>
      `
    },
    {
      titre: "Notre équipe | La Clé du Parc",
      html: `
        <p>
          La Clé du Parc est une petite équipe dédiée au projet associatif et passionnée de plein air, qui comprend une dizaine de <strong>bénévoles et salariés</strong> toutnés vers le réseau (parcs, membres, coachs).
        </p>
        <p>
          La Clé du Parc recrute <strong>des animateurs territoriaux</strong> pour renforcer ses équipes départementales et régionales dans le cadre du développement de l'association.
        </p>
        <p>
          Informations de recrutement, postes à pourvoir et candidatures via le 
          <a href="https://www.linkedin.com/company/la-cl%C3%A9-du-parc" target="_blank" rel="noopener noreferrer">
          <strong>LinkedIn</strong>
          </a> de l'association. 
        </p>
        <figure class="lcdp-hello-map">
          <img class="lcdp-illustration" src="/OBJET/IMAG/PAGE/HELLO/IMAG_10.webp" alt="Equipe La Clé du Parc projet associatif" width="960" height="739" loading="lazy">
          <figcaption class="lcdp-image-legend">
          Une équipe de plein air — La Clé du Parc
          </figcaption>
        </figure>
      `
    }
  ];

  let structure = null;
  let focusAvantOuverture = null;

  function construireUrlPublic(chemin) {
    const config = window.SITE_CONFIG || {};
    if (typeof config.publicUrl === "function") return config.publicUrl(chemin);
    const base = String(config.publicBaseUrl || config.PUBLIC_BASE || window.SITE_BASE || "").replace(/\/+$/, "");
    return base ? base + "/" + chemin.replace(/^\/+/, "") : chemin;
  }

  function appliquerRoutes(racine) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.href = construireUrlPublic(element.dataset.siteHref);
    });
    racine.querySelectorAll("img[src^='/']").forEach((element) => {
      element.src = construireUrlPublic(element.getAttribute("src"));
    });
  }

  function creerStructure() {
    // Même structure et mêmes classes que creerStructureBoxMentions().
    // La source de contenu est locale, sans appel à l'espace admin.
    const overlay = document.createElement("div");
    overlay.id = "lcdp-savoir-plus-dialog";
    overlay.className = "lcdp-legal-lightbox";
    overlay.setAttribute("data-lcdp-savoir-plus-dialog", "");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "lcdp-savoir-plus-title");

    const carte = document.createElement("section");
    carte.className = "lcdp-legal-lightbox__card";

    const boutonFermer = document.createElement("button");
    boutonFermer.type = "button";
    boutonFermer.className = "lcdp-legal-lightbox__close";
    boutonFermer.setAttribute("aria-label", "Fermer En savoir plus");
    boutonFermer.textContent = "×";

    const entete = document.createElement("header");
    entete.className = "lcdp-legal-lightbox__header";
    const titre = document.createElement("h2");
    titre.id = "lcdp-savoir-plus-title";
    titre.className = "lcdp-legal-lightbox__title";
    titre.textContent = "En savoir plus";

    const contenu = document.createElement("div");
    contenu.className = "lcdp-legal-lightbox__content lcdp-contenu-editorial";

    BLOCS_SAVOIR_PLUS.forEach((bloc) => {
      const section = document.createElement("section");
      section.className = "lcdp-component lcdp-boxtext lcdp-legal-lightbox__section";
      const titreSection = document.createElement("h3");
      titreSection.className = "lcdp-boxtext__title";
      titreSection.textContent = bloc.titre;
      const texte = document.createElement("div");
      texte.className = "lcdp-boxtext__content";
      // HTML statique de ce fichier, jamais fourni par une saisie ou une URL.
      texte.innerHTML = bloc.html;
      section.append(titreSection, texte);
      contenu.appendChild(section);
    });
    appliquerRoutes(contenu);
    entete.appendChild(titre);
    carte.append(boutonFermer, entete, contenu);
    overlay.appendChild(carte);
    return { overlay, boutonFermer };
  }

  function fermer() {
    if (!structure) return;
    structure.overlay.remove();
    structure = null;
    document.removeEventListener("keydown", gererClavier);
    if (!document.querySelector("[data-lcdp-legal-lightbox]")) {
      document.body.classList.remove("lcdp-legal-lightbox-open");
    }
    if (focusAvantOuverture?.isConnected) focusAvantOuverture.focus();
    focusAvantOuverture = null;
  }

  function gererClavier(event) {
    if (!structure) return;
    if (event.key === "Escape") {
      event.preventDefault();
      fermer();
      return;
    }
    if (event.key !== "Tab") return;
    const elements = Array.from(structure.overlay.querySelectorAll(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )).filter((element) => !element.hidden && element.getClientRects().length);
    const premier = elements[0];
    const dernier = elements[elements.length - 1];
    if (!premier) return;
    if (event.shiftKey && document.activeElement === premier) {
      event.preventDefault();
      dernier.focus();
    } else if (!event.shiftKey && document.activeElement === dernier) {
      event.preventDefault();
      premier.focus();
    }
  }

  function ouvrir() {
    if (structure) return;
    const slot = document.getElementById("lcdp-lightbox-slot");
    if (!slot) return;
    focusAvantOuverture = document.activeElement;
    structure = creerStructure();
    slot.replaceChildren(structure.overlay);
    document.body.classList.add("lcdp-legal-lightbox-open");
    const overlay = structure.overlay;
    structure.boutonFermer.addEventListener("click", fermer);
    structure.overlay.addEventListener("click", (event) => {
      if (event.target === overlay) fermer();
    });
    document.addEventListener("keydown", gererClavier);
    structure.boutonFermer.focus();
  }

  document.addEventListener("click", (event) => {
    const bouton = event.target.closest?.("[data-lcdp-savoir-plus]");
    if (!bouton) return;
    event.preventDefault();
    ouvrir();
  });

  window.LCDP_SAVOIR_PLUS = Object.freeze({ ouvrir, fermer });
})();
