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

## H. Suivi opérationnel CHOIX au 13 novembre 2026 — rapprochement avec les migrations

L'inventaire ci-dessus est une photographie statique du 12 novembre ; il reste inchangé dans ses sections A–G. Ce complément constitue le **statut de traitement** demandé, et non un nouvel audit exhaustif des instances runtime. Les commits sont détaillés dans `/MIGRATION-DIALOGUES.md`.

| Source/cas de l'inventaire initial et vérifications complémentaires | Statut CHOIX au 13/11 | Référence / décision |
|---|---|---|
| MEMBRE `abonnement-membre.js` : prolongation, sortie, commande et régularisation | **TRAITÉ** | `9b1b73c9`, `9cad9dd0` ; annulations destructrices hors CHOIX |
| MEMBRE `accueil-membre.js`, `inviter-membre.js` : confirmation abonnement/paiement | **TRAITÉ** | `08c80640`, `0a4d48a1` |
| MEMBRE `mes-informations.js` : régularisation, géolocalisation, demande CODR | **TRAITÉ** | `8e5124d3`, `8e11983a` |
| MEMBRE `reserver-membre.js` : régularisation, déclaration Duo Actif, microphone IA, parc et couverture partielle | **TRAITÉ** | `caef48ab`, `52e44023`, `32d17481`, `4abc5c22` |
| PUBLIC et MEMBRE `fiche-parc.js` : confirmation de l'heure d'arrivée | **TRAITÉ** | `870e909f`, `273434dc` |
| MEMBRE `da-membre.js` : « DA terminée ? », « Quitter ma DA ? » | **TRAITÉ** | `d287e085` |
| MEMBRE `box-menu-burger-membre.js` : déconnexion | **TRAITÉ** | `4185b8fa`, `604ee044` |
| ADMIN `B_ADMIN/admin-actualite.js` : publication/dépublication, sélection pop-up | **TRAITÉ** | `e80219de` ; suppression d'article reportée |
| ADMIN `B_ADMIN/faq-admin.js` : publication | **TRAITÉ** | `34fefd7f` ; suppression FAQ reportée |
| ADMIN `B_ADMIN/cgv-admin.js`, `mentions-legales-admin.js`, `reglement-app-admin.js`, `reglement-club-admin.js` : publications | **TRAITÉ** | `f0c10770`, `bd9d8226`, `d847509f`, `cef68291` |
| ADMIN `B_ADMIN/CalculPoints.js` : lancer le calcul | **TRAITÉ** | `df0504b2` |
| ADMIN `C_MEMBRES/suspension-membres.js` : suspendre/lever la suspension | **TRAITÉ** | `02aa7aa4` |
| ADMIN `B_PARCS/AjustCoach.js`, `AjustDuo.js`, `AjustFamille.js`, `InsertFamille.js` : validation des ajustements | **TRAITÉ** | `8e38e0a6`, `ab661ec3`, `52bb5c54`, `0b572c4a` |
| ADMIN `B_PARCS/planning-parc.js` : ancienne journée, enregistrement d'une nouvelle base | **TRAITÉ** | `5e62eb13`, `e5997331`, CSS `cb28ac04` |
| ADMIN `C_MEMBRES/SuiviDA.html` : confirmation de date de décision DA | **TRAITÉ** | `904d5a3a` ; formulaire de date et API inchangés |
| MEMBRE/PUBLIC/PARC/COACH : menus de changement d'espace connecté avec trois comptes | **REPORTÉ — MULTI-CHOIX** | Contenu spécifique, trois destinations. Arbitrage utilisateur, pas de conversion binaire |
| MEMBRE `reserver-membre.js` : choix d'abonnement, panneau « Votre planning », récapitulatif de réservation | **REPORTÉ — WORKFLOW COMPLEXE** | Plusieurs actions, données dynamiques ; arbitrage utilisateur |
| MEMBRE `aboreza-membre.js`, `abonnement-membre.js` : conteneurs de tunnels | **REPORTÉ — WORKFLOW COMPLEXE** | Ne pas substituer un gabarit binaire au flux |
| MEMBRE `mes-informations.js`, `abonnement-membre.js`, `reserver-membre.js` : échéances multiples | **REPORTÉ — ÉCRAN MÉTIER** | Plusieurs actions « Payer », pas une confirmation Oui/Non |
| MEMBRE `reserver-membre.js` : « Choisir un parc » (un bouton) ; « Planning en cours » (actions et cartes) | **REPORTÉ — À REQUALIFIER** | Respectivement INFORMATION à action unique et écran métier avec annulations |
| MEMBRE `mes-informations.js` : message « Sécurité du compte » OK/Annuler à action identique | **REPORTÉ — À REQUALIFIER** | Une seule issue ; classer INFORMATION ou ERREUR suivant le contenu dynamique |
| PUBLIC `accueil-public.js` : helper `ouvrirDialogueBoutons` historique | **REPORTÉ — AUCUN APPEL INTERNE CONSTATÉ** | Fonction déclarée, pas d'appel repéré dans ce fichier ; ne pas présumer qu'elle est inutilisée à l'exécution |
| ADMIN `B_PARCS/planning-parc.js` : sortie avec sauvegarde/brouillon et opérations susceptibles d'annuler des réservations | **REPORTÉ — IMPACTS À QUALIFIER** | Sortie à plusieurs issues ; écritures et annulations possibles |
| MEMBRE `planning-membre.js`, `mes-acces-membre.js`, `abonnement-membre.js`, ADMIN `B_ADMIN/Cle.js`, `list-points.js`, `PrixAbo.js`, `faq-admin.js`, `admin-actualite.js` | **REPORTÉ — SUPPRESSION** | Confirmations d'annulation/suppression explicites, à traiter au profil SUPPRESSION |
| Les autres sources inventoriées en section C sans classification unitaire de leurs messages | **REPORTÉ — À QUALIFIER** | Inventaire par source, pas preuve d'une instance CHOIX simple résiduelle |

**Pense-bête à conserver :** retourner vers l'utilisateur pour les décisions sur les menus multi-comptes et workflows multi-actions, sans perdre le tableau. **Règle d'avancement :** ne marquer TRAITÉ que les cas avec code migré/commit vérifié ; les statuts REPORTÉ sont des exceptions documentées. La migration de code ne vaut pas validation navigateur. Aucun test desktop/mobile attesté pour ces lots.


## I. Suivi SUPPRESSION — 13 novembre 2026
| Source/cas | Statut | Référence |
|---|---|---|
| ADMIN `B_ADMIN/PrixAbo.js` : supprimer définitivement une version d'abonnement | **TRAITÉ (migration statique)** | `49224c72` ; ancien `window.confirm` remplacé par le gabarit SUPPRESSION, retour booléen sécurisé, endpoint inchangé |
| ADMIN `B_ADMIN/Cle.js`, `list-points.js`, `faq-admin.js`, `admin-actualite.js` | **REPORTÉ — SUPPRESSION** | À migrer après vérification des conséquences et des appels |
| MEMBRE : annulations de réservation, invitation, abonnement et dates | **REPORTÉ — SUPPRESSION** | Ne pas modifier les règles métier ni les Workers |

Aucun test navigateur réalisé pour ce lot. L'inventaire CHOIX (section H) reste une photographie de son propre avancement ; la migration SUPPRESSION n'implique pas sa clôture.


### I.1 Comparaison et statut SUPPRESSION — contrôle ciblé du 13 novembre 2026
| Dépôt / cas | Ancien comportement vérifié | Statut / motif | Commit |
|---|---|---|---|
| ADMIN `B_ADMIN/list-points.js` | Ancien dialogue à boutons, confirmation « Supprimer l’entrée », booléen avant `supprimerPoint` | **TRAITÉ — migration statique** : gabarit SUPPRESSION, libellés/retour/traitement conservés | `b1bb145e` |
| ADMIN `B_ADMIN/Cle.js` | Ancien dialogue avec recours possible à `window.confirm` | **NON TRAITÉ** : secours natif et fermeture à harmoniser sans réduire la sécurité | — |
| ADMIN `B_ADMIN/faq-admin.js` | Confirmation de suppression d'un bloc du brouillon, puis clic relancé | **NON TRAITÉ** : mécanisme de propagation/clic à préserver | — |
| ADMIN `B_ADMIN/admin-actualite.js` | Supprime article du brouillon, site public et éventuelle pop-up ; image conservée | **NON TRAITÉ** : effets multiples documentés | — |
| MEMBRE `mes-acces-membre.js` | `window.confirm` avant annulation réservation/invitation, notification via Worker | **NON TRAITÉ** : droits/effets métier et annulations à préserver | — |

**Limites :** comparaison ciblée de sources, non audit exhaustif supplémentaire ; migrations enregistrées en commits, sans test navigateur ni validation sur le site déployé.


### I.2 Actualisation — clés ADMIN, 13 novembre 2026
| Cas | Comparaison de l'ancien et du nouveau | Statut | Commit |
|---|---|---|---|
| `LCDP_admin/B_ADMIN/Cle.js` : supprimer clé, Brac ou clé Bluetooth | Ancien dialogue à boutons avec repli `window.confirm`. Nouveau gabarit SUPPRESSION avec titre dynamique, confirmation booléenne et absence d'écriture en cas d'échec du dialogue ; appel DELETE inchangé. | **TRAITÉ — migration statique** (remplace le statut NON TRAITÉ du tableau I.1) | `af3a4e67` |

Les autres cas du tableau I.1 demeurent non traités. Aucun test navigateur réalisé.


### I.3 Actualisation — suppression FAQ ADMIN, 13 novembre 2026
| Cas | Comparaison | Statut | Commit |
|---|---|---|---|
| `LCDP_admin/B_ADMIN/faq-admin.js`, suppression d'un bloc FAQ du brouillon | Ancien dialogue à boutons, Non/Oui, avec autorisation de relancer le clic de suppression. Nouveau gabarit SUPPRESSION, même décision booléenne et même mécanisme de relance ; branche publication CHOIX inchangée. | **TRAITÉ — migration statique**, remplace le statut NON TRAITÉ du tableau I.1 | `abf8b51d` |

`admin-actualite.js` et les annulations MEMBRE restent non traités. Aucun test navigateur.


### I.4 Actualisation — suppression actualités ADMIN, 13 novembre 2026
| Cas | Ancien comportement / comparaison | Statut | Commit |
|---|---|---|---|
| `LCDP_admin/B_ADMIN/admin-actualite.js`, supprimer actualité | Ancien dialogue à boutons pour suppression brouillon/site/pop-up, image conservée ; nouveau gabarit SUPPRESSION avec message, Annuler/Supprimer et retour booléen ; publication/dépublication CHOIX et `sauver('supprimer',a.id)` inchangés. | **TRAITÉ — migration statique** (remplace NON TRAITÉ de I.1) | `245b3b42` |

Les annulations MEMBRE restent ouvertes. Aucun test navigateur réalisé.


### I.5 Actualisation — annulations MES ACCÈS membre, 13 novembre 2026
| Cas | Comparaison | Statut | Commit |
|---|---|---|---|
| `LCDP_membre/ESPACE-MEMBRE/mes-acces-membre.js` : annulation accès ou invitation reçue | Ancien `window.confirm` avec deux messages métier ; nouveau dialogue SUPPRESSION conservant le texte, distinction des cas, décision booléenne et mêmes requêtes d'annulation ; fermeture neutre en cas d'échec. | **TRAITÉ — migration statique** (remplace le statut NON TRAITÉ de I.1 pour cette source) | `845cf9aa` |
| `LCDP_membre/planning-membre.js`, `abonnement-membre.js` : autres annulations | Flux de réservation et abonnement à analyser individuellement, ne pas confondre avec l'annulation MES ACCÈS. | **NON TRAITÉ — à qualifier** | — |

Aucun test navigateur effectué.


## J. Bilan des anciens mécanismes retirés — contrôle des six commits SUPPRESSION du 13 novembre 2026

**Périmètre :** examen des diffs GitHub des six commits de migration `49224c72`, `b1bb145e`, `af3a4e67`, `abf8b51d`, `245b3b42` et `845cf9aa`. Le mot « supprimé » désigne ici le retrait d'un ancien mécanisme de confirmation du code source, **pas** la suppression de fichiers complets ni une exécution réelle de suppression de données métier.

| Dépôt / source | Ancien mécanisme retiré dans le commit | Remplacement / conservation | Statut |
|---|---|---|---|
| ADMIN `B_ADMIN/PrixAbo.js` | Appel `window.confirm` de suppression d'une version d'abonnement | Référence SUPPRESSION ; requête métier conservée ; commit `49224c72` | **RETIRÉ — vérifié par diff** |
| ADMIN `B_ADMIN/list-points.js` | Ancien bloc `02-dialogue-bouton.html` de confirmation de suppression de point | Référence SUPPRESSION ; `supprimerPoint` conservé ; commit `b1bb145e` | **RETIRÉ — vérifié par diff** |
| ADMIN `B_ADMIN/Cle.js` | Ancien bloc `02-dialogue-bouton.html` et secours `window.confirm` de suppression de clé/Brac/Bluetooth | Référence SUPPRESSION ; méthode DELETE conservée ; commit `af3a4e67` | **RETIRÉ — vérifié par diff** |
| ADMIN `B_ADMIN/faq-admin.js` | Ancienne branche `02-dialogue-bouton.html` de suppression de bloc FAQ | Référence SUPPRESSION ; branche CHOIX de publication et gestionnaire de clic maintenus ; commit `abf8b51d` | **RETIRÉ — vérifié par diff** |
| ADMIN `B_ADMIN/admin-actualite.js` | Ancien gestionnaire `02-dialogue-bouton.html`, secours `window.confirm` | Référence SUPPRESSION pour supprimer ; branche CHOIX de publication préservée ; commit `245b3b42` | **RETIRÉ — vérifié par diff** |
| MEMBRE `mes-acces-membre.js` | Appel `window.confirm` pour annuler accès ou invitation reçue | Référence SUPPRESSION ; appels de réservation et notifications maintenus ; commit `845cf9aa` | **RETIRÉ — vérifié par diff** |

**Bilan vérifiable :** six fichiers JavaScript modifiés, zéro fichier entier supprimé par ces six commits. Le gabarit partagé `OBJET/HTMLBASE/02-dialogue-bouton.html` reste nécessaire pour d'autres consommateurs documentés (CHOIX complexes, tunnels et écrans métiers) ; **NE PAS SUPPRIMER**. Les styles hérités doivent également être conservés tant que leurs consommateurs résiduels existent.

**Non traité / non prouvé :** retrait exhaustif de tous les appels anciens dans les cinq dépôts ; inutilisation à l'exécution des anciens gabarits ; tests navigateur ; absence de régression fonctionnelle. Les annulations `planning-membre.js`, `abonnement-membre.js` et autres cas ouverts restent à rapprocher. Aucune suppression de données de production n'a été effectuée par ces commits de migration.


### I.6 Comparaison SUPPRESSION — abonnement MEMBRE, 13 novembre 2026
| Cas | Avant | Après / statut | Commit |
|---|---|---|---|
| `LCDP_membre/ESPACE-MEMBRE/abonnement-membre.js` : première confirmation « Voulez-vous annuler l'abonnement ? » | `afficherAlerte` sur `02-alerte.html`, confirmation OK ou fermeture négative | **TRAITÉ — migration statique** : référence SUPPRESSION, Conserver / Oui, annuler, booléen, refus si gabarit indisponible ; Worker inchangé | `623e9bd0` |
| Même source : deuxième confirmation « Des frais de traitement d’annulation s’appliquent… » | `afficherAlerte` sur `02-alerte.html`, OK nécessaire avant enregistrement | **NON TRAITÉ — À QUALIFIER** : validation explicite des frais, ne pas supprimer le second verrou ni le classer simple INFORMATION | — |

**Nettoyage CSS** : aucun fichier CSS supprimé dans ce lot. `02-alerte.html` reste consommé par d'autres alertes et par la seconde validation. Conserver ses styles. Tests navigateur non réalisés.


### I.7 Rapprochement — annulations PLANNING membre, 13 novembre 2026
| Source/cas | Comparaison ancien / nouveau | Statut | Commit |
|---|---|---|---|
| `LCDP_membre/ESPACE-MEMBRE/planning-membre.js`, annulation réservation/invite par `traiterAnnulationReservation` | Ancien dialogue à boutons Non/Oui, variant selon la présence du workflow et le type d'accès ; nouveau gabarit SUPPRESSION en surcouche lorsque nécessaire, deux textes métier préservés et décision booléenne. | **TRAITÉ — migration statique** | `fb5871a3` |
| `planning-membre.js`, autres consommateurs éventuels des helpers `ouvrirDialogueBoutons`, `ouvrirDialogueBoutonsParDessusLightbox` | Helpers historiques toujours présents après migration ; leur absence de consommateurs n'est pas démontrée. | **À QUALIFIER — ne pas supprimer les helpers ni leurs CSS** | — |
| `abonnement-membre.js`, deuxième confirmation des frais d'annulation | Alerte OK/fermeture avant demande d'avoir ; validation explicitement distincte. | **NON TRAITÉ — à qualifier**, statut I.6 maintenu | — |

**CSS / gabarits** : aucun fichier CSS ni gabarit historique supprimé ; recherche des consommateurs résiduels nécessaire avant tout retrait. Vérification statique uniquement, pas de test navigateur.


### J.1 Nettoyage de code documenté — PLANNING MEMBRE, 13 novembre 2026
| Élément examiné | Constat avant | Action / constat après | Statut / commit |
|---|---|---|---|
| `LCDP_membre/ESPACE-MEMBRE/planning-membre.js` : `ouvrirDialogueBoutons` et `ouvrirDialogueBoutonsParDessusLightbox` | Deux déclarations sans appel interne dans le fichier après migration `fb5871a3` ; deux chargements de l'ancien `02-dialogue-bouton.html` | Deux fonctions locales supprimées (129 lignes) ; zéro référence littérale résiduelle à `02-dialogue-bouton.html` dans ce fichier ; nouveau helper SUPPRESSION et traitement métier présents | **RETIRÉ — vérifié statiquement**, `2e068a28` |
| `OBJET/HTMLBASE/02-dialogue-bouton.html` et CSS historiques | Composants partagés avec d'autres consommateurs documentés | **CONSERVÉS**, contrôle inter-dépôts préalable au nettoyage | **NON SUPPRIMÉS** |

La ligne de J.1 concernant les helpers remplace le statut « à qualifier » de I.7 pour **ces deux fonctions locales seulement**. Aucun test navigateur ; n'en déduire aucune inutilisation globale du gabarit historique ou de ses styles.


### I.8 Comparaison SUPPRESSION — opérations du planning ADMIN, 13 novembre 2026
| Source et cas | Comportement antérieur | Traitement / statut | Commit |
|---|---|---|---|
| `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js`, suppression d'opération ponctuelle (`[data-delete]`) | `confirm()` natif, avec avertissement « Les réservations annulées restent annulées. » puis `POST /supprimer-operation` | **TRAITÉ — migration statique** : référence SUPPRESSION Conserver/Supprimer, avertissement préservé, refus sans écriture ; requête inchangée | `6092e8c6` |
| Même fichier : `nouvelleBase` et bouton `annuler-base` | Confirmations d'abandon d'une base non enregistrée | **NON TRAITÉ — À QUALIFIER** : perte de brouillon local, ne pas confondre avec suppression d'opération serveur | — |
| Même fichier : `appliquerIA` | Confirmation d'enregistrement d'une opération pouvant annuler des réservations | **NON TRAITÉ — IMPACTS À QUALIFIER** : écriture et annulations induites | — |
| Même fichier : dialogue de sortie | Plusieurs issues, sauvegarder/rester/ignorer | **REPORTÉ — MULTI-ACTIONS** | — |

**Nettoyage CSS** : `lcdp-lightbox-convergence.css` déjà chargé par `planning-parc.html`. Aucun CSS ancien supprimé dans ce lot. Aucun test navigateur.


### I.9 Comparaison — abandon de nouvelle base, planning ADMIN (13 novembre 2026)
| Source / cas | Avant | Après / statut | Commit |
|---|---|---|---|
| `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js`, `nouvelleBase()` lorsque `baseDirty` | `confirm('Abandonner la nouvelle base en cours ?')` | **TRAITÉ — migration statique** : gabarit SUPPRESSION, Conserver/Abandonner, même décision de renoncer au brouillon local | `23fab949` |
| Même fichier, bouton `annuler-base` | `confirm('Abandonner la nouvelle base ?')` avant `annulerBase()` | **TRAITÉ — migration statique** : gabarit SUPPRESSION, annulation de la confirmation sans abandon du brouillon | `23fab949` |
| Même fichier, `appliquerIA()` | `confirm` d'enregistrement pouvant annuler des réservations | **NON TRAITÉ — IMPACTS À QUALIFIER** (seul appel natif `confirm` restant dans ce fichier) | — |
| Même fichier, dialogue de sortie | Plusieurs décisions (rester/enregistrer/ignorer) | **REPORTÉ — MULTI-ACTIONS** | — |

**Réconciliation** : les deux lignes « NON TRAITÉ — À QUALIFIER » de I.8 concernant `nouvelleBase` et `annuler-base` prennent désormais le statut TRAITÉ ci-dessus. Anciennes feuilles CSS : aucune suppression, `lcdp-lightbox-convergence.css` déjà raccordée à la page ; autres consommateurs à auditer avant retrait. Aucun test navigateur.


### I.10 Actualisation — deuxième confirmation des frais, abonnement MEMBRE (13 novembre 2026)
| Cas | Comparaison | Statut | Commit |
|---|---|---|---|
| `LCDP_membre/ESPACE-MEMBRE/abonnement-membre.js`, avertissement des frais d'annulation | Ancienne `afficherAlerte` confirmable OK/fermeture, deuxième verrou après la demande d'annulation. Nouvelle confirmation SUPPRESSION avec message inchangé, boutons « Conserver » / « Poursuivre l’annulation », deuxième verrou booléen maintenu avant `POST /demander-annulation`. | **TRAITÉ — migration statique** ; remplace le NON TRAITÉ de I.6 et I.7 pour ce seul cas | `a2cbea71` |
| `02-alerte.html` et CSS associés | `afficherAlerte` reste appelée à d'autres endroits du même fichier ; consommateurs non épuisés | **CONSERVER — nettoyage non autorisé** | — |

Aucun test navigateur ; ne pas déduire qu'une confirmation des frais vaut une acceptation contractuelle distincte des CGV, le code ne conserve que le même oui/non qu'avant.


### I.11 Rapprochement adjacent CHOIX — opération IA, planning ADMIN (13 novembre 2026)
| Cas | Comparaison | Statut / profil | Commit |
|---|---|---|---|
| `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js`, `appliquerIA()` | Ancien `confirm` natif avant **enregistrement** d'une opération, avertissant des possibles annulations de réservations. Nouveau gabarit CHOIX déjà disponible dans ce fichier ; texte et requête `/operation` conservés. | **TRAITÉ — CHOIX**, reclasse le « NON TRAITÉ — IMPACTS À QUALIFIER » de I.8 et I.9 ; ne pas compter comme SUPPRESSION | `636b04f8` |

**Contrôle local de source** : zéro appel `confirm()` natif restant dans `planning-parc.js`. Cela ne prouve pas leur disparition dans les autres fichiers ou dépôts. Aucun CSS supprimé. Test navigateur non réalisé.


### J.2 Contrôle des consommateurs CSS/gabarits encore actifs (13 novembre 2026)
| Fichier inspecté | Consommateurs de `02-dialogue-bouton.html` restants | Conséquence |
|---|---|---|
| `LCDP_membre/ESPACE-MEMBRE/abonnement-membre.js` | **3** : mode de paiement (`afficherEtapePaiement`), `ouvrirDialogueChoix` du workflow d'abonnement, « Paiement en attente » et échéances non payées | **GABARIT ET CSS À CONSERVER** ; trois parcours non migrés / de nature différente |
| `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js` | **0 référence littérale** à l'ancien dialogue ; **0 appel natif** `confirm()` | Contrôle limité au fichier ; aucune autorisation globale de suppression CSS |

Les deux fichiers sont syntaxiquement valides lors de la vérification statique. Les parcours d'abonnement, leur mise en page, les dépendances indirectes et les cinq dépôts dans leur ensemble ne sont pas testés au navigateur ; aucune suppression CSS dans ce contrôle.


### I.12 SUPPRESSION — titres À propos ADMIN (13 novembre 2026)
| Source et cas | Ancien comportement | Statut / comparaison | Commit |
|---|---|---|---|
| `LCDP_admin/ESPACE-ADMIN/B_ADMIN/a-propos-admin.js` : suppression d'un titre À propos | `02-dialogue-bouton.html`, Non/Oui et avertissement de diffusion après enregistrement ; suppression locale du brouillon, puis enregistrement explicite | **TRAITÉ — migration statique** : `02-dialogue-reference-suppression.html` avec les mêmes textes, validation booléenne et enregistrement séparé. CSS de convergence chargé. | `f867df3f` |
| Même fichier : dépendance à l'ancien dialogue | Une référence littérale à `02-dialogue-bouton.html` | **RETIRÉE** ; aucune référence littérale résiduelle dans le fichier après mise à jour. Ne prouve pas l'inutilisation de l'ancien gabarit dans les autres sources. | `f867df3f` |

**Limites** : suppression fonctionnelle sur brouillon local uniquement tant qu'aucun enregistrement n'a lieu. Aucun CSS partagé supprimé. Aucun test navigateur.


### J.3 Nettoyage du code mort des dialogues ADMIN légaux (13 novembre 2026)
| Fichier | Ancien mécanisme constaté | Opération / statut | Commit |
|---|---|---|---|
| `B_ADMIN/cgv-admin.js` | Branche inatteignable `02-dialogue-bouton.html` après confirmation active CHOIX | **RETIRÉ — code mort**, pas une migration SUPPRESSION | `9bd3e3d4` |
| `B_ADMIN/mentions-legales-admin.js` | Même branche héritée après retour/exception CHOIX | **RETIRÉ — code mort**, pas une migration SUPPRESSION | `8d000213` |
| `B_ADMIN/reglement-app-admin.js` | Même branche héritée après retour/exception CHOIX | **RETIRÉ — code mort**, pas une migration SUPPRESSION | `38511e0d` |
| `B_ADMIN/reglement-club-admin.js` | Même branche héritée après retour/exception CHOIX | **RETIRÉ — code mort**, pas une migration SUPPRESSION | `3e9970ec` |

Aucun des quatre fichiers ne conserve de référence littérale à `02-dialogue-bouton.html` après nettoyage ; chacun conserve le dialogue de publication CHOIX. Aucun CSS ni gabarit commun supprimé. Les consommateurs des autres dépôts n'ont pas été déclarés épuisés et aucun test navigateur n'est réalisé.


## K. Priorité MEMBRE, PUBLIC, puis COACH/PARC — rapprochement du 13 novembre 2026

Cette section actualise les statuts précédents ; la photographie initiale A–G reste historique. `TRAITÉ` signifie code modifié et commit confirmé, non test fonctionnel navigateur.

| Priorité / source | Comparaison ancien → nouveau | Statut et conséquence | Commits |
|---|---|---|---|
| MEMBRE `reserver-membre.js`, abandon des dates en attente | Dialogue ancien NON/ANNULER → SUPPRESSION avec rappel des dates non enregistrées ; chemin d'effacement local conservé | **TRAITÉ — SUPPRESSION**, validation booléenne | `3d6826db`, `85bdb74e` |
| MEMBRE `reserver-membre.js`, annulation de réservation/invitation enregistrée | Dialogue ancien NON/ANNULER → SUPPRESSION, type/parc/date conservés, même `POST /annuler-reservation` | **TRAITÉ — SUPPRESSION**, même requête ; fermeture du fond neutre | `3d6826db`, `85bdb74e` |
| MEMBRE `accueil-membre.js`, déconnexion | Ancien dialogue à boutons → référence CHOIX avec Annuler/Confirmer ; requête `/deconnexion` conservée | **TRAITÉ — CHOIX**, contrôle de sécurité CODA non modifié | `009bedee` |
| PUBLIC `accueil-public.js`, helper dialogue sans appel | `ouvrirDialogueBoutons` déclaré une fois, zéro invocation locale ; 60 lignes de code devenu orphelin | **RETIRÉ — nettoyage**, plus de référence littérale à ancien fragment dans ce fichier | `ac70287d` |
| PUBLIC `fiche-parc.js`, confirmation d'heure | Gabarit CHOIX déjà actif mais secours `window.confirm` si slot manquant → toujours CHOIX sans dépendance au slot | **TRAITÉ — CHOIX**, pas de secours natif | `686e2282` |
| PARC `accueil-parc.js` + `accueil-parc.html` | Alerte ancienne pour tous messages → profil INFORMATION pour messages explicitement marqués, alertes d'erreur conservées | **TRAITÉ — INFORMATION**, CSS convergence chargé sur l'accueil | `d3b0835b`, `ebe2cd1a` |
| PARC `box-menu-burger-parc.js`, information « Mon compte » | Ancien appel d'alerte sans profil → appel INFORMATION explicite | **TRAITÉ — INFORMATION**, déconnexion inchangée | `0baa3731` |
| COACH `box-menu-burger-coach.js`, information « Mon compte » | Ancien appel d'alerte sans profil → branche INFORMATION déjà existante dans `accueil-coach.js` | **TRAITÉ — INFORMATION**, déconnexion inchangée | `2c24dbf4` |
| MEMBRE `reserver-membre.js`, deux derniers appels de l'ancien dialogue | Échéances de paiement et dialogues multi-étapes / multi-actions PLANIFIER | **NON TRAITÉ — à qualifier**, pas de suppression CSS | — |
| MEMBRE `accueil-membre.js`, trois appels de l'ancien dialogue | Paiement, transfert sécurisé du navigateur et choix associé | **NON TRAITÉ — à qualifier**, conserver les gabarits | — |
| PUBLIC `box-menu-burger-public.js`, sélecteur de compte | Choix de plusieurs comptes, pas un CHOIX binaire | **REPORTÉ — multi-actions**, conserver le gabarit | — |
| COACH / PARC, `box-menu-burger-{coach,parc}.js` | « Changer d’espace connecté » propose trois comptes, non assimilable à SUPPRESSION/CHOIX binaire | **REPORTÉ — multi-actions**, conserver l'ancien dialogue et CSS | — |
| COACH / PARC, alertes de déconnexion échouée | Alerte d'erreur existante ; profil ERREUR non engagé dans cette passe | **NON TRAITÉ — profil ERREUR ultérieur** | — |

### K.1 Compteurs de dépendances vérifiés après cette passe
| Fichier | Références littérales `02-dialogue-bouton.html` encore présentes | Décision |
|---|---:|---|
| MEMBRE `reserver-membre.js` | 2 | Conserver gabarit/CSS |
| MEMBRE `accueil-membre.js` | 3 | Conserver gabarit/CSS |
| PUBLIC `accueil-public.js` | 0 | Retrait local seulement |
| PUBLIC `fiche-parc.js` | 0 | Retrait local seulement |
| PARC `box-menu-burger-parc.js` | 1 | Conserver gabarit/CSS |
| COACH `box-menu-burger-coach.js` | 1 | Conserver gabarit/CSS |

**Bilan CSS : zéro fichier supprimé.** CSS de convergence ajouté seulement sur l'accueil PARC. Les ressources historiques restent indispensables pour les parcours non binaires, de paiement et de sécurité ; une recherche inter-dépôts et une validation fonctionnelle restent nécessaires avant tout retrait. Sept fichiers JS contrôlés syntaxiquement ; pas de test navigateur.
