(() => {
  "use strict";

  let initialisationEnCours = null;

  const siteBase = (
    window.SITE_BASE ||
    window.SITE_CONFIG?.publicBaseUrl ||
    window.SITE_CONFIG?.siteBase ||
    ""
  ).replace(/\/$/, "");

  const comptesPublics = {
    membre: {
      label: "Espace MEMBRE",
      cheminConnexion: "/ESPACE-PUBLIC/connexion-membre.html?source=menu-mon-compte"
    },
    parc: {
      label: "Espace PARC",
      cheminConnexion: "/ESPACE-PUBLIC/connexion-parc.html?source=menu-mon-compte"
    },
    coach: {
      label: "Espace COACH",
      cheminConnexion: "/ESPACE-PUBLIC/connexion-coach.html?source=menu-mon-compte"
    }
  };

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

  function obtenirWorkerUserRouteurUrl() {
    const config = window.SITE_CONFIG || {};

    if (config.workerUserRouteurUrl) {
      return config.workerUserRouteurUrl;
    }

    if (config.WORKER_USER_ROUTEUR_URL) {
      return config.WORKER_USER_ROUTEUR_URL;
    }

    if (typeof config.apiUrl === "function") {
      return config.apiUrl("user-routeur-api");
    }

    return "https://user-routeur-api.lacleduparc.fr";
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

  function chargerCssUneFois(chemin) {
    const href = construireUrlSite(chemin);
    const hrefComplet = new URL(href, window.location.href).href;

    const existe = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some((link) => link.href === hrefComplet);

    if (existe) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function assurerLightboxSlot() {
    let slot = document.getElementById("lcdp-lightbox-slot");

    if (slot) {
      return slot;
    }

    slot = document.createElement("div");
    slot.id = "lcdp-lightbox-slot";
    document.body.appendChild(slot);

    return slot;
  }

  function ouvrirMenu(boutonBurger, navBurger) {
    boutonBurger.setAttribute("aria-expanded", "true");
    navBurger.hidden = false;
    navBurger.removeAttribute("hidden");
  }

  function fermerMenu(boutonBurger, navBurger) {
    boutonBurger.setAttribute("aria-expanded", "false");
    navBurger.hidden = true;
    navBurger.setAttribute("hidden", "");
  }

  function basculerMenu(boutonBurger, navBurger) {
    const ouvert = boutonBurger.getAttribute("aria-expanded") === "true";

    if (ouvert) {
      fermerMenu(boutonBurger, navBurger);
      return;
    }

    ouvrirMenu(boutonBurger, navBurger);
  }

  function fermerDialogue(slot) {
    slot.innerHTML = "";
  }

  function construireUrlConnexion(compte) {
    const configuration = comptesPublics[compte];

    if (!configuration) {
      return construireUrlSite("/ESPACE-PUBLIC/connexion-membre.html?source=menu-mon-compte");
    }

    return construireUrlSite(configuration.cheminConnexion);
  }

  async function redirigerCompte(compte) {
    const workerUrl = obtenirWorkerUserRouteurUrl();

    if (!workerUrl) {
      window.location.href = construireUrlConnexion(compte);
      return;
    }

    try {
      const reponse = await fetch(workerUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ compte })
      });

      if (!reponse.ok) {
        throw new Error("Routeur utilisateur indisponible.");
      }

      const data = await reponse.json().catch(() => null);

      if (data && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      window.location.href = construireUrlConnexion(compte);

    } catch (erreur) {
      console.error("Erreur routeur utilisateur :", erreur);
      window.location.href = construireUrlConnexion(compte);
    }
  }

  async function ouvrirDialogueMonComptePublic() {
    chargerCssUneFois("/OBJET/BOX/02-box-dialogue-bouton.css");

    const slot = assurerLightboxSlot();
    slot.innerHTML = "";

    const fragment = await chargerFragment("/OBJET/BOX/02-box-dialogue-bouton.html");
    slot.appendChild(fragment);

    const dialogue = slot.querySelector("[data-lcdp-box-dialogue-bouton]");
    const titre = slot.querySelector("[data-lcdp-dialogue-title]");
    const texte = slot.querySelector("[data-lcdp-dialogue-text]");
    const actions = slot.querySelector("[data-lcdp-dialogue-actions]");
    const boutonFermer = slot.querySelector("[data-lcdp-dialogue-close]");

    if (!dialogue || !titre || !texte || !actions || !boutonFermer) {
      throw new Error("Structure de dialogue Mon compte incomplète.");
    }

    titre.textContent = "Connexion";
    texte.textContent = "Choisissez votre espace de connexion.";

    actions.innerHTML = "";

    Object.entries(comptesPublics).forEach(([compte, configuration]) => {
      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "lcdp-button lcdp-button-primary";
      bouton.textContent = configuration.label;

      bouton.addEventListener("click", () => {
        redirigerCompte(compte);
      });

      actions.appendChild(bouton);
    });

    const fermer = () => {
      fermerDialogue(slot);
    };

    boutonFermer.addEventListener("click", fermer);

    dialogue.addEventListener("click", (event) => {
      if (event.target === dialogue) {
        fermer();
      }
    });

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          fermer();
        }
      },
      { once: true }
    );
  }

  function creerLienMenu(item, boutonBurger, navBurger) {
    if (item.action === "mon-compte") {
      const bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "lcdp-box-menu-burger__button-link";
      bouton.textContent = item.label;

      bouton.addEventListener("click", () => {
        fermerMenu(boutonBurger, navBurger);

        ouvrirDialogueMonComptePublic().catch((erreur) => {
          console.error("Erreur dialogue Mon compte :", erreur);
          window.location.href = construireUrlConnexion("membre");
        });
      });

      return bouton;
    }

    const lien = document.createElement("a");
    lien.className = "lcdp-box-menu-burger__link";
    lien.textContent = item.label;
    lien.href = construireUrlSite(item.href);

    lien.addEventListener("click", () => {
      fermerMenu(boutonBurger, navBurger);
    });

    return lien;
  }

  async function initialiserMenuBurgerPublic() {
    const slot = document.querySelector("[data-lcdp-burger-slot]");

    if (!slot) {
      return;
    }

    if (slot.dataset.lcdpBurgerInitialise === "true") {
      return;
    }

    if (initialisationEnCours) {
      return initialisationEnCours;
    }

    initialisationEnCours = (async () => {
      slot.innerHTML = "";

      const fragment = await chargerFragment("/OBJET/BOX/02-box-menu-burger.html");
      slot.appendChild(fragment);

      const boutonBurger = slot.querySelector("[data-lcdp-burger-button]");
      const navBurger = slot.querySelector("[data-lcdp-burger-nav]");
      const listeBurger = slot.querySelector("[data-lcdp-burger-list]");

      if (!boutonBurger || !navBurger || !listeBurger) {
        throw new Error("Structure du menu burger générique incomplète.");
      }

      fermerMenu(boutonBurger, navBurger);

      const liensPublics = [
        {
          label: "Accueil",
          href: "/ESPACE-PUBLIC/accueil-public.html"
        },
        {
          label: "Le club",
          href: "/ESPACE-PUBLIC/la-cle-du-parc.html"
        },
        {
          label: "Connexion",
          action: "mon-compte"
        },
        {
          label: "Être invité(e)",
          href: "/ESPACE-PUBLIC/inscription.html"
        },
        {
          label: "Actualité",
          href: "/ESPACE-PUBLIC/actualite.html"
        }
      ];

      listeBurger.innerHTML = "";

      liensPublics.forEach((item) => {
        listeBurger.appendChild(
          creerLienMenu(item, boutonBurger, navBurger)
        );
      });

      boutonBurger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        basculerMenu(boutonBurger, navBurger);
      });

      navBurger.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      document.addEventListener("click", (event) => {
        if (!slot.contains(event.target)) {
          fermerMenu(boutonBurger, navBurger);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          fermerMenu(boutonBurger, navBurger);
        }
      });

      slot.dataset.lcdpBurgerInitialise = "true";
    })();

    try {
      await initialisationEnCours;
    } finally {
      initialisationEnCours = null;
    }
  }

  window.LCDP_initialiserMenuBurgerPublic = initialiserMenuBurgerPublic;
  window.LCDP_ouvrirDialogueMonCompte = ouvrirDialogueMonComptePublic;

  document.addEventListener("lcdp:ouvrir-dialogue-mon-compte", () => {
    ouvrirDialogueMonComptePublic().catch(console.error);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initialiserMenuBurgerPublic().catch(console.error);
    });
  } else {
    initialiserMenuBurgerPublic().catch(console.error);
  }
})();