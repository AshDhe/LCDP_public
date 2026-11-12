# La Clé du Parc — références graphiques de dialogues et rapprochement
Date : 12 novembre 2026

## Références créées (sans activation automatique)
Propriétaire des règles : `OBJET/CSSBASE/lcdp-lightbox-convergence.css`.
Gabarits : `OBJET/HTMLBASE/02-dialogue-reference-information.html`, `02-dialogue-reference-choix.html`, `02-dialogue-reference-suppression.html`.

Sélecteur générique opt-in : `.lcdp-dialogue-ref`; variantes :
- `.lcdp-dialogue-ref--information` : pictogramme information forêt, texte, une seule action verte.
- `.lcdp-dialogue-ref--choix` : pictogramme interrogation ambre, action de retour neutre + validation verte.
- `.lcdp-dialogue-ref--suppression` : pictogramme alerte rose, conservation neutre + validation destructrice rose.

Règles communes issues des trois exemples communiqués : fond de superposition sombre à 50 % et flou, carte blanche max 384 px, coins 24 px, padding 24 px, icône carrée 48 px, titre 18 px poids 900, texte secondaire 12 px, actions espacées de 24 px, boutons de 48 px minimum, coins 16 px. Aucun reset global, aucune modification des composants `lcdp-box-*` ni du CSS central assemblé.

**Attention :** les fragments HTML sont des gabarits de référence. Aucun contrôleur métier ni gestionnaire de clic n'est branché sur ces fichiers. Les intégrer en production exige un adaptateur explicite et un test du parcours complet. Il serait incorrect de présenter leurs boutons comme fonctionnels actuellement.

## Rapprochement statique des usages (sans migration)
| Usage et source vérifiée | Profil candidat | Statut / précaution |
|---|---|---|
| Information « accès déjà planifié », `LCDP_membre/ESPACE-MEMBRE/reserver-membre.js` | Information | Candidat direct ; vérifier texte de réservation, fermeture et position dans wrapper |
| Information « invitation déjà reçue », même fichier | Information | Candidat direct ; conserver les droits et distinctions invitation/réservation |
| Messages de confirmation de transmission de formulaire, `LCDP_public/ESPACE-PUBLIC/formulaire-inscription-membre.js` | Information | Vérifier redirections et accusés de réception |
| Alertes de connexion et d'accès, `LCDP_public/ESPACE-PUBLIC/accueil-public-alertes.js`, `connexion-membre.js`, `connexion-coach.js`, `connexion-parc.js` | Information ou avertissement (profil non encore créé) | Ne pas classer tout message d'erreur comme information : rôle et niveau de gravité à définir |
| Confirmation « Prolonger votre abonnement ? », `LCDP_membre/ESPACE-MEMBRE/abonnement-membre.js` | Choix | Préserver Oui/Non et retour du choix |
| Confirmation d'action parrainage/changement de compte, `LCDP_membre/ESPACE-MEMBRE/box-menu-burger-membre.js` | Choix | Adapter uniquement après vérification des actions et libellés |
| Confirmation « Planifier votre accès ? », `LCDP_membre/ESPACE-MEMBRE/reserver-membre.js` | Choix | Gabarit existant déjà jugé propre ; garder intact tant que la comparaison visuelle n'est pas approuvée |
| Confirmation annulation d'abonnement, `LCDP_membre/ESPACE-MEMBRE/abonnement-membre.js` | Suppression potentielle | Vérifier conditions, frais et actions avant rattachement |
| Annulation de réservation, `LCDP_membre/ESPACE-MEMBRE/mes-acces-membre.js` et `planning-membre.js` | Suppression potentielle | Vérifier s'il s'agit d'annulation définitive, gestion des invités, droits |
| Suppression définitive dans `LCDP_admin/ESPACE-ADMIN/B_ADMIN/Cle.js` | Suppression | Candidat sémantique ; ne pas modifier `window.confirm` sans remplacement sûr du booléen |
| Suppression d'une entrée dans `LCDP_admin/ESPACE-ADMIN/B_ADMIN/list-points.js` | Suppression potentielle | Vérifier le caractère irréversible |
| Alertes de réussite édition/publication, `LCDP_admin/ESPACE-ADMIN/B_ADMIN/{faq-admin,cgv-admin,mentions-legales-admin,reglement-app-admin,reglement-club-admin}.js` | Information | Candidats directs sous réserve de l'état de publication et du retour attendu |
| `LCDP_public/OBJET/JSBASE/02-footer.js` : alertes information/validation/erreur | Information ou avertissement | Messages à classifier individuellement |
| `LCDP_membre/ESPACE-MEMBRE/lacleduparc.js` : alerte et saisie Ma clé | Information pour alertes simples uniquement | Ne pas confondre avec dialogue à champs/code |
| `LCDP_membre/ESPACE-MEMBRE/da-membre.js` : confirmation DA terminée | Choix | Ne pas modifier la saisie d'état civil |
| `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.html` : sortie et confirmation | Choix ou suppression selon conséquences | Dialogues natifs `<dialog>` à adapter séparément |

## Familles à ne PAS rapprocher sans profil distinct
- Dialogues de saisie et d'édition : `04-dialogue-champ.html`, `04-dialogue-champ-inviter.html`, état civil, coordonnées, Ma clé.
- Téléversement image : `04-dialogue-upload-img.html`.
- Choix multiples, calendrier et tunnels : `04-calendrier-*.html`, `04-workflow-*.html`, ABO-RÉZA et PLANIFIER.
- Documents longs, facture, galerie, fiche de parc, liste d'invités, formulaire de contact.
- Dialogues Shadow DOM : `lcdp-dialogues-shadow.css`, règles non transmissibles directement à l'intérieur des racines Shadow.
- Les `window.alert` / `window.confirm` natifs ne sont pas stylables ; leur remplacement touche au comportement.

## Autres références possiblement nécessaires — non créées
- **Erreur / échec non destructif** : message d'échec, validation de saisie, service indisponible.
- **Choix neutre** : dialogue à deux actions sans action dangereuse, déjà compatible avec « choix » mais à tester.
- **Formulaire / saisie** : variante structurelle distincte, pas une alerte à simple message.

## Déploiement sécurisé
1. Valider visuellement les trois gabarits sur les largeurs de référence (320, 360, 390 px, desktop), sans aucune migration métier.
2. Définir pour chaque usage réel : titre, message, couleur métier, libellés d'actions, issue de fermeture, effet de retour (booléen/promesse), portage dans le wrapper et focus.
3. Migrer UN seul usage puis vérifier comportement et rendu avant d'étendre.
4. Ne pas imposer de style aux autres boîtes par sélecteurs globaux ; classe opt-in uniquement.
5. Vérifier sur site réel les feuilles CSS effectivement chargées, notamment `lcdp-lightbox-convergence.css`.

## Limites
Rapprochement par lecture statique, sans test navigateur ni inventaire de toutes les variantes de message. Les correspondances ci-dessus sont des candidats d'intégration, pas une preuve d'équivalence fonctionnelle. Aucune boîte métier n'a été migrée vers les nouveaux gabarits.
