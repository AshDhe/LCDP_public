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

      function appliquerRoutesSite(racine = document) {
        racine.querySelectorAll("[data-site-href]").forEach((element) => {
          element.setAttribute("href", construireUrlSite(element.dataset.siteHref));
        });

        racine.querySelectorAll("[data-site-src]").forEach((element) => {
          element.setAttribute("src", construireUrlSite(element.dataset.siteSrc));
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

      async function afficherDialogueMonCompte() {
        const slot = document.getElementById("lcdp-lightbox-slot");
        slot.innerHTML = "";

        const fragment = await chargerFragment("/OBJET/HTMLBASE/02-dialogue-bouton.html");
        slot.appendChild(fragment);

        const dialogue = slot.querySelector("[data-lcdp-box-dialogue-bouton]");

        dialogue.querySelector("[data-lcdp-dialogue-title]").textContent = "Mon compte";
        dialogue.querySelector("[data-lcdp-dialogue-text]").textContent =
          "Choisissez l’espace de connexion adapté à votre situation.";

        const actions = dialogue.querySelector("[data-lcdp-dialogue-actions]");

        const boutons = [
          {
            label: "Me connecter",
            href: "/ESPACE-PUBLIC/connexion-membre.html",
            style: "lcdp-button-primary"
          },
          {
            label: "Être invité(e)",
            href: "/ESPACE-PUBLIC/inscription.html",
            style: "lcdp-button-secondary"
          }
        ];

        boutons.forEach((bouton) => {
          const lien = document.createElement("a");
          lien.className = "lcdp-button " + bouton.style;
          lien.textContent = bouton.label;
          lien.href = construireUrlSite(bouton.href);
          actions.appendChild(lien);
        });

        const fermer = () => {
          slot.innerHTML = "";
        };

        dialogue.querySelector("[data-lcdp-dialogue-close]").addEventListener("click", fermer);

        dialogue.addEventListener("click", (event) => {
          if (event.target === dialogue) {
            fermer();
          }
        });
      }

      window.LCDP_ouvrirDialogueMonCompte = afficherDialogueMonCompte;

      document.addEventListener("lcdp:ouvrir-dialogue-mon-compte", () => {
        afficherDialogueMonCompte().catch(console.error);
      });

      async function initialiserBandeau() {
        const slot = document.getElementById("lcdp-bandeau-slot");
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
        slot.innerHTML = "";

        const footer = await chargerFragment("/OBJET/HTMLBASE/02-footer.html");
        slot.appendChild(footer);

        appliquerRoutesSite(slot);
      }

      async function chargerDonneesObjet(chemin) {
        const config = window.SITE_CONFIG || {};
        const url = typeof config.objetUrl === "function"
          ? config.objetUrl(chemin)
          : construireUrlSite("/OBJET" + chemin);
        const reponse = await fetch(url, {cache: "no-cache", credentials: "same-origin"});
        if (!reponse.ok) throw new Error("Données publiques indisponibles");
        const data = await reponse.json();
        if (!data || data.schema !== 1) throw new Error("Schéma public invalide");
        return data;
      }

      async function initialiserListe() {
        const type = document.body.dataset.lcdpListePublique;
        if (!type) return; // Pages éditoriales statiques : wrapper commun uniquement.
        const liste = document.getElementById("lcdp-liste-publique");
        const etat = document.getElementById("lcdp-liste-etat");
        const fragment = document.createDocumentFragment();
        if (type === "galerie") {
          const base = "/IMAG/BANDEAU-IMAGE/";
          const data = await chargerDonneesObjet(base + "bandeau-image.json");
          if (!Array.isArray(data.images)) throw new Error("Inventaire du bandeau invalide");
          data.images.forEach((item, i) => {
            const image = document.createElement("img");
            image.className = "lcdp-bandeau-image__galerie-photo";
            const chemin = base + "IMAG_" + (i + 1) + ".webp";
            const config = window.SITE_CONFIG || {};
            image.src = typeof config.objetUrl === "function" ? config.objetUrl(chemin) : construireUrlSite("/OBJET" + chemin);
            image.alt = typeof item?.alt === "string" && item.alt.trim() ? item.alt : "Illustration " + (i + 1);
            image.loading = i === 0 ? "eager" : "lazy";
            image.decoding = "async";
            fragment.append(image);
          });
          etat.textContent = "Aucune image publiée pour le moment.";
        } else if (type === "temoignages") {
          // Ce fichier public contient exclusivement les témoignages autorisés à la publication.
          const data = await chargerDonneesObjet("/DATA/temoignages.json");
          if (!Array.isArray(data.temoignages)) throw new Error("Liste des témoignages invalide");
          const roles = new Map([["membre", "Membre"], ["coach", "Coach"], ["parc", "Parc"]]);
          for (const item of data.temoignages) {
            if (!item || !roles.has(item.type) || typeof item.texte !== "string" || !item.texte.trim()) continue;
            const carte = document.createElement("blockquote");
            carte.className = "lcdp-cartouche-citation lcdp-cartouche-citation--" + item.type;
            const citation = document.createElement("p");
            citation.textContent = "« " + item.texte.trim() + " »";
            const signature = document.createElement("footer");
            signature.textContent = "— " + roles.get(item.type);
            carte.append(citation, signature);
            fragment.append(carte);
          }
          etat.textContent = "Aucun témoignage publié pour le moment.";
        } else {
          throw new Error("Type de liste publique inconnu");
        }
        etat.hidden = fragment.childElementCount > 0;
        liste.replaceChildren(fragment);
      }

      async function initialiserPage() {
        appliquerRoutesSite(document);
        await Promise.allSettled([
          initialiserBandeau().catch(console.error),
          initialiserFooter().catch(console.error),
          initialiserListe().catch(erreur => {
            console.error(erreur);
            document.getElementById("lcdp-liste-etat").textContent = "Le contenu est momentanément indisponible.";
          })
        ]);
      }

      const attente = document.getElementById("lcdp-attente-arrivee");
      const terminer = () => { attente.hidden = true; };
      attente.hidden = false;
      const delai = window.setTimeout(terminer, 15000);
      window.addEventListener("pageshow", event => { if (event.persisted) terminer(); });
      initialiserPage().finally(() => { window.clearTimeout(delai); terminer(); });
    })();
