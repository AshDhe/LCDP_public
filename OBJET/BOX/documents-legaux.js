(() => {
  "use strict";

  const BALISES_AUTORISEES = new Set([
    "P",
    "BR",
    "STRONG",
    "EM",
    "UL",
    "OL",
    "LI",
    "A"
  ]);

  const SELECTEUR_DANGEREUX = [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "svg",
    "math",
    "form",
    "input",
    "button",
    "textarea",
    "select",
    "template"
  ].join(",");

  function nettoyerHtml(htmlBrut) {
    const template = document.createElement("template");
    template.innerHTML = String(htmlBrut || "");

    template.content
      .querySelectorAll(SELECTEUR_DANGEREUX)
      .forEach((element) => element.remove());

    Array.from(template.content.querySelectorAll("div"))
      .reverse()
      .forEach((element) => {
        const contientBloc = Array.from(element.children)
          .some((enfant) => {
            return ["P", "UL", "OL"].includes(enfant.tagName);
          });

        if (contientBloc) {
          element.replaceWith(...element.childNodes);
          return;
        }

        const paragraphe = document.createElement("p");

        while (element.firstChild) {
          paragraphe.appendChild(element.firstChild);
        }

        element.replaceWith(paragraphe);
      });

    Array.from(template.content.querySelectorAll("*")).forEach((element) => {
      if (!BALISES_AUTORISEES.has(element.tagName)) {
        element.replaceWith(...element.childNodes);
        return;
      }

      Array.from(element.attributes).forEach((attribut) => {
        const nom = attribut.name.toLowerCase();

        if (
          element.tagName === "BR" &&
          nom === "data-lcdp-soft-break" &&
          attribut.value === "true"
        ) {
          return;
        }

        if (
          element.tagName === "A" &&
          (nom === "href" || nom === "data-site-href")
        ) {
          const url = normaliserUrlLien(attribut.value);

          if (url) {
            element.setAttribute(attribut.name, url);
          } else {
            element.removeAttribute(attribut.name);
          }

          return;
        }

        if (
          element.tagName === "A" &&
          nom === "class" &&
          attribut.value === "lcdp-link-secondary"
        ) {
          return;
        }

        element.removeAttribute(attribut.name);
      });
    });

    return normaliserParagraphesHtml(template.innerHTML)
      .replace(/<p>(?:\s|&nbsp;|<br(?:\s[^>]*)?>)*<\/p>/gi, "")
      .trim();
  }

  function normaliserParagraphesHtml(html) {
    const tokens = String(html || "").match(
      /<[^>]+>|[^<]+/g
    ) || [];
    const pileInline = [];
    const resultat = [];
    let dansParagraphe = false;
    let profondeurListe = 0;

    function ouvrirParagraphe() {
      if (dansParagraphe) return;
      resultat.push("<p>");
      dansParagraphe = true;
    }

    function fermerParagraphe() {
      if (!dansParagraphe) return;

      fermerInlineOuverts(resultat, pileInline);
      resultat.push("</p>");
      dansParagraphe = false;
    }

    function scinderParagraphe() {
      if (!dansParagraphe) return;

      const inlineAReouvrir = pileInline.slice();
      fermerInlineOuverts(resultat, pileInline);
      resultat.push("</p><p>");

      inlineAReouvrir.forEach((inline) => {
        resultat.push(inline.ouverture);
        pileInline.push(inline);
      });
    }

    function ajouterTexteNormalise(token) {
      const texte = String(token || "").replace(/\r\n?/g, "\n");
      const lignes = texte.split("\n");
      const lignesUtiles = lignes
        .map((ligne) => String(ligne).replace(/&nbsp;/gi, " ").trim())
        .filter(Boolean);

      if (lignesUtiles.length <= 1) {
        if (
          dansParagraphe ||
          texte.replace(/&nbsp;/gi, " ").trim()
        ) {
          ouvrirParagraphe();
          resultat.push(texte);
        }

        return;
      }

      let premiereLigne = true;

      lignes.forEach((ligne) => {
        const contenu = String(ligne)
          .replace(/&nbsp;/gi, " ")
          .trim();

        if (!contenu) return;

        if (!premiereLigne) {
          scinderParagraphe();
        }

        ouvrirParagraphe();
        resultat.push(contenu);
        premiereLigne = false;
      });
    }

    tokens.forEach((token) => {
      const balise = token.match(
        /^<\/?([a-z0-9]+)\b[^>]*>$/i
      );

      if (!balise) {
        if (profondeurListe > 0) {
          resultat.push(token);
          return;
        }

        ajouterTexteNormalise(token);
        return;
      }

      const nom = String(balise[1] || "").toLowerCase();
      const fermeture = /^<\//.test(token);

      if (nom === "ul" || nom === "ol") {
        if (fermeture) {
          resultat.push(token);
          profondeurListe = Math.max(0, profondeurListe - 1);
        } else {
          fermerParagraphe();
          resultat.push(token);
          profondeurListe += 1;
        }

        return;
      }

      if (profondeurListe > 0) {
        resultat.push(token);
        return;
      }

      if (nom === "p") {
        if (fermeture) {
          fermerParagraphe();
        } else {
          fermerParagraphe();
          ouvrirParagraphe();
        }

        return;
      }

      if (nom === "br") {
        const sautSouple = /\bdata-lcdp-soft-break\s*=\s*["']true["']/i
          .test(token);

        if (sautSouple) {
          ouvrirParagraphe();
          resultat.push('<br data-lcdp-soft-break="true">');
        } else {
          scinderParagraphe();
        }

        return;
      }

      if (["strong", "em", "a"].includes(nom)) {
        if (fermeture) {
          if (!dansParagraphe) return;

          resultat.push("</" + nom + ">");

          for (let index = pileInline.length - 1; index >= 0; index -= 1) {
            if (pileInline[index].nom === nom) {
              pileInline.splice(index, 1);
              break;
            }
          }
        } else {
          ouvrirParagraphe();
          resultat.push(token);
          pileInline.push({
            nom,
            ouverture: token
          });
        }

        return;
      }

      resultat.push(token);
    });

    fermerParagraphe();

    return resultat.join("");
  }

  function fermerInlineOuverts(resultat, pileInline) {
    for (let index = pileInline.length - 1; index >= 0; index -= 1) {
      resultat.push("</" + pileInline[index].nom + ">");
    }

    pileInline.length = 0;
  }

  function normaliserUrlLien(value) {
    const url = String(value || "").trim();

    if (!url || url.startsWith("//")) return "";

    const compact = url
      .replace(/[\u0000-\u0020\u007f]+/g, "")
      .toLowerCase();

    return (
      compact.startsWith("http://") ||
      compact.startsWith("https://") ||
      compact.startsWith("mailto:") ||
      compact.startsWith("tel:") ||
      compact.startsWith("/") ||
      compact.startsWith("#") ||
      compact.startsWith("../") ||
      compact.startsWith("./")
    ) ? url : "";
  }

  const ETAT_BOX_MENTIONS = {
    ouverte: false,
    chargement: false,
    contenu: null,
    focusAvantOuverture: null,
    gestionnaireClavier: null
  };

  function estPageRestreinteMentions() {
    return document.body?.classList.contains("lcdp-page-hello") ||
      document.body?.classList.contains("lcdp-page-formulaire-liste-attente");
  }

  function endpointEditingAdmin() {
    const config = window.SITE_CONFIG || {};

    return String(
      config.workerEditingAdminUrl ||
      config.WORKER_EDITING_ADMIN_URL ||
      config.workerEditingAdminFallbackUrl ||
      config.WORKER_EDITING_ADMIN_FALLBACK_URL ||
      ""
    ).replace(/\/+$/, "");
  }

  function construireUrlPublic(path) {
    const valeur = String(path || "");
    const config = window.SITE_CONFIG || {};

    if (
      !valeur ||
      valeur.startsWith("#") ||
      valeur.startsWith("mailto:") ||
      valeur.startsWith("tel:") ||
      valeur.startsWith("http://") ||
      valeur.startsWith("https://") ||
      valeur.startsWith("data:")
    ) {
      return valeur;
    }

    if (typeof config.publicUrl === "function") {
      return config.publicUrl(valeur);
    }

    const base = String(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    ).replace(/\/+$/, "");

    if (base) {
      return base + "/" + valeur.replace(/^\/+/, "");
    }

    return valeur;
  }

  function appliquerRoutesDansMentions(racine) {
    racine.querySelectorAll("[data-site-href]").forEach((element) => {
      element.setAttribute(
        "href",
        construireUrlPublic(element.getAttribute("data-site-href"))
      );
    });
  }

  function construireUrlObjet(path) {
    const valeur = String(path || "");
    const config = window.SITE_CONFIG || {};

    if (
      !valeur ||
      valeur.startsWith("#") ||
      valeur.startsWith("mailto:") ||
      valeur.startsWith("tel:") ||
      valeur.startsWith("http://") ||
      valeur.startsWith("https://") ||
      valeur.startsWith("data:")
    ) {
      return valeur;
    }

    if (typeof config.objetUrl === "function") {
      return config.objetUrl(valeur);
    }

    const cheminNettoye = valeur
      .replace(/^\/+/, "")
      .replace(/^OBJET\/+/, "");

    const baseObjet = String(
      config.objetBaseUrl ||
      config.OBJET_BASE ||
      ""
    ).replace(/\/+$/, "");

    if (baseObjet) {
      return baseObjet + "/" + cheminNettoye;
    }

    return construireUrlPublic("/OBJET/" + cheminNettoye);
  }

  async function chargerFragmentObjet(path) {
    const response = await fetch(construireUrlObjet(path), {
      method: "GET",
      credentials: "same-origin",
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error("Fragment objet introuvable : " + path);
    }

    const template = document.createElement("template");
    template.innerHTML = (await response.text()).trim();

    return template.content.cloneNode(true);
  }

  async function chargerMentionsLegales() {
    if (ETAT_BOX_MENTIONS.contenu) {
      return ETAT_BOX_MENTIONS.contenu;
    }

    const endpoint = endpointEditingAdmin();

    if (!endpoint) {
      throw new Error("Service des mentions légales non configuré.");
    }

    const response = await fetch(
      endpoint + "/public/mentions-legales",
      {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      }
    );

    const data = await response.json().catch(() => null);

    if (
      !response.ok ||
      !data ||
      data.success !== true ||
      !Array.isArray(data.blocs)
    ) {
      throw new Error(
        data?.message ||
        data?.detail ||
        "Les mentions légales ne peuvent pas être chargées."
      );
    }

    ETAT_BOX_MENTIONS.contenu = {
      titre: String(data.titre || "Mentions légales"),
      blocs: data.blocs
    };

    return ETAT_BOX_MENTIONS.contenu;
  }

  function creerStructureBoxMentions() {
    const overlay = document.createElement("div");
    overlay.className = "lcdp-legal-lightbox";
    overlay.setAttribute("data-lcdp-legal-lightbox", "");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "lcdp-legal-lightbox-title");

    const carte = document.createElement("section");
    carte.className = "lcdp-legal-lightbox__card";

    const boutonFermer = document.createElement("button");
    boutonFermer.type = "button";
    boutonFermer.className = "lcdp-legal-lightbox__close";
    boutonFermer.setAttribute("aria-label", "Fermer les mentions légales");
    boutonFermer.textContent = "×";

    const entete = document.createElement("header");
    entete.className = "lcdp-legal-lightbox__header";

    const titre = document.createElement("h2");
    titre.id = "lcdp-legal-lightbox-title";
    titre.className = "lcdp-legal-lightbox__title";
    titre.textContent = "Mentions légales";

    const contenu = document.createElement("div");
    contenu.className = "lcdp-legal-lightbox__content";
    contenu.setAttribute("data-lcdp-legal-lightbox-content", "");

    entete.appendChild(titre);
    carte.appendChild(boutonFermer);
    carte.appendChild(entete);
    carte.appendChild(contenu);
    overlay.appendChild(carte);

    return {
      overlay,
      carte,
      boutonFermer,
      titre,
      contenu
    };
  }

  function rendreChargement(contenu) {
    contenu.innerHTML = "";

    const message = document.createElement("p");
    message.className = "lcdp-legal-lightbox__status";
    message.textContent = "Chargement des mentions légales…";
    contenu.appendChild(message);
  }

  function rendreErreur(contenu, message) {
    contenu.innerHTML = "";

    const texte = document.createElement("p");
    texte.className = "lcdp-legal-lightbox__status lcdp-legal-lightbox__status--error";
    texte.textContent = String(message || "Les mentions légales ne peuvent pas être chargées.");
    contenu.appendChild(texte);
  }

  function rendreMentions(structure, documentMentions) {
    structure.titre.textContent = String(
      documentMentions?.titre || "Mentions légales"
    );
    structure.contenu.innerHTML = "";

    (documentMentions?.blocs || []).forEach((bloc) => {
      const titre = String(bloc?.titre || "").trim();
      const html = nettoyerHtml(String(bloc?.html || ""));

      if (!titre || !html) return;

      const section = document.createElement("section");
      section.className = "lcdp-component lcdp-boxtext lcdp-legal-lightbox__section";

      const titreSection = document.createElement("h3");
      titreSection.className = "lcdp-boxtext__title";
      titreSection.textContent = titre;

      const texte = document.createElement("div");
      texte.className = "lcdp-boxtext__content";
      texte.innerHTML = html;

      section.appendChild(titreSection);
      section.appendChild(texte);
      structure.contenu.appendChild(section);
    });

    appliquerRoutesDansMentions(structure.contenu);
    ajouterBoutonDemandeJuridique(structure, documentMentions);
  }

  function ajouterBoutonDemandeJuridique(structure, documentMentions) {
    const actions = document.createElement("div");
    actions.className = "lcdp-contact-juridique-actions";

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "lcdp-button lcdp-button-secondary";
    bouton.textContent = "Demande juridique";
    bouton.addEventListener("click", () => {
      ouvrirInfoboxDemandeJuridique(
        structure,
        documentMentions
      ).catch((error) => {
        console.error("Erreur demande juridique :", error);
      });
    });

    actions.appendChild(bouton);
    structure.contenu.appendChild(actions);
  }


  function ouvrirContactInfo(type) {
    if (window.LCDP_CONTACT_INFO) return Promise.resolve(window.LCDP_CONTACT_INFO.ouvrir(type));
    if (!window.LCDP_contactInfoChargement) {
      const config = window.SITE_CONFIG || {};
      const base = String(config.objetBaseUrl || config.OBJET_BASE || "https://lacleduparc.fr/OBJET").replace(/\/+$/, "");
      const src = typeof config.objetUrl === "function" ? config.objetUrl("/BOX/02-box-contact.js") : base + "/BOX/02-box-contact.js";
      window.LCDP_contactInfoChargement = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => window.LCDP_CONTACT_INFO ? resolve() : reject(new Error("Infobox indisponible."));
        script.onerror = () => { script.remove(); reject(new Error("Infobox indisponible.")); };
        document.head.appendChild(script);
      }).catch(error => { window.LCDP_contactInfoChargement = null; throw error; });
    }
    return window.LCDP_contactInfoChargement.then(() => window.LCDP_CONTACT_INFO.ouvrir(type));
  }

  async function ouvrirInfoboxDemandeJuridique() {
    // Point d’entrée conservé pour les boutons existants ; aucun formulaire ni POST.
    try { await ouvrirContactInfo("juridique"); }
    catch (error) { console.error(error); window.alert("Pour toute question concernant les mentions légales ou vos données personnelles, écrivez à juridique@lacleduparc.fr depuis votre messagerie personnelle."); }
  }

  function fermerBoxMentions() {
    const overlay = document.querySelector("[data-lcdp-legal-lightbox]");

    if (!overlay) return;

    if (ETAT_BOX_MENTIONS.gestionnaireClavier) {
      document.removeEventListener(
        "keydown",
        ETAT_BOX_MENTIONS.gestionnaireClavier
      );
      ETAT_BOX_MENTIONS.gestionnaireClavier = null;
    }

    overlay.remove();
    document.body.classList.remove("lcdp-legal-lightbox-open");
    ETAT_BOX_MENTIONS.ouverte = false;
    ETAT_BOX_MENTIONS.chargement = false;

    if (
      ETAT_BOX_MENTIONS.focusAvantOuverture &&
      typeof ETAT_BOX_MENTIONS.focusAvantOuverture.focus === "function"
    ) {
      ETAT_BOX_MENTIONS.focusAvantOuverture.focus();
    }

    ETAT_BOX_MENTIONS.focusAvantOuverture = null;
  }

  async function ouvrirBoxMentions() {
    if (!estPageRestreinteMentions() || ETAT_BOX_MENTIONS.ouverte) {
      return;
    }

    const slot = document.getElementById("lcdp-lightbox-slot");

    if (!slot) {
      throw new Error("Slot de fenêtre introuvable.");
    }

    ETAT_BOX_MENTIONS.ouverte = true;
    ETAT_BOX_MENTIONS.chargement = true;
    ETAT_BOX_MENTIONS.focusAvantOuverture = document.activeElement;

    slot.innerHTML = "";

    const structure = creerStructureBoxMentions();
    rendreChargement(structure.contenu);
    slot.appendChild(structure.overlay);
    document.body.classList.add("lcdp-legal-lightbox-open");

    const fermer = () => fermerBoxMentions();

    structure.boutonFermer.addEventListener("click", fermer);
    structure.overlay.addEventListener("click", (event) => {
      if (event.target === structure.overlay) {
        fermer();
      }
    });

    ETAT_BOX_MENTIONS.gestionnaireClavier = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (
        structure.overlay.querySelector(
          "[data-lcdp-box-dialogue-bouton], " +
          "[data-lcdp-box-alerte]"
        )
      ) {
        return;
      }

      event.preventDefault();
      fermer();
    };

    document.addEventListener(
      "keydown",
      ETAT_BOX_MENTIONS.gestionnaireClavier
    );

    structure.boutonFermer.focus();

    try {
      const documentMentions = await chargerMentionsLegales();

      if (!ETAT_BOX_MENTIONS.ouverte) return;

      rendreMentions(structure, documentMentions);
    } catch (error) {
      if (!ETAT_BOX_MENTIONS.ouverte) return;

      rendreErreur(
        structure.contenu,
        String(error?.message || error || "")
      );
    } finally {
      ETAT_BOX_MENTIONS.chargement = false;
    }
  }

  function estLienFooterMentions(element) {
    if (!element || !estPageRestreinteMentions()) {
      return false;
    }

    const lien = element.closest(
      "[data-lcdp-box-footer] a[href*='mentions-legales'], " +
      "[data-lcdp-box-footer] a[data-site-href*='mentions-legales']"
    );

    return lien || false;
  }

  document.addEventListener(
    "click",
    (event) => {
      const lien = estLienFooterMentions(event.target);

      if (!lien) return;

      event.preventDefault();
      event.stopPropagation();

      ouvrirBoxMentions().catch((error) => {
        console.error("Erreur box mentions légales :", error);
      });
    },
    true
  );

  window.LCDP_DOCUMENTS_LEGAUX = Object.freeze({
    nettoyerHtml,
    ouvrirMentionsLegales: ouvrirBoxMentions,
    fermerMentionsLegales: fermerBoxMentions,
    ouvrirDemandeJuridique: () => ouvrirContactInfo("juridique")
  });
})();
