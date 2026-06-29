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
          cache: "force-cache"
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

        const fragment = await chargerFragment("/OBJET/BOX/02-box-dialogue-bouton.html");
        slot.appendChild(fragment);

        const dialogue = slot.querySelector("[data-lcdp-box-dialogue-bouton]");

        dialogue.querySelector("[data-lcdp-dialogue-title]").textContent = "Mon compte";
        dialogue.querySelector("[data-lcdp-dialogue-text]").textContent =
          "Choisissez l’espace de connexion adapté à votre situation.";

        const actions = dialogue.querySelector("[data-lcdp-dialogue-actions]");

        const boutons = [
          {
            label: "Me connecter",
            href: "/ESPACE-PUBLIC/connexion.html",
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

        const bandeau = await chargerFragment("/OBJET/BOX/02-box-bandeau-nav.html");
        slot.appendChild(bandeau);

        appliquerRoutesSite(slot);

        await chargerScriptUneFois("/ESPACE-PUBLIC/box-menu-burger-public.js");

        if (typeof window.LCDP_initialiserMenuBurgerPublic === "function") {
          await window.LCDP_initialiserMenuBurgerPublic();
        }
      }

      async function ajouterBoxText(slotId, titre, contenuHtml) {
        const slot = document.getElementById(slotId);
        slot.innerHTML = "";

        const fragment = await chargerFragment("/OBJET/BOX/01-box-text.html");
        slot.appendChild(fragment);

        const box = slot.querySelector("[data-lcdp-boxtext]");
        box.querySelector("[data-lcdp-boxtext-title]").textContent = titre;
        box.querySelector("[data-lcdp-boxtext-content]").innerHTML = contenuHtml;

        appliquerRoutesSite(slot);
      }

      async function ajouterMenuBoutons(slotId, boutons, options = {}) {
        const slot = document.getElementById(slotId);
        slot.innerHTML = "";

        const fragment = await chargerFragment("/OBJET/BOX/02-box-menu-bouton.html");
        slot.appendChild(fragment);

        const liste = slot.querySelector("[data-lcdp-menu-bouton-list]");

        if (options.single === true) {
          liste.classList.add("lcdp-box-menu-bouton__list--single");
        }

        boutons.forEach((bouton) => {
          const lien = document.createElement("a");
          lien.className = "lcdp-button " + bouton.style;
          lien.textContent = bouton.label;
          lien.href = construireUrlSite(bouton.href);

          liste.appendChild(lien);
        });
      }

      async function ajouterGalerie(slotId, configuration) {
        if (typeof window.LCDP_ajouterGalerie !== "function") {
          throw new Error("Objet galerie V3 introuvable.");
        }

        await window.LCDP_ajouterGalerie(slotId, configuration);
      }

      async function initialiserFooter() {
        const slot = document.getElementById("lcdp-footer-slot");
        slot.innerHTML = "";

        const footer = await chargerFragment("/OBJET/BOX/02-box-footer.html");
        slot.appendChild(footer);

        appliquerRoutesSite(slot);
      }

      async function initialiserPage() {
        appliquerRoutesSite(document);

        await initialiserBandeau();

        await ajouterBoxText(
          "lcdp-boxtext-intro-slot",
          "Bénéficiez de La Clé du Parc sans payer d'abonnement",
          `
            <p>
              En devenant membre invité La Clé du Parc, vous bénéficiez gratuitement d'un accès nominatif à l'ensemble des parcs du club. Aucune limite ne s'applique au nombre d'invitations que vous recevez, ni au nombre de membres abonnés qui peuvent vous inviter et vous restez membre aussi longtemps que vous souhaitez, sous réserve de respecter le règlement du club.
            </p>

            <p>
              Consultez le
              <a
                class="lcdp-link-secondary"
                href="../ESPACE-PUBLIC/le-reglement-du-club.html?source=inscription"
                data-site-href="/ESPACE-PUBLIC/le-reglement-du-club.html?source=inscription"
              >règlement du club</a>
              et le
              <a
                class="lcdp-link-secondary"
                href="../ESPACE-PUBLIC/le-reglement-de-lapplication.html?source=inscription"
                data-site-href="/ESPACE-PUBLIC/le-reglement-de-lapplication.html?source=inscription"
              >règlement de l'application</a>
              pour en savoir plus.
            </p>
          `
        );

        await ajouterMenuBoutons(
          "lcdp-menu-ouverture-slot",
          [
            {
              label: "J’ouvre mon compte de membre invité",
              href: "/ESPACE-PUBLIC/formulaire-inscription-membre.html?source=inscription",
              style: "lcdp-button-primary"
            }
          ],
          { single: true }
        );

        await ajouterBoxText(
          "lcdp-boxtext-connexion-slot",
          "Déjà membre du club ?",
          `
            <p>
              Connectez-vous ici.
            </p>
          `
        );

        await ajouterMenuBoutons(
          "lcdp-menu-connexion-slot",
          [
            {
              label: "Connexion membre",
              href: "/ESPACE-PUBLIC/connexion.html?source=inscription",
              style: "lcdp-button-secondary"
            }
          ],
          { single: true }
        );

        await ajouterGalerie(
          "lcdp-galerie-invitation-slot",
          {
            titre: "Pourquoi devenir membre invité ?",
            ariaLabel: "Pourquoi devenir membre invité ?",
            cartes: [
              {
                titre: "Faites-vous inviter",
                imageSrc: "/OBJET/IMAG/GALERIE/INSCRIPTION-MEMBRE/membre-invite.jpg",
                imageAlt: "Membre invité La Clé du Parc",
                imageLegende: "Image recomposée d'illustration - Non contractuelle",
                texte: "Accédez gratuitement à des espaces plein air d'exception grâce aux invitations de membres abonnés. Vous pouvez rester membre du club autant que vous souhaitez sous réserve de respecter le règlement du club."
              },
              {
                titre: "Venez vous ressourcer",
                imageSrc: "/OBJET/IMAG/GALERIE/INSCRIPTION-MEMBRE/petit-groupe.jpg",
                imageAlt: "Se ressourcer seul ou en groupe avec La Clé du Parc",
                imageLegende: "Image recomposée d'illustration - Non contractuelle",
                texte: "Prenez le temps de vous ressourcer et de partager vos passions dans un cadre calme, naturel et sécurisé. La Clé du Parc vous donne un accès contrôlé à des parcs plein air d'exception sélectionnés pour leur capacité à vous apporter une véritable respiration."
              },
              {
                titre: "Venez en famille",
                imageSrc: "/OBJET/IMAG/GALERIE/INSCRIPTION-MEMBRE/invite-famille.jpg",
                imageAlt: "Invité famille La Clé du Parc",
                imageLegende: "Image recomposée d'illustration - Non contractuelle",
                texte: "Partagez en famille des moments d'exception. Un membre qui est abonné famille peut inviter les membres de sa famille autant de fois que nécessaire. Sous réserve de respecter le règlement du club."
              },
              {
                titre: "Invité(e) par un coach",
                imageSrc: "/OBJET/IMAG/GALERIE/INSCRIPTION-MEMBRE/activite-coach.jpg",
                imageAlt: "Activités et coachs avec La Clé du Parc",
                imageLegende: "Image recomposée d'illustration - Non contractuelle",
                texte: "La Clé du Parc valorise les activités de plein air, les rencontres bénéfiques et un usage respectueux des lieux. En tant que membre invité, vous pouvez suivre votre coach dans le cadre d'activités qu'il organise à travers les parcs du réseau."
              },
              {
                titre: "Des moments uniques",
                imageSrc: "/OBJET/IMAG/GALERIE/INSCRIPTION-MEMBRE/vous-ressourcer.jpg",
                imageAlt: "Partager des moments uniques avec La Clé du Parc",
                imageLegende: "Image recomposée d'illustration - Non contractuelle",
                texte: "La Clé du Parc donne à ses membres un accès contrôlé à des parcs plein air d'exception sélectionnés pour leur capacité à vous faire ressentir des moments uniques. Autorisez-vous à vivre de belles émotions le plus souvent possible."
              },
              {
                titre: "Des lieux d'émotion",
                imageSrc: "/OBJET/IMAG/GALERIE/INSCRIPTION-MEMBRE/lieux-inoubliables.jpg",
                imageAlt: "Des parcs d'exception avec La Clé du Parc",
                imageLegende: "Image recomposée d'illustration - Non contractuelle",
                texte: "La Clé du Parc sélectionne des parcs plein air d'exception choisis pour leur qualité esthétique remarquable et un environnement naturel et culturel à la fois original, préservé et prestigieux."
              }
            ]
          }
        );

        await ajouterMenuBoutons(
          "lcdp-menu-informations-slot",
          [
            {
              label: "Contrôle des accès",
              href: "/ESPACE-PUBLIC/controle-des-acces.html?source=inscription",
              style: "lcdp-button-primary"
            },
            {
              label: "Le club et l'association",
              href: "/ESPACE-PUBLIC/la-cle-du-parc.html?source=inscription",
              style: "lcdp-button-primary"
            },
            {
              label: "Le règlement du club",
              href: "/ESPACE-PUBLIC/le-reglement-du-club.html?source=inscription",
              style: "lcdp-button-primary"
            },
            {
              label: "Le règlement de l’application",
              href: "/ESPACE-PUBLIC/le-reglement-de-lapplication.html?source=inscription",
              style: "lcdp-button-primary"
            }
          ]
        );

        await ajouterMenuBoutons(
          "lcdp-menu-ouverture-final-slot",
          [
            {
              label: "J’ouvre mon compte de membre invité",
              href: "/ESPACE-PUBLIC/formulaire-inscription-membre.html?source=inscription",
              style: "lcdp-button-orange"
            }
          ],
          { single: true }
        );

        await ajouterBoxText(
          "lcdp-boxtext-responsables-slot",
          "Responsable de parc / Responsable d'activité",
          `
            <p>
              Vous êtes responsable de parc ou d'une activité conciliable avec le plein air ?
            </p>

            <p>
              Demandez à être rappelé(e) par notre équipe. Chaque demande est étudiée et fait l’objet d’une réponse personnalisée.
            </p>
          `
        );

        await ajouterMenuBoutons(
          "lcdp-menu-contact-slot",
          [
            {
              label: "Je suis responsable de parc",
              href: "/ESPACE-PUBLIC/formulaire-contact-parc.html?source=inscription",
              style: "lcdp-button-secondary"
            },
            {
              label: "Je suis responsable d'activité",
              href: "/ESPACE-PUBLIC/formulaire-contact-coach.html?source=inscription",
              style: "lcdp-button-secondary"
            }
          ]
        );

        await initialiserFooter();
      }

      initialiserPage().catch((erreur) => {
        console.error(erreur);
      });
    })();