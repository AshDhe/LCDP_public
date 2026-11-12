# LA CLÉ DU PARC — Inventaire statique des dialogues, alertes et fenêtres
Date : 12 novembre 2026. Dépôts : LCDP_public, LCDP_membre, LCDP_admin, LCDP_parc, LCDP_coach (branches main).
**Aucun fichier de production modifié pour cet inventaire.**

## Méthode et portée
Arborescences GitHub récupérées sans troncature. Lecture de **160 fichiers HTML et 101 fichiers JavaScript** : 84 HTML/34 JS public, 23/27 membre, 43/30 admin, 5/5 parc, 5/5 coach. Repérage statique des objets, attributs dialog/alertdialog, appels JS et fenêtres natives, complété par la lecture de CSS centralisés et des CSS spécialisés « dialogues-shadow », « lightbox-convergence », « factures-modal », « planifier ».
Attention : un fichier HTML qui contient `#lcdp-lightbox-slot` ne crée PAS à lui seul une boîte. Une référence de classe CSS ne prouve PAS l'instanciation au runtime. Un appel de `window.alert` peut être un secours d'erreur, pas le comportement courant. Les créations par chaînes CSS/DOM, appels à des bibliothèques et Workers demandent une vérification dynamique supplémentaire avant de déclarer un élément « inutilisé ».

## A. 19 gabarits HTML centraux avec rôle de dialogue/modal
Tous les chemins ci-dessous sont relatifs à `LCDP_public/OBJET/HTMLBASE/`. L'existence est vérifiée ; présence d'un appel pour chaque variante à préciser lors de l'audit de consommation.
| # | Objet | Usage / nature |
|---|---|---|
| 1 | `01-box-affiche.html` | Affiche d'accueil, rôle dialog |
| 2 | `02-alerte.html` | Alerte simple avec message, croix, bouton ; role=alertdialog |
| 3 | `02-dialogue-bouton.html` | Titre, message, actions ; rôle dialog |
| 4 | `04-calendrier-an.html` | Calendrier annuel modal |
| 5 | `04-calendrier-jour.html` | Calendrier journalier modal |
| 6 | `04-calendrier-mois.html` | Calendrier mensuel modal |
| 7 | `04-card-acces-parc.html` | Détail accès au parc, rôle dialog |
| 8 | `04-card-listinvites-oui-non.html` | Invités, rôle dialog |
| 9 | `04-card-recaporder.html` | Récapitulatif commande, rôle dialog |
| 10 | `04-dialogue-champ-inviter.html` | Saisie email invitation |
| 11 | `04-dialogue-champ.html` | Saisie générique et validation |
| 12 | `04-dialogue-upload-img.html` | Import d'images |
| 13 | `04-facture.html` | Facture en fenêtre modale |
| 14 | `04-fiche-parc.html` | Fiche de parc modale |
| 15 | `04-listemails.html` | Liste des emails en dialogue |
| 16 | `04-shift-detail-parc.html` | Détail du shift de parc |
| 17 | `04-workflow-abonnement.html` | Tunnel d'abonnement modal |
| 18 | `04-workflow-reservation.html` | Tunnel de réservation modal |
| 19 | `07-diginum.html` | Saisie diginum, rôle dialog |
**Ne pas confondre** rôle HTML modal et affichage réel : plusieurs tunnels enlèvent `aria-modal` lorsqu'ils sont intégrés en ligne.

## B. Fenêtres hors gabarits centraux identifiées
| Source | Dialogue |
|---|---|
| `LCDP_public/ESPACE-PUBLIC/accueil-public.html` | Popover de vérification `popover="auto" role="dialog"` |
| `LCDP_public/ESPACE-PUBLIC/actualite.js` | `<dialog>` natif créé par JS (`showModal`) pour une actualité |
| `LCDP_public/OBJET/JSBASE/02-contact.js` | Dialogue natif de contact (`showModal`) |
| `LCDP_public/ESPACE-PUBLIC/preparer-acces-parc.html` | Deux `<dialog>` natifs : `confirmation-geolocalisation` et `information-erreur-optin` |
| `LCDP_public/ESPACE-PUBLIC/preparer-acces-parc.js` | Ouverture des deux dialogues précédents |
| `LCDP_public/ESPACE-PUBLIC/en-savoir-plus.js` | Overlay propre, `aria-modal` |
| `LCDP_public/OBJET/JSBASE/documents-legaux.js` | Overlay propre des documents légaux |
| `LCDP_membre/ESPACE-MEMBRE/box-choix-planifier.html` | Boîte spécifique choix PLANIFIER |
| `LCDP_membre/ESPACE-MEMBRE/paiement-membre.html` | `lcdp-paiement-bon` role=dialog |
| `LCDP_membre/ESPACE-MEMBRE/controle-acces-ui.js` | `lcdp-acces-lightbox`, role=alertdialog créé en JS |
| `LCDP_membre/ESPACE-MEMBRE/rdv-da-membre.js` | `<dialog>` natif créé par JS, `showModal` |
| `LCDP_membre/ESPACE-MEMBRE/mes-informations.js` | Dialogues natifs `showModal` en plus des composants centraux |
| `LCDP_membre/ESPACE-MEMBRE/planning-membre.js` | Superpositions spécifiques d'invitations / invitations de réservation ; démodalisation de workflows intégrés |
| `LCDP_membre/ESPACE-MEMBRE/aboreza-membre.js` | `modalComposant`, réutilisation de `02-dialogue-bouton.html`, variantes du tunnel ABO-RÉZA |
| `LCDP_membre/config.js` | Écran `role=alertdialog` de session remplacée |
| `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.html` | Deux `<dialog>` : `planning-confirmation-ancien` et `planning-sortie` |
| `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js` | Ouverture des deux fenêtres `showModal` |
| `LCDP_admin/ESPACE-ADMIN/B_PARCS/PlanningParc.js` | Copie de structure d'alerte générée en JS (HTML littéral) |
| `LCDP_parc/ESPACE-PARC/accueil-parc.js` | Alertes centrales + intégration `cal("modal")` du calendrier externe |
| `LCDP_coach/ESPACE-COACH/accueil-coach.js` | Alertes centrales + intégration `cal("modal")` du calendrier externe |
**Vérification complémentaire nécessaire :** les fenêtres Shadow DOM (deux familles ci-dessous), les overlays générés en JavaScript sans chaîne « dialog », les éventuelles dépendances externes et l'activité réelle des fichiers.

## C. Inventaire des consommateurs JavaScript, par espace
Une ligne décrit les sources retrouvées, non un nombre exact de fenêtres instanciées.

### Espace public / entrée, connexion et compte
- `accueil-public-alertes.js` : gestionnaire d'alerte central.
- `accueil-public.js` : alertes, dialogues à boutons, connexion requise, demandes de parrain.
- `box-menu-burger-public.js` : dialogue de choix de compte/connexion.
- `connexion-coach.js`, `connexion-parc.js` : alerte centrale avec secours `window.alert`.
- `connexion-membre.js` : alerte centrale.
- `controle-acces-accueil.js` : alerte à l'entrée.
- `codes-securite.js` : alerte de contrôle des codes.
- `hello.js` : alertes de validation et d'erreur.
- `formulaire-inscription-membre.js` : alertes de saisie, protection, soumission.
- `formulaire-liste-attente.js` : alertes de formulaire.
- `mdp-perdu-membre.js` : alerte de récupération.
- `fiche-parc.js` : alerte propre, confirm de secours, dialogue de partage d'e-mails, overlay.
- `actualite.js` : fenêtre native d'actualité.
- `en-savoir-plus.js` : overlay.
- `OBJET/JSBASE/02-contact.js` : dialogue de contact natif.
- `OBJET/JSBASE/02-footer.js` : alertes et dialogue champ pour actions du pied de page.
- `OBJET/JSBASE/03-formulaire-protege.js` : secours `window.alert`.
- `OBJET/JSBASE/documents-legaux.js` : overlay documentaire, secours `window.alert`.
- Les pages `FAQ-public.html`, `PAGE WAIT.html`, `actualite.html`, `actualites-liste.html`, `benevolat.html`, `coach.html`, `galerie.html`, `les-coachs.html`, `les-parcs.html`, `membre-bienfaiteur.html`, `mentions-legales.html`, `reglement-app.html`, `reglement-club.html`, `responsable-parc.html`, `temoignages.html` embarquent des appels au dialogue à boutons dans leur script HTML.
- `association.html`, `le-club.html` embarquent un appel à l'alerte centrale.
- `preparer-acces-parc.html` et JS : deux dialogues natifs liés à l'opt-in de géolocalisation.

### Espace membre
- `abonnement-membre.js` : alerte de paiement, confirmation prolongation/annulation, choix abonnement, dialogue e-mails famille, édition d'email.
- `aboreza-membre.js` : catalogue et tunnel ABO-RÉZA, dialogue modal générique, calendrier, panier, choix et préparations.
- `accueil-membre.js` : alertes d'abonnement/paiement, dialogue à boutons, formulaire d'alerte planning.
- `box-menu-burger-membre.js` : alertes, changement de compte, choix d'abonnement, invitation/DA.
- `controle-acces-ui.js` : lightbox d'accès.
- `da-membre.js` : alerte DA, confirm/alert natifs de secours, dialogue état civil.
- `fiche-parc.js` : alert/confirm natifs de secours.
- `inviter-membre.js` : alertes, dialogue d'invitation, champ d'email.
- `lacleduparc.js` : alertes et dialogues à champs Ma clé, bracelet, validation.
- `mdp-membre.js` : alertes.
- `mes-acces-membre.js` : alertes/confirmations natives pour invités et annulation ; calendrier.
- `mes-factures-membre.js` : alertes centrales avec secours natif.
- `mes-informations.js` : dialogues alias, email, parrain, département, facturation, IBAN/SWIFT/RIB, Wi-Fi, alertes, dialogues natifs.
- `mes-points.js` : alertes centrales et secours natif.
- `paiement-membre.js` : workflow et alerte centrale ; le récapitulatif est une étape interne, pas une seconde fenêtre modale.
- `planning-membre.js` : réservations, invitations, demandes de confirmation et liste d'invités, alertes natives de secours, workflows.
- `rdv-da-membre.js` : dialogue RDV natif.
- `reserver-membre.js` : alertes et dialogues des droits, de réservation, COACH, IA, calendrier, choix de plage, contrôle d'accès et paiement.
- `config.js` : alerte de session remplacée.

### Espace administrateur
- `B_ADMIN/CalculPoints.js`, `Cle.js`, `PrixAbo.js`, `list-points.js` : alertes et/ou dialogues de confirmation ; secours natifs à plusieurs endroits.
- `B_ADMIN/a-propos-admin.js`, `C_MEMBRES/suspension-membres.js` : dialogue à boutons.
- `B_ADMIN/admin-actualite.js` : alertes, confirmation et secours `window.confirm`.
- `B_ADMIN/cgv-admin.js`, `faq-admin.js`, `mentions-legales-admin.js`, `reglement-app-admin.js`, `reglement-club-admin.js` : alertes de brouillon/publication et dialogue à boutons.
- `B_PARCS/AjustCoach.js`, `AjustDuo.js`, `AjustFamille.js`, `InsertFamille.js` : dialogue à boutons.
- `B_PARCS/PlanningParc.js`, `planning-parc.js` : alerte intégrée / dialogues natifs spécifiques.
- `B_PARCS/upload-img-admin.js` : dialogue de téléversement avec erreurs et alertes.
- `A_STRUCTURE/table-lecture-admin.js` : `window.alert` de secours.
- `B_PARCS/CardParc.html`, `CarteParc.html`, `statutparc.html` : alertes déclarées dans scripts intégrés.
- `C_MEMBRES/SuiviDA.html` : dialogue de saisie, alertes et fermeture spécifique.
- `accueil-admin.html` : nombreux dialogues de saisie/changement de paramètres, import d'image et alertes.
- `connexion-admin.html`, `connexion-admin.js` : alertes à la connexion.
- `B_PARCS/planning-parc.html` : deux `<dialog>` définis dans HTML.

### Espaces parc et coach
- `LCDP_parc/ESPACE-PARC/accueil-parc.js` : boîte d'alerte centrale + secours natif + modal Cal.
- `LCDP_parc/ESPACE-PARC/box-menu-burger-parc.js` : dialogue à boutons.
- `LCDP_coach/ESPACE-COACH/accueil-coach.js` : boîte d'alerte centrale + secours natif + modal Cal.
- `LCDP_coach/ESPACE-COACH/box-menu-burger-coach.js` : dialogue à boutons.

## D. Familles CSS vérifiées et coexistence de profils
- `lcdp-central-module-06.css` : alerte c033 ; typographie et bouton propres à `.lcdp-box-alerte`.
- `lcdp-central-module-03.css` : dialogue à boutons c036, workflow réservation et personnalisation du dialogue de connexion.
- `lcdp-central-module-05.css` : dialogue-champ c066.
- `lcdp-central-module-09-fondations.css` : fondations et focus partagé.
- `lcdp-central-module-12-gabarit-composants.css` : adaptations structurelles de dialogue et formulaire.
- `lcdp-dialogues-shadow.css` : **deux dialogues distincts Shadow DOM**, confirmation et formulaire, avec leurs propres jetons et styles.
- `lcdp-lightbox-convergence.css` : **socle de convergence déjà existant**, notamment accueil membre et variantes PLANIFIER (opt-in) : NE PAS le recréer.
- `lcdp-factures-modal.css` : styles particuliers des fenêtres de facture.
- `lcdp-planifier.css` : surcharges métier PLANIFIER et vues associées.
- `lcdp-central-mobile-first.tailwind.css`, `lcdp-da-membre.tailwind.css`, `lcdp-mon-compte.tailwind.css` : anciens fichiers toujours présents ; documentation du 5 novembre indique qu'ils NE sont PLUS des sources officielles.
- `lcdp-central-mobile-first.css` : CSS central publié, très volumineux ; lecture intégrale non obtenue via le connecteur lors de l'examen précédent. Ne pas modifier directement.

## E. Candidats « qui traînent » : état NON DÉTERMINÉ
Aucun gabarit ne peut être déclaré inutilisé par la seule présence de son fichier. Le statut « sans appel identifié » exige une recherche de toutes les chaînes de chargement, y compris les constructions dynamiques ; le statut « réellement inutilisé » exige en plus des tests de parcours. Cette distinction empêche les suppressions abusives.

## F. Risques de normalisation
1. Coexistence de plusieurs moteurs de dialogue (alerte, boutons, champ, formulaire, Shadow DOM, DOM natif, Cal) : une règle CSS commune ne peut pas agir uniformément sans qualifier les frontières DOM.
2. Modales internes intégrées à des workflows : ne pas rendre modal un contenu qui a été explicitement démodalisé.
3. Connexion, sécurité, géolocalisation, administration, paiement et annulation : les boutons, la fermeture et l'obligation de répondre ne doivent pas être modifiés par l'harmonisation graphique.
4. Certains secours natifs (`window.alert`, `window.confirm`) ne sont pas stylables avec CSS.
5. Le registre CSS de phase 2 impose de respecter le module propriétaire ; il signale déjà des conflits historiques.

## G. Exhaustivité : limite de cette photographie
L'inventaire couvre les cinq dépôts nommés et les 261 fichiers HTML/JS sur leurs branches main, pour les constructions et appels statiquement repérables. Il ne prétend pas dénombrer chaque texte de message, chaque chemin d'exécution, ni certifier quels fichiers sont actifs sur le site déployé. Aucun Worker ni dépôt supplémentaire n'a été inventorié. La couverture de tous les appels à partir de noms construits dynamiquement n'est pas démontrée.
