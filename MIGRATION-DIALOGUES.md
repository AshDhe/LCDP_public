# LCDP — Migration des dialogues vers quatre profils graphiques

Dernière mise à jour : 12 novembre 2026. Document de reprise inter-fils.

## Objectif et périmètre
Supprimer les doublons CSS historiques, sans en ajouter. Quatre profils graphiques uniques : INFORMATION, CHOIX, SUPPRESSION, ERREUR. Les boîtes existantes conservent leurs comportements métier, actions JavaScript, valeurs de retour, formulaires et contrats API. Ne pas confondre création des profils et harmonisation accomplie.

## Méthodologie convenue
1. Reprendre les audits et inventaires déjà réalisés (ne pas recommencer un audit général). Vérifier seulement les dépendances exactes avant modification.
2. Travailler par lots limités (en général 3 à 5 dialogues) et privilégier les fonctions JS communes pour migrer plusieurs consommateurs d'un coup.
3. Ordre des familles : INFORMATION, puis CHOIX, SUPPRESSION et ERREUR.
4. Utiliser les références graphiques communes dans `LCDP_public/OBJET/CSSBASE/lcdp-lightbox-convergence.css` et les fragments `LCDP_public/OBJET/HTMLBASE/02-dialogue-reference-{information,choix,suppression,erreur}.html`. Aucun CSS graphique spécifique supplémentaire par page.
5. La page et son JavaScript déterminent le profil, le titre, les messages, les boutons, les actions et le contexte (viewport ou conteneur). Les Workers conservent les règles métier, les autorisations, les codes et réponses. Ne modifier un Worker que si son contrat impacte directement le dialogue.
6. À chaque migration, conserver l'emplacement DOM, les ouvertures/fermetures, les fonctions de rappel, les retours booléens et valeurs, le focus, les formulaires et les exigences d'accessibilité.
7. Une fois les consommateurs migrés et les dépendances vérifiées, supprimer effectivement les anciennes déclarations de présentation devenues inutilisées. Ne jamais supprimer un style encore partagé.
8. Vérifier sur desktop/mobile, les parcours réels, le comportement des boutons, l'absence de régression, et tracer l'état : migré en code ≠ testé en navigateur.
9. Conserver une trace des seuls fichiers réellement changés et des commits. Si un ZIP est demandé, n'inclure que les fichiers modifiés.

## Dépôts
`AshDhe/LCDP_public`, `AshDhe/LCDP_membre`, `AshDhe/LCDP_parc`, `AshDhe/LCDP_coach`, `AshDhe/LCDP_admin` (branches `main` lors de la rédaction).

## État vérifié (GitHub, non validé visuellement)
- Profils graphiques et HTML de référence : présents dans `LCDP_public`.
- `LCDP_membre/ESPACE-MEMBRE/reserver-membre.js` : INFORMATION pour « Accès déjà planifié », « Invitation déjà reçue », « Ce parc n'est pas encore accessible », information « Duo Actif » en maquette, indication ABO-RÉZA non raccordé, « Accès planifié », « Partage envoyé », « Votre invitation est annulée », « Votre réservation est annulée ».
- `LCDP_public/ESPACE-PUBLIC/accueil-public-alertes.js` : les trois boutons PLANIFIER, MES ACCÈS, MA CLÉ emploient INFORMATION pour afficher « Connexion nécessaire » et « Me connecter » lorsque le droit renvoie `non_connecte`. Leur redirection et leur fermeture restent en JS. Les erreurs de ce module restent temporairement sur l'ancien objet, avant le lot ERREUR.
- `LCDP_public/ESPACE-PUBLIC/connexion-membre.js` : les appels `afficherInformation` de type `information` utilisent désormais le profil INFORMATION ; les autres types restent temporairement sur le gabarit historique.
- `LCDP_membre/ESPACE-MEMBRE/inviter-membre.js` + `.html` : trois notifications INFORMATION (« Invitation envoyée », « L’annulation se fait depuis votre planning », « L’adresse sera raccordée ensuite »). La feuille de style commune est chargée explicitement. Les appels d'erreur et de confirmation non migrés conservent leur ancien objet.
- `LCDP_membre/ESPACE-MEMBRE/mes-informations.js` + `.html` : quatre confirmations du compte migrées vers INFORMATION (adresse de facturation, coordonnées de remboursement, parrain, département), CSS commun chargé.
- `LCDP_membre/ESPACE-MEMBRE/accueil-membre.js` : fonction `afficherAlerte` équipée d’un branchement explicite `options.profil: "information"` pour trois notifications ciblées (accès abonné requis, parrain à renseigner, invitation par le parrain). Les autres appels, notamment les erreurs et confirmations, conservent l’ancien objet. Le CSS commun était déjà chargé.
- `LCDP_membre/ESPACE-MEMBRE/planning-membre.js` + `.html` : notifications invitation envoyée (deux chemins métier), liste des invités mise à jour, information sur le parrain de l'invitation reçue, confirmation d'annulation d'invitation/réservation. Un helper INFORMATION gère le slot normal ou la superposition au workflow. CSS commun ajouté à la page. Les autres alertes restent inchangées.
- `LCDP_membre/ESPACE-MEMBRE/abonnement-membre.js` + `.html` : INFORMATION pour demande d'annulation d'abonnement enregistrée (avoir) et pour commande enregistrée avec virement. La confirmation commande conserve sa redirection vers la page abonnement au clic OK ou au clic sur l'arrière-plan. Les dialogues de décision « Prolonger ? », « Annuler ? », frais d'annulation et erreurs restent inchangés. CSS commun chargé.
- `LCDP_membre/ESPACE-MEMBRE/mdp-membre.js` + `.html` : confirmation de modification réussie du mot de passe migrée vers INFORMATION, en conservant la redirection vers la connexion après fermeture. Les échecs restent sur l'ancien objet.
- `LCDP_membre/ESPACE-MEMBRE/lacleduparc.js` + `.html` : INFORMATION pour checkout enregistré, checkout enregistré avec impossibilité d'éteindre automatiquement le bracelet, clé validée et bracelet allumé ; bouton OK et poursuite des actions métier inchangés.
- `LCDP_membre/ESPACE-MEMBRE/da-membre.js` : INFORMATION pour les deux cas de DA en cours et les deux cas d'éligibilité future des membres invités. CSS commun chargé via la fonction CSS existante. Erreurs et confirmations DA demeurent sur le système existant.
- `LCDP_membre/ESPACE-MEMBRE/mes-acces-membre.js` : quatre messages natifs `window.alert` migrés vers INFORMATION : identité de l'invitant, aucun invité enregistré, liste des invités, annulation enregistrée. L'affichage est désormais via fragment INFORMATION et feuille de style commune ; les erreurs et la confirmation native d'annulation ne sont pas modifiées.
- Les dialogues d'erreur et les dialogues nécessitant une décision ou des formulaires ne doivent pas être requalifiés automatiquement en INFORMATION.
- Nettoyage déjà réalisé dans `LCDP_public/OBJET/CSSBASE/lcdp-lightbox-convergence.css` : retrait du bloc spécifique ancienne alerte INFORMATION PLANIFIER.
- Migré en code ne signifie pas que l'ancienne famille graphique n'est plus utilisée ailleurs. Les CSS historiques subsistent et le chantier global est inachevé.

## Commits repères
Historique annoncé au début du chantier : `0f1e5fbb`, `abd31e5b`, `62bb71e9`, `ccbab407`.
Migration progressive : `721116fa`, `770faaf9`, `f46e40dc`, `abbb0c6f`, `e26077e6`, `e31738ac`, `7a5b356a`, `ffb0108e`, `de3d5072`, `9a56726c`, `480b0147`, `3af23778`, `e780006a`, `3d4b4770`, `9a1b4304`, `191d646e`, `9aa007f8`, `da4dd13f`, `5407e3b8`, `6136c1d4`, `7c37a446`, `883be4d7`, `a406f065`, `61df21d0`.

## Avancement supplémentaire — 12 novembre 2026 (lot suivant)
- **MEMBRE** — `ESPACE-MEMBRE/paiement-membre.js` : migration INFORMATION des messages de retour Stripe « paiement en cours de vérification » et « paiement non effectué / reprise ». Conservation du bouton « Reprendre le paiement », de l'appel à `/valider` et des redirections existantes. Commit `5a67537c`. Pas de Worker modifié.
- **PUBLIC** — `ESPACE-PUBLIC/formulaire-inscription-membre.js` + `.html` : notification de succès de l'inscription migrée vers INFORMATION ; redirection après fermeture maintenue. Les messages d'échec restent sur l'ancien objet. Commits `f42ed200`, `6a36e254`.
- **PUBLIC** — `ESPACE-PUBLIC/mdp-perdu-membre.js` + `.html` : message « Demande envoyée » (type `validation`) migré vers INFORMATION ; erreurs inchangées ; redirection maintenue. Commits `26173f84`, `32c49b6d`.
- **PUBLIC** — `ESPACE-PUBLIC/fiche-parc.js` + `.html` : succès de partage de fiche parc migré vers INFORMATION. La boîte de connexion avec réponse booléenne et les messages d'échec restent sur l'objet historique. Commits `4df3694b`, `258ad356`.
- **COACH** — `ESPACE-COACH/accueil-coach.js` + `.html` : trois notifications d'actions non encore raccordées migrées vers INFORMATION ; callback générique destiné aux erreurs reste sur l'ancien objet. Commits `30179eab`, `06b7c38e`.
- **PARC** — `ESPACE-PARC/accueil-parc.js` utilise l'ancienne alerte pour le callback de menu ; l'appel identifié dans le burger PARC concerne « Dialogue indisponible », qui relève d'ERREUR : **non migré**.

Aucun test utilisateur/navigateur n'a été réalisé à ce stade. Les anciens CSS ne sont pas supprimés lorsque d'autres profils continuent à les utiliser. Ne pas déclarer les espaces entièrement migrés sans contrôle ciblé des autres points d'appel.

- **PUBLIC, fiche parc, nouvelle migration** — `ESPACE-PUBLIC/fiche-parc.js` : le message empêchant la planification publique et invitant à se connecter passe au profil graphique INFORMATION. Il conserve ses deux issues métier « Connexion » (retour `true`, redirection) et « Fermer » ou clic sur l'arrière-plan (retour `false`, aucune redirection), grâce aux boutons graphiques standards. Commit `0734fc9e`. Aucun CSS supplémentaire créé.

- **PUBLIC, fiche parc, informations planning** — deux autres consommateurs de `afficherAlerteFicheParc` migrés : « Choisissez votre journée » et explication des droits de consultation du mois suivant. Les autres erreurs de la même fonction ne sont pas migrées. Commit `2a7b4faf`.

## Lot complémentaire INFORMATION — 12 novembre 2026
- **MEMBRE / Mes informations** : `mes-informations.js` — confirmation de changement d'alias et message positif du Worker concernant la demande de changement d'e-mail migrés vers `afficherInformationMembre`. Les échecs de formulaire d'alerte et les erreurs de suppression ont été renvoyés vers `afficherAlerte` (et non INFORMATION). Commit `61e4af70`. Le `posterJson` existant vérifie `resultat.ok === true` avant l'affichage des deux succès.
- **MEMBRE / Abonnement** : `abonnement-membre.js` — information « délai d'annulation dépassé » et information sur l'abonnement annulé non payé migrées vers `afficherInformationAbonnement` avec titres adaptés. Commit `01979c87`.
- Ces migrations sont **enregistrées dans le code, non testées en navigateur**. Les anciennes règles CSS des autres familles ne doivent pas être supprimées.
- **À contrôler avant clôture** : les retours de Workers susceptibles de contenir des messages métiers négatifs malgré une réponse technique réussie ; ne pas qualifier mécaniquement tout message dynamique de succès. Contrôler aussi les entrées INFORMATION des composants partagés, les appels restants dans les pages publiques, puis les dépendances CSS ciblées.

- **MEMBRE / PLANIFIER** : `reserver-membre.js` — restriction de la recherche IA aux abonnements permanents et absence d'échéance de paiement en souffrance migrées vers le profil INFORMATION existant (pas de CSS nouveau). Commit `8ea8e75b`.

## Lot INFORMATION supplémentaire — 12 novembre 2026
- **MEMBRE / ABONNEMENT** : dans `ESPACE-MEMBRE/abonnement-membre.js`, deux notifications du calendrier (« Vous êtes déjà abonné(e) à cette date », appelées depuis deux points, et « Date incompatible avec votre prochain abonnement ») et « Aucune échéance non payée » utilisent le profil INFORMATION partagé. Commits `04ed3f9c`, `8a59cf7c`. La superposition des informations de calendrier a été explicitement conservée afin de ne pas effacer le DOM du workflow sous-jacent.
- **MEMBRE / MES INFORMATIONS** : `ESPACE-MEMBRE/mes-informations.js`, « Aucune échéance non payée » utilise INFORMATION. Commit `7838fac9`.
- **MEMBRE / PLANIFIER** : `ESPACE-MEMBRE/reserver-membre.js`, notification des résultats d'alerte expirés et informations « Accès au parc clos » / « Cette plage a déjà commencé » migrées vers INFORMATION. Commits `21da84ea`, `a61d15ca`. Les plages passées conservent la fermeture par clic sur le fond, contrairement aux plages closes.
- **Contrôle** : modifications du code réalisées, pas de test navigateur mobile/desktop. Ne pas déclarer la famille achevée. Certaines fonctions historiques restent appelées par des erreurs, des confirmations ou des validations. Le nettoyage CSS demeure conditionné à la preuve d'absence de consommateurs résiduels.

## Lot INFORMATION — poursuite du 12 novembre 2026
- **MEMBRE / ABONNEMENT** : `ESPACE-MEMBRE/abonnement-membre.js` : trois points d'appel migrés vers INFORMATION en superposition du workflow : « Durée incompatible avec votre prochain abonnement » et, à deux endroits, « Vous n'avez plus assez de temps pour payer par virement avant le début de cet abonnement. » Les changements automatiques de mode de paiement vers CB et les retours métier restent exécutés après la fermeture. Commit `874ccfbf`.
- **MEMBRE / PLANIFIER** : `ESPACE-MEMBRE/reserver-membre.js` : deux notifications migrées, « Votre abonnement permanent doit être payé... » dans le cas sans régularisation disponible (texte dynamique `messageImpayé`) et « Cette plage a déjà commencé. » lors d'une validation de plage ; commits `4f74a811`. L'information « L'accès au microphone est nécessaire pour utiliser la recherche avec l'IA. » est migrée, commit `cbe7272b`.
- **Vérification structurelle ciblée** : les autres points d'appel inspectés dans `reserver-membre.js` restent liés à des erreurs techniques, des données absentes, des formulaires ou des boutons qui entraînent une décision (« M'abonner », page de paiement) ; ils ne peuvent pas être supprimés mécaniquement. Dans `abonnement-membre.js`, les confirmations de commande et de sortie et les erreurs de validation doivent conserver leur comportement en attendant les autres familles.
- **Nettoyage CSS** : aucun ancien CSS retiré dans ce lot, faute de preuve qu'il ne possède plus de consommateurs. Ne pas annoncer la clôture INFORMATION ni l'absence de régressions sans tests navigateurs. Aucun Worker modifié.

## Lot INFORMATION — poursuite du 12 novembre 2026

- **MEMBRE / INVITER** : `ESPACE-MEMBRE/inviter-membre.js` — cinq points d'appel (quatre formulations) migrés explicitement vers `profil: "information"` : accès réservé aux membres abonnés (deux parcours), abonnement suspendu/non payé, absence d'échéance impayée, droit d'invitation non configuré. Le composant partagé et son CSS étaient déjà branchés sur cette page. Commit `62e05733`.
- **MEMBRE / PLANIFIER** : `ESPACE-MEMBRE/reserver-membre.js` — indication « Sélectionnez d'abord un parc » raccordée à `afficherDialogueInformationPlanifier` (profil unique). Commit `f7e178b3`.
- **Délimitation du nettoyage** : les anciens `afficherAlerte` de ces deux modules conservent des appels relatifs à des erreurs de service, des validations de formulaire ou des décisions de paiement (retour booléen). Aucun retrait CSS ni suppression d'un composant partagé ne peut être attesté sans contrôle de ces dépendances. Changements GitHub réalisés, tests visuels et fonctionnels à effectuer.

## Vérifications complémentaires INFORMATION — 12 novembre 2026, fin d'après-midi
- **MEMBRE / ACCUEIL** : notification « Votre abonnement est suspendu » migrée vers le profil INFORMATION, sans modification de la redirection vers la régularisation lorsque celle-ci s'applique. Commit `25f085e7`, `ESPACE-MEMBRE/accueil-membre.js`.
- **MEMBRE / INVITER** : notification « Votre maxinvit est atteint » migrée vers INFORMATION avec `superposition: true` dans le helper partagé, afin que l'affichage n'efface pas le formulaire d'invitations déjà ouvert. Commit `eefd797a`, `ESPACE-MEMBRE/inviter-membre.js`.
- **MEMBRE / FICHE PARC** : « Votre nouvelle date a bien été enregistrée » utilise maintenant le profil INFORMATION et attend son bouton de fermeture avant de poursuivre. Le message d'échec d'enregistrement conserve l'ancien composant. CSS commun chargé si nécessaire depuis OBJET. Commit `e56dbdb7`, `ESPACE-MEMBRE/fiche-parc.js`.
- **PUBLIC / LISTE D'ATTENTE** : confirmation `type="validation"` et éventuels affichages `type="information"` de `formulaire-liste-attente.js` migrés vers INFORMATION. Les `type="erreur"` continuent d'utiliser l'ancienne alerte ; redirection après validation conservée. CSS commun ajouté à `formulaire-liste-attente.html`. Commits `72bbe937`, `c6fa5ff4`.
- **Points d'appel restant à classer** : `LCDP_membre/ESPACE-MEMBRE/fiche-parc.js` conserve une information de restriction d'accès avec boutons métier « Abonnement » et autres actions, non migrée ici pour ne pas perdre ces actions. `LCDP_public/ESPACE-PUBLIC/connexion-coach.js` et `connexion-parc.js` utilisent des alertes pour les échecs d'identification, à laisser pour ERREUR. Les composants de facturation et d'avoir affichent des erreurs de chargement dans des zones internes, non des boîtes INFORMATION.
- **État des validations** : modification de code et traçabilité GitHub uniquement ; aucun test navigateur réel ni preuve exhaustive d'absence de CSS ancien inutilisé à ce stade.

## Lot INFORMATION — contrôle ciblé du 12 novembre 2026 (suite)
- **MEMBRE / PLANNING** : `ESPACE-MEMBRE/planning-membre.js` — message du parrain sur une invitation hors abonnement redirigé vers `afficherAlerteInvitationReservation(..., { profil: "information" })` ; message « délai d'annulation dépassé » redirigé vers `afficherInformationPlanning`, en superposition si le workflow est ouvert. Commit `b082644d`.
- **MEMBRE / PLANNING, restrictions d'invitation** : les messages retournés par `determinerBlocageInvitationReservation` et `determinerBlocageReservationPlanning` utilisent le profil INFORMATION commun. Les états métiers (abonnement impayé, annulé, suspendu, membre non abonné) et l'interdiction d'inviter restent évalués comme avant. Commit `8d319d6a`.
- Les alertes de réservation manquante/introuvable et les échecs techniques n'ont pas été migrés vers INFORMATION. Ces changements n'ont pas été testés en navigateur ; ne pas supprimer l'ancienne feuille de style encore utilisée par ces erreurs.

## Décisions utilisateur et exécution — 12 novembre 2026
- **Cas 1, MEMBRE / fiche parc** : le bloc d'information de restriction de planification a été remplacé par le gabarit commun `02-dialogue-reference-information.html`, avec le CSS central `lcdp-lightbox-convergence.css`. Bouton « Fermer » et action conditionnelle « Abonnement » ou « Régulariser » construits avec les classes du gabarit. Les redirections existantes sont **conservées** : « Abonnement » pointe actuellement directement vers `/ESPACE-MEMBRE/abonnement-membre.html` ; « Régulariser » vers `/ESPACE-MEMBRE/paiement-cb.html` avec `orderid`, `echeance` et `source=suspension`. Le raccordement demandé RÉZA-BO → vue planning du parc → ABO-RÉZA **n'est pas démontré par le code actuel**, donc n'a pas été inventé. Commit `da4ba08a`.
- **Cas 5** : maintenir le bouton incitatif « Reprendre le paiement » et le workflow de paiement existant ; aucun changement complémentaire.
- **Cas 2, 3, 4** : contrôles métiers et tests à reprendre dans les travaux ABONNEMENT/INVITER/PLANIFIER ; pas de changement en bloc.
- **Cas 6/7, PUBLIC/COACH/PARC** : vérifier les appels résiduels sans migrer les erreurs vers INFORMATION. Les pages COACH et PARC utilisent déjà le gabarit commun pour les notifications d'information migrées ; l'ancien `02-alerte` reste consommé par les erreurs de dialogues indisponibles, etc.
- **Cas 8, CSS** : contrôle ciblé dans `ESPACE-MEMBRE/fiche-parc.js` : les anciennes classes `lcdp-box-shift-detail-parc__alerte-box`, `__alerte-message`, `lcdp-fiche-parc__dialogue-actions` demeurent utilisées dans d'autres boîtes du même fichier ; leur CSS ne peut pas être supprimé en bloc. Les profils de référence sont décrits par des règles CSS natives dans `lcdp-lightbox-convergence.css` ; ne pas déclarer que ces règles sont des utilitaires Tailwind compilés sans preuve. Le modèle HTML+CSS commun demeure l'unique référence graphique INFORMATION du projet. Aucun CSS graphique par page créé dans ce lot.
- **Cas 9** : tests visuels non bloquants pour l'avancement, mais pas de déclaration de validation mobile/desktop sans tests.

## Décisions et corrections de routage — 12 novembre 2026
- **Destination ABONNEMENT (fiche parc MEMBRE)** : demande explicite de pointer vers `ESPACE-MEMBRE/membre-abonne.html`. Page nouvelle créée avec structure HTML minimale et lien de retour à l'accueil : commit `c11bd8d2`. Sa logique métier est **à construire** ; elle ne prétend pas exécuter RÉZA-BO/ABO-RÉZA. Le lien du bouton conditionnel « Abonnement » dans `ESPACE-MEMBRE/fiche-parc.js` a été modifié, commit `874b1821`. « Régulariser » conserve sa destination existante.
- **Clarification des cas 2 à 5** : 2 (ABONNEMENT) et 4 (PLANIFIER) demandent explication concrète des superpositions et contrôle des parcours ; 3 (INVITER) à revoir pendant le travail prochain sur les invitations ; 5 (paiement) : maintenir l'action « Reprendre le paiement », sans inventer de destination.
- **PUBLIC / COACH / PARC** : le contrôle de l'exhaustivité des boîtes INFORMATION dans COACH et PARC est reporté sur demande, ces espaces devant évoluer.
- **Inventaire CSS individuel** : dans `OBJET/CSSBASE/lcdp-lightbox-convergence.css`, les sélecteurs historiques `.lcdp-box-alerte` et descendants apparaissent encore dans la première partie (lignes ~69 à 238) ; les sélecteurs du profil de référence `.lcdp-dialogue-ref` commencent vers la ligne 255, avec `.lcdp-dialogue-ref--information` vers 315. Aucun des sélecteurs historiques ne doit être supprimé sans vérifier les consommateurs encore actifs du profil ERREUR et des confirmations. La feuille commune est du CSS écrit explicitement, **pas une preuve de compilation Tailwind**.
- **Méthode d'élimination, un par un** : (1) sélecteur CSS et position, (2) fragments/JS/HTML qui le génèrent, (3) profil réellement affiché, (4) remplacement par le gabarit de référence, (5) suppression ciblée si zéro consommateur confirmé. Ne pas confondre déclaration CSS et usage réel. Aucun CSS supprimé pour l'instant.

## Correction concrète — INFORMATION, 12 novembre 2026
- **MEMBRE / ABONNEMENT, cas 2** : correction du helper commun `afficherInformationAbonnement` dans `ESPACE-MEMBRE/abonnement-membre.js`. Les informations superposées disposent maintenant d'un conteneur fixe au-dessus du workflow (`z-index: 12000`) et leur conteneur temporaire est nettoyé si le chargement du fragment INFORMATION échoue ou si la structure HTML attendue est absente. Le contenu du workflow n'est pas remplacé lors des messages de calendrier et de délai de virement. Commit `ccb54529`. Contrôle de code, pas de test navigateur.
- Les cas 3 (invitation) et 5 (reprendre le paiement) conservent leur fonctionnement actuel ; cas 4 PLANIFIER à sécuriser sans toucher aux décisions métier. Les anciennes règles d'alerte du CSS commun servent encore à ERREUR/CHOIX : ne pas les supprimer en bloc.

## Passage de clôture du profil INFORMATION — 12 novembre 2026
- **MEMBRE / ACCUEIL** : « Aucune échéance non payée » est maintenant explicitement `profil: "information"`, avec le titre « Échéances de paiement ». Commit `ff89180a` dans `ESPACE-MEMBRE/accueil-membre.js`.
- **PUBLIC / ACCUEIL** : `ESPACE-PUBLIC/accueil-public.js` affiche désormais « Renseignez votre parrain », « Votre parrain peut vous inviter » et les incitations « Me connecter » avec le fragment INFORMATION. Les redirections « Me connecter » sont conservées ; l'échec métier reste sur l'ancien fragment jusqu'au profil ERREUR. Commit `5ac8167f`.
- **PUBLIC / FICHE PARC** : la notification de réservation réussie dans `ESPACE-PUBLIC/fiche-parc.js` utilise le profil INFORMATION ; les échecs d'enregistrement restent sur l'ancienne alerte. Commit `6ee66bc9`.
- **Contrôles ciblés** : `accueil-public-alertes.js` utilise déjà INFORMATION pour « Me connecter », `connexion-membre.js` et `mdp-perdu-membre.js` réservent leurs branches INFORMATION aux confirmations précédemment migrées, `formulaire-inscription-membre.js` est également migré pour la confirmation réussie. Dans `fiche-parc.js`, les autres appels INFORMATION identifiés (jour, mois suivant, connexion, partage) sont déjà raccordés au même objet. `hello.js` affiche principalement des erreurs de validation ; les erreurs ne doivent pas être converties automatiquement en INFORMATION.
- **Nettoyage CSS** : les règles historiques de `lcdp-lightbox-convergence.css` ciblant `.lcdp-box-alerte` et les autres anciennes familles sont encore nécessaires aux erreurs, confirmations et formulaires non migrés. Il n'a pas été démontré qu'une suppression donnée n'aurait plus de consommateur. Par conséquent aucune règle partagée n'a été supprimée sans preuve. Pas de CSS d'information spécifique ajouté dans ce lot.
- **Périmètre de clôture** : les cas INFORMATION identifiés dans les parcours MEMBRE et PUBLIC examinés ont été migrés ; la présente revue est **une vérification statique ciblée**, pas un audit d'exécution exhaustif sur tous les fichiers ni un test navigateur. COACH/PARC et l'identification de tout consommateur non répertorié sont reportés conformément à la décision utilisateur. Ne pas affirmer que le profil INFORMATION est certifié sans anomalies.
- **Préparation du passage à CHOIX** : conserver les dialogues existants à décisions booléennes, les boutons métiers, les confirmations et les feuilles CSS qu'ils utilisent. Traiter leur migration dans un lot distinct, à partir de ce registre, sans altérer les workflows.

## Reprise du prochain lot
Continuer INFORMATION en prenant les consommateurs restants depuis l'inventaire existant, avec priorité aux points d'appel partagés. Ne pas remplacer mécaniquement un dialogue d'erreur, une action qui retourne `true/false` (par exemple « M'abonner »), ni un choix par un message INFORMATION. Vérifier et retirer les CSS historiques seulement lorsqu'ils ne servent plus. Ne pas annoncer la migration terminée avant suppression et tests des styles historiques.

## Priorité ajustée (demande utilisateur du 12 novembre 2026)
Terminer EXHAUSTIVEMENT les workflows utilisant les anciennes boîtes INFORMATION dans tous les espaces (PUBLIC, MEMBRE, PARC, COACH, ADMIN). Laisser CHOIX, SUPPRESSION et ERREUR en attente. Ne pas supprimer l'ancien fichier CSS tant que des consommateurs d'autres profils l'utilisent. Le profil graphique INFORMATION doit remplacer chaque rendu informatif ancien, tandis que le contexte, les redirections, les comportements et les éventuelles réponses Workers restent inchangés. Vérifier les consommateurs effectifs avant de retirer leurs règles CSS.

## Ordre de travail demandé (12 novembre 2026)
Terminer d'abord ESPACE MEMBRE, ensuite ESPACE PUBLIC, puis ESPACE COACH et ESPACE PARC. ESPACE ADMIN non prioritaire. L'exhaustivité INFORMATION doit être évaluée sur les workflows effectifs ; une ligne de code migrée n'est pas un test de navigateur. Ne pas modifier CHOIX/SUPPRESSION/ERREUR pendant cette phase.

### Vérifications complémentaires du lot
`mes-points.js` et `mes-factures-membre.js` n'appellent actuellement leur ancien objet `02-alerte.html` que pour des erreurs relevées dans le code : hors profil INFORMATION. `rdv-da-membre.js` contient un formulaire `<dialog>` et un message de résultat dans le formulaire : ne pas transformer le formulaire métier en simple boîte INFORMATION. `paiement-membre.js` contient une alerte de vérification/reprise du paiement avec actions métier spécifiques : migration à préparer séparément afin de conserver les possibilités de paiement, les URL et les traitements d'échec. Aucun de ces fichiers n'est à déclarer migré en bloc.

### Principe de clôture et d'élimination (confirmé par l'utilisateur)
Une fois tous les consommateurs INFORMATION migrés, un contrôle ciblé de clôture doit prouver l'absence d'appels et d'affichages INFORMATION historiques sur les parcours concernés, puis permettre la suppression des seuls CSS et fragments sans aucun consommateur. Ensuite, poursuivre les autres profils restant dans le registre existant sans refaire un audit général. Ne pas déclarer zéro consommateur restant sans preuve sur tous les espaces ciblés. Ne pas supprimer une ancienne feuille encore employée par CHOIX, SUPPRESSION ou ERREUR.

## Ouverture de la migration CHOIX — 12 novembre 2026
- **Périmètre INFORMATION :** passage au profil CHOIX autorisé par l'utilisateur, avec réserve explicite concernant les tests navigateur et les consommateurs historiques non entièrement inventoriés. Les CSS de l'ancienne alerte sont conservés puisqu'ils servent encore aux autres familles ; pas de suppression destructive par anticipation.
- **Premier lot MEMBRE / ABONNEMENT** : `ESPACE-MEMBRE/abonnement-membre.js` ajoute le helper `afficherChoixAbonnement`, adossé à `/HTMLBASE/02-dialogue-reference-choix.html` et aux CSS communs existants. Confirmation « Prolonger votre abonnement ? » (slot normal) et « Quitter la demande d'abonnement ? » (superposition, workflow conservé) raccordées au profil CHOIX. Retour booléen `true/false` préservé ; clic fond annule, aucune action Worker/redirect modifiée. Commit `9b1b73c9`.
- **Restent non migrées dans cette famille** : confirmations d'annulation et frais (à classer au regard de SUPPRESSION), confirmation avant paiement, dialogue avec suppression d'invité, et autres validations. Ne pas convertir mécaniquement en CHOIX sans vérifier leurs conséquences.
- **État de validation** : modifications enregistrées dans GitHub ; aucun test navigateur. Continuer les migrations CHOIX depuis les composants actifs, puis nettoyage ciblé des CSS lorsque les anciens consommateurs auront disparu.

### CHOIX — suite du 12 novembre 2026, espace MEMBRE
- **ABONNEMENT**, `ESPACE-MEMBRE/abonnement-membre.js` : `confirmerCommandeAvantPaiement()` bascule vers `afficherChoixAbonnement` avec « Je confirme » et en superposition du récapitulatif ; la confirmation de redirection vers le règlement CB utilise le même gabarit. Les appels de commande/URLs existants ne changent pas. Commit `9cad9dd0`.
- **ACCUEIL**, `ESPACE-MEMBRE/accueil-membre.js` : les appels `afficherAlerte(..., { mode: "confirmation" })` empruntent désormais `/HTMLBASE/02-dialogue-reference-choix.html`, retour `true/false` préservé, clic de fond annulateur sauf `sansCroix`, fermeture du slot. Les messages d'information et branches d'erreur ne sont pas modifiés. Commit `08c80640`.
- **Validation** : code modifié dans GitHub, pas de test navigateur ; poursuivre CHOIX dans les autres consommateurs MEMBRE. Garder les CSS anciens nécessaires aux alertes non migrées.

- **MEMBRE / INVITER**, `ESPACE-MEMBRE/inviter-membre.js` : confirmation avant paiement CB depuis l'invitation basculée vers le profil CHOIX ; nouveau branchement `profil: "choix"` dans le helper existant, boutons « Annuler » et « Continuer vers le paiement », réponse booléenne et redirection inchangées. Commit `0a4d48a1`. Code non testé en navigateur.

### CHOIX — régularisation depuis MES INFORMATIONS et PLANIFIER (12 novembre 2026)
- `LCDP_membre/ESPACE-MEMBRE/mes-informations.js` : confirmation de redirection vers paiement CB migrée vers `/HTMLBASE/02-dialogue-reference-choix.html` ; « Annuler » renvoie `false`, « Continuer vers le paiement » renvoie `true`, destination `PAGE_PAIEMENT_CB` et paramètres `orderid/echeance/source=suspension` préservés. Commit `8e5124d3`.
- `LCDP_membre/ESPACE-MEMBRE/reserver-membre.js` : confirmation de redirection CB migrée vers CHOIX, affichée au sein de `hoteDialoguesPlanifier()` sans remplacer le calendrier permanent ; attribut de dialogue `data-lcdp-dialogue-context="conteneur"`. Destination et paramètres de paiement inchangés. Commit `caef48ab`.
- Les composants d'alerte dédiés aux erreurs et les flux nécessitant des décisions spécifiques restent non migrés. Aucune validation navigateur n'a été réalisée sur ce lot.

### CHOIX — PLANIFIER (suite du 12 novembre 2026)
- `LCDP_membre/ESPACE-MEMBRE/reserver-membre.js` : deux dialogues oui/non basculés sur `afficherChoixPlanifier` et le gabarit commun `02-dialogue-reference-choix.html` : autorisation d'ouverture du microphone pour la recherche IA (Annuler/Confirmer) et déclaration Duo Actif de maquette (Non/Oui). La décision est désormais booléenne `true/false` ; le code appelant a été adapté explicitement. Les actions après confirmation et le stockage temporaire de la maquette restent inchangés. Commit `52e44023`.
- `LCDP_membre/ESPACE-MEMBRE/planning-membre.js` : annulation d'invitation ou de réservation identifiée comme action destructive et laissée pour le futur profil SUPPRESSION, conformément au découpage de migration.
- Aucun test navigateur ; vérifier visuellement les dialogues superposés lors des essais ultérieurs.

### CHOIX — choix simples terminés dans PLANIFIER, décisions à réserver (12 novembre 2026)
- `LCDP_membre/ESPACE-MEMBRE/reserver-membre.js` : migration des deux dialogues binaires « Planning partiellement couvert » (Modifier mon planning / Continuer) et « Ajouter une réservation » (Autre parc / Ce parc) vers `afficherChoixPlanifier()`, gabarit `02-dialogue-reference-choix.html`. Les retours précédemment sous forme de chaînes sont désormais booléens et les appels correspondants sont adaptés. Commit `32d17481`.
- **Fermeture sans décision** : le clic extérieur du choix de parc doit garder l'ancien comportement neutre (ni « Ce parc », ni « Autre parc »). `fermetureFondValeur:null` a été ajouté à ce seul appel, avec adaptation du helper pour utiliser une valeur de fermeture explicitement fournie. Commit `4abc5c22`.
- **Cas complexes à trancher ultérieurement** : (1) `présenterChoixPanier()` affiche un récapitulatif d'offres, avec 2 à 3 décisions selon le calcul (Modifier, recommandation, alternative) ; choisir entre profil CHOIX étendu et écran métier dédié. (2) `ouvrirVotrePlanning()` mêle contenu dynamique et quatre actions (ajouter, abandonner, fermer, continuer), plus un contrôle de fermeture ; conserver comme écran de workflow tant que son architecture cible n'est pas décidée. (3) `aboreza-membre.js` utilise une boîte bouton générique comme support de workflow, à auditer séparément et non migrer automatiquement.
- **Profil SUPPRESSION** : les confirmations d'annulation de réservation/invitation dans `planning-membre.js`, et d'abandon/suppression de dates et d'invités dans PLANIFIER/ABONNEMENT, sont volontairement réservées au prochain lot SUPPRESSION.
- **Périmètre** : vérifications statiques ciblées dans MEMBRE ; le profil CHOIX ne peut pas être déclaré épuisé dans tous les dépôts sans inventaire complet. Les anciens styles restent utilisés par d'autres boîtes ; ne pas les supprimer maintenant. Tests navigateur non effectués.

### CHOIX — continuation des cas simples, 12 novembre 2026
- **MEMBRE / PLANIFIER** : `reserver-membre.js` : « Planning partiellement couvert » (Modifier mon planning / Continuer) et « Ajouter une réservation » (Autre parc / Ce parc) migrés sur le gabarit CHOIX. Le booléen du bouton est traduit dans l'action existante. Commit `32d17481`. Une seconde correction préserve la fermeture par clic extérieur **sans choisir « Autre parc »** (`fermetureFondValeur:null`), commit `4abc5c22`.
- **PUBLIC / FICHE PARC** : `fiche-parc.js` : confirmation d'heure d'arrivée « Annuler / Confirmer » migrée de l'ancienne boîte intégrée vers `02-dialogue-reference-choix.html` superposé ; promesse booléenne et enregistrement de réservation inchangés. La solution de secours `window.confirm` en absence de slot est conservée. Commit `870e909f`.
- **Différés pour décision UX** : `reserver-membre.js` : choix d'abonnement recommandé/alternatif (contenu de tarifs dynamique et parfois 3 actions), vue « Votre planning » (4 actions et rendu dynamique), et `aboreza-membre.js` (dialogue utilisé comme conteneur de workflow). Ce ne sont pas des confirmations simples. Conserver les écrans tant que l'utilisateur n'a pas choisi leur présentation cible.
- **Différés vers SUPPRESSION** : abandon de dates en attente, annulation de réservation/invitation, annulation d'abonnement, suppression d'invités. Conserver les effets métier existants jusqu'à leur migration dédiée.
- **Garantie** : code enregistré ; aucun test navigateur ni audit exhaustif de tous les fichiers de toutes les zones. Ne pas déclarer CHOIX terminé exhaustivement.

### Clarification de méthode — 12 novembre 2026, avant SUPPRESSION
- **L'inventaire initial exhaustif a déjà été réalisé** lors des travaux antérieurs, conformément à la méthodologie de ce registre (« reprendre les audits et inventaires déjà réalisés ; ne pas recommencer un audit général »). Le chantier actuel consiste à exécuter la migration et à mettre à jour sa traçabilité.
- Ne plus présenter un « nouvel audit exhaustif » comme préalable à la clôture d'un profil. Distinguer : **inventaire initial**, **état de migration consigné**, **contrôle ciblé des dépendances et consommateurs**, **tests navigateur non effectués**. Le registre est un suivi des migrations et commits ; il ne reproduit pas nécessairement toutes les lignes de l'inventaire initial.
- **CHOIX** : traiter comme exceptions distinctes les trois cas complexes déjà listés : arbitrage tarifaire multi-options, vue « Votre planning » à quatre actions et conteneur de workflow ABO-RÉZA. Les choix simples identifiés ont été migrés. Poursuivre avec **SUPPRESSION**, puis **ERREUR**, sans perdre les exceptions ni inventer une certification navigateur.

## Rapprochement CHOIX avec l'inventaire initial — statuts (12 novembre 2026)
**Sources :** `OBJET/CSSBASE/INVENTAIRE-DIALOGUES-APPLICATION-20261112.md` (261 fichiers HTML/JS, inventaire des sources, pas de tous les messages), `OBJET/CSSBASE/RAPPROCHEMENT-DIALOGUES-REFERENCES-20261112.md` (candidats par profil) et commits consignés ici. Les lignes suivantes correspondent aux **cas ou familles CHOIX repérables dans ces documents**, complétés par les cas découverts pendant la migration. « Reporté » signifie non migré, et non validé. Aucun test navigateur effectué.

| Cas inventorié / identifié | Source | Statut | Précision |
|---|---|---|---|
| Prolonger un abonnement | MEMBRE `abonnement-membre.js` | **TRAITÉ** | Gabarit CHOIX, `9b1b73c9` |
| Quitter la demande d'abonnement | MEMBRE `abonnement-membre.js` | **TRAITÉ** | Choix superposé, `9b1b73c9` |
| Confirmer commande avant paiement et régularisation | MEMBRE `abonnement-membre.js` | **TRAITÉ** | `9cad9dd0` |
| Confirmer redirection abonnement/paiement | MEMBRE `accueil-membre.js` | **TRAITÉ** | `08c80640` |
| Confirmer régularisation | MEMBRE `inviter-membre.js` | **TRAITÉ** | `0a4d48a1` |
| Confirmer régularisation | MEMBRE `mes-informations.js` | **TRAITÉ** | `8e5124d3` |
| Confirmer régularisation | MEMBRE `reserver-membre.js` | **TRAITÉ** | `caef48ab` |
| Autoriser microphone IA / déclaration Duo Actif | MEMBRE `reserver-membre.js` | **TRAITÉ** | `52e44023` |
| Choisir un parc / planning partiellement couvert | MEMBRE `reserver-membre.js` | **TRAITÉ** | `32d17481`, fermeture neutre `4abc5c22` |
| Confirmation d'heure d'arrivée | PUBLIC `fiche-parc.js` | **TRAITÉ** | `870e909f` |
| Choix de proposition d'abonnement / alternative tarifaire | MEMBRE `reserver-membre.js` | **REPORTÉ, COMPLEXE** | Contenu tarifaire dynamique, 2–3 actions |
| Vue « Votre planning » | MEMBRE `reserver-membre.js` | **REPORTÉ, COMPLEXE** | Quatre actions et contenu dynamique |
| Conteneur du tunnel ABO-RÉZA | MEMBRE `aboreza-membre.js` | **REPORTÉ, COMPLEXE** | Conteneur métier, pas confirmation simple |
| Confirmation « Planifier votre accès ? » avec récapitulatif | MEMBRE `reserver-membre.js` | **REPORTÉ, COMPLEXE** | Récapitulatif structuré déjà distingué par l'audit initial ; étudier avec la vue métier, ne pas détruire son contenu |
| Confirmation/changement de compte par burger | MEMBRE `box-menu-burger-membre.js` | **PARTIEL : déconnexion TRAITÉE, sélection de compte REPORTÉE** | Déconnexion CHOIX `4185b8fa`, CSS `604ee044` ; sélection multi-comptes conserve l'ancien objet |
| Choix du compte / connexion par burger | PUBLIC `box-menu-burger-public.js` | **REPORTÉ, CHOIX** | `02-dialogue-bouton.html` toujours chargé |
| Choix du compte / connexion par burger | PARC et COACH `box-menu-burger-{parc,coach}.js` | **REPORTÉ, CHOIX** | Gabarit historique toujours chargé |
| Confirmation « Votre DA est terminée ? » | MEMBRE `da-membre.js` | **TRAITÉ** | Toutes les confirmations DA migrées, y compris « Quitter ma DA ? » ; `d287e085` |
| Confirmation de publication / sélection d'actualité | ADMIN `B_ADMIN/admin-actualite.js` | **TRAITÉ hors suppression** | Publication/dépublication/pop-up migrées `e80219de` ; suppression d'article reportée à SUPPRESSION |
| Confirmations de planning / sortie / nouvelle base | ADMIN `B_PARCS/planning-parc.js` | **REPORTÉ, CHOIX** | Dialogues natifs et `window.confirm`, conséquences à distinguer |
| Annulation d'abonnement / de réservations / d'invitations / d'invités, abandon des dates et suppressions administratives | MEMBRE et ADMIN (sources dans inventaire initial) | **REPORTÉ, SUPPRESSION** | Ne pas compter comme CHOIX simple : décisions destructrices |
| Autres dialogues à boutons, champs, calendriers, listes et tunnels répertoriés sans classification de chacune de leurs actions | Les cinq dépôts, inventaire section C | **REPORTÉ, À QUALIFIER** | L'inventaire est par **fichier/source**, pas par instance de message : ne pas inventer une correspondance exhaustive |

**Conclusion de rapprochement :** les choix simples **migrés et vérifiables par commit** sont traités. Mais il est **inexact de dire que seuls trois cas complexes subsistent** : l'inventaire initial et la vérification ciblée révèlent également des choix anciens dans les burgers, la DA, l'administration et les confirmations natives. Ces cas portent désormais le statut REPORTÉ. Le profil CHOIX est donc **partiellement migré**, non clôturé exhaustivement. Les cas à supprimer sont réservés au lot SUPPRESSION. Aucune ligne non rapprochée n'est marquée « traité ».

## PENSE-BÊTE PRIORITAIRE — ARBITRAGES À REVOIR AVEC L'UTILISATEUR (13 novembre 2026)
**NE PAS PERDRE AU CHANGEMENT DE FIL.** Le profil CHOIX n'est pas clos tant que les points reportés du tableau de rapprochement ne sont pas traités ou arbitrés. Revenir explicitement vers l'utilisateur avec les questions ci-dessous, une à une, au moment du traitement des cas complexes. Ne pas annoncer « choix terminé » en confondant simple migration et cas encore reportés.

1. `reserver-membre.js` : choix d'abonnement recommandé / alternative, avec tarifs dynamiques et jusqu'à trois actions. **À trancher :** conserver un écran métier autonome ou adapter le gabarit CHOIX à un contenu et à trois actions ?
2. `reserver-membre.js` : « Votre planning » (quatre actions et contenu construit dynamiquement). **À trancher :** conserver ce panneau métier et ne migrer que ses confirmations secondaires, ou créer un composant métier spécifique ?
3. `aboreza-membre.js` : `02-dialogue-bouton.html` sert de conteneur de tunnel. **À trancher :** le conserver comme écran de workflow distinct des quatre profils, ou refactoriser son conteneur après analyse des actions et états ?
4. `reserver-membre.js` : « Planifier votre accès ? » et récapitulatif structuré. **À trancher :** intégrer au point 2 (écran de planification) ou adapter la référence CHOIX en conservant le récapitulatif ?
5. Dans les autres dépôts, toutes les lignes REPORTÉ / À QUALIFIER du tableau précédent doivent être suivies et avoir un statut explicite. Les confirmations simples se migrent sans arbitrage ; les ambiguïtés métier se soumettent à l'utilisateur. Ne pas gonfler la liste des arbitrages pour des choix évidents.
**Ordre utilisateur :** terminer les CHOIX simples, garder les complexes à part et revenir vers l'utilisateur pour les trancher ; **ensuite SUPPRESSION, puis ERREUR**. Conserver les CSS hérités aussi longtemps que leurs consommateurs existent. Tests réels à prévoir, jamais présumés faits.


### CHOIX — poursuite du 13 novembre 2026
- **Pense-bête permanent** : décisions utilisateur à solliciter décrites dans « PENSE-BÊTE PRIORITAIRE — ARBITRAGES À REVOIR AVEC L'UTILISATEUR », commit `eaaa96e8`. Ne pas les perdre lors du prochain fil.
- **MEMBRE / DA** : `da-membre.js`, confirmations DA terminée / quitter DA migrées sur `02-dialogue-reference-choix.html`, retours booléens préservés, `sansCroix` maintenu, secours natif si chargement impossible. Commit `d287e085`.
- **MEMBRE / BURGER** : `box-menu-burger-membre.js`, confirmation de déconnexion migrée vers CHOIX ; Worker de déconnexion non modifié. Commits `4185b8fa`, `604ee044` (CSS explicite). Choix multi-comptes non migré.
- **ADMIN / ACTUALITÉS** : `B_ADMIN/admin-actualite.js`, confirmations publier/dépublier et pop-up migrées vers CHOIX. Le dialogue « Supprimer » conserve son rendu historique jusqu'au lot SUPPRESSION. Commit `e80219de`.
- **Reportés** : menus de sélection multi-comptes dans les quatre espaces, confirmations administratives de planning, écrans métier à plusieurs actions ou données dynamiques (voir tableau et pense-bête). Tests navigateur non réalisés.

### CHOIX — planning parc ADMIN, lot du 13 novembre 2026
- `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js` : confirmation de modification d'une ancienne journée basculée depuis le dialogue natif historique vers `02-dialogue-reference-choix.html`, avec retour booléen, annulation par Escape/clic extérieur, et aucun changement à la sauvegarde du planning. En cas d'échec de chargement, retour `false` pour éviter une modification sans confirmation. Commit `5e62eb13`.
- `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.html` : chargement de la feuille CSS commune `lcdp-lightbox-convergence.css`, commit `cb28ac04`.
- Le dialogue historique reste présent dans le HTML et n'est pas supprimé dans ce lot ; les autres confirmations ADMIN (nouvelle base, opérations, sorties, annulations) restent à traiter selon leur nature. Aucun test navigateur effectué.

### CHOIX — lot ADMIN supplémentaire (13 novembre 2026)
- `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js` : confirmation simple « Enregistrer la nouvelle base » migrée depuis `window.confirm` vers le gabarit `02-dialogue-reference-choix.html`. Le message complet, y compris l'information sur une référence déjà programmée et les mois ouverts, est préservé. Retour booléen et sortie sans écriture en cas de refus / échec ; sauvegarde serveur inchangée. Commit `e5997331`. Le CSS commun avait été raccordé à cette page (`cb28ac04`).
- `LCDP_admin/ESPACE-ADMIN/B_ADMIN/faq-admin.js` : confirmation de **publication des FAQ** migrée vers CHOIX. La confirmation « Supprimer cette FAQ ? » conserve explicitement le dialogue ancien pour le futur lot SUPPRESSION. Commit `34fefd7f`.
- `LCDP_admin/ESPACE-ADMIN/B_ADMIN/cgv-admin.js` : confirmation de **publication des CGV** migrée vers CHOIX. Commit `f0c10770`.
- Le changement concerne les composants et leurs retours de décision, sans modification des appels métier / Worker. Les confirmations administratives de sortie/abandon de brouillon, d'opérations réduisant les accès et de suppression restent **REPORTÉES** au lot SUPPRESSION ou à la qualification des conséquences ; ne pas les migrer mécaniquement.
- **Contrôle** : commits GitHub réalisés. Aucun essai réel sur navigateur, aucune preuve d'absence de consommateur résiduel des anciens styles.

### CHOIX — publications ADMIN, lot complémentaire du 13 novembre 2026
- `LCDP_admin/ESPACE-ADMIN/B_ADMIN/mentions-legales-admin.js` : confirmation « Publier les mentions légales » migrée vers `02-dialogue-reference-choix.html`. Texte, retour booléen, sortie Escape / clic extérieur et flux de publication préservés. Commit `bd9d8226`.
- `LCDP_admin/ESPACE-ADMIN/B_ADMIN/reglement-app-admin.js` : confirmation « Publier les règlement application » (libellé historique conservé) migrée vers CHOIX. Commit `d847509f`.
- `LCDP_admin/ESPACE-ADMIN/B_ADMIN/reglement-club-admin.js` : confirmation « Publier les règlement club » (libellé historique conservé) migrée vers CHOIX. Commit `cef68291`.
- CSS de convergence chargé à la demande sans nouvelle feuille métier. Aucun Worker modifié. Les fonctions historiques restantes ne sont pas supprimées dans ce lot.
- **À suivre** : confirmation de sortie du planning admin à trois conséquences (rester, sauvegarder, ignorer), changements d'accès pouvant annuler des réservations, annulations et suppressions : classification métier / SUPPRESSION. Sélecteurs multi-comptes et workflows complexes : pense-bête d'arbitrage.
- Tests navigateur non réalisés. Ne pas déclarer CHOIX clos sans statut de tous les cas inventoriés.

### CHOIX — lot ADMIN suspension et ajustements (13 novembre 2026)
- `LCDP_admin/ESPACE-ADMIN/C_MEMBRES/suspension-membres.js` : dialogue binaire pour suspendre ou lever la suspension disciplinaire d'un membre raccordé à `02-dialogue-reference-choix.html` et au CSS commun. Non/Oui, retour booléen, Escape, fermeture par clic extérieur, restauration du focus et cycle de décision préservés. Aucun changement à l'appel `/membres/suspensions`. Commit `02aa7aa4`.
- `LCDP_admin/ESPACE-ADMIN/B_PARCS/AjustCoach.js`, `AjustDuo.js`, `AjustFamille.js`, `InsertFamille.js` : fonctions `demanderConfirmation(message)` migrées de `02-dialogue-bouton.html` vers le gabarit CHOIX. Titres `PAGE.confirmTitle`, messages, Annuler/Valider, retour booléen et validation existante conservés. Commits `8e38e0a6`, `ab661ec3`, `52bb5c54`, `0b572c4a` respectivement.
- **Ne pas confondre avec SUPPRESSION :** ces quatre dialogues valident des ajustements métier, dont les effets sont déterminés par le code serveur ; aucune logique d'ajustement ou d'écriture n'a été modifiée ici. Les suppressions explicites restent réservées au lot suivant.
- **État** : migrations statiques enregistrées sur GitHub ; tests navigateur desktop/mobile non effectués. Reprendre les autres consommateurs non encore rapprochés de l'inventaire avant d'annoncer CHOIX achevé. Pense-bête des cas complexes et des décisions utilisateur maintenu.

### CHOIX — calcul des points ADMIN (13 novembre 2026)
- `LCDP_admin/ESPACE-ADMIN/B_ADMIN/CalculPoints.js` : confirmation « Calculer les points » convertie de `02-dialogue-bouton.html` vers `02-dialogue-reference-choix.html` et CSS central. Le message dynamique indiquant la date et le remplacement des valeurs déjà enregistrées est conservé, de même que les boutons Annuler / Calculer et le retour booléen. L'appel au calcul et ses paramètres restent inchangés. Commit `df0504b2`.
- Les cas `B_ADMIN/list-points.js`, `B_ADMIN/PrixAbo.js`, `B_ADMIN/Cle.js` identifiés comme suppressions explicites restent pour SUPPRESSION. Les sélecteurs multi-comptes et workflows dynamiques restent dans le pense-bête de décisions utilisateur.
- Aucun test navigateur de ce lot ; ne pas confondre commit enregistré et validation fonctionnelle.

### CHOIX — contrôle ciblé des consommateurs MEMBRE et PUBLIC (13 novembre 2026)
- **MEMBRE / MES INFORMATIONS** : `ESPACE-MEMBRE/mes-informations.js`, deux confirmations binaires historiques remplacées par le helper CHOIX déjà présent `afficherChoixMesInformations` : (1) « Mettre à jour votre autorisation de géolocalisation ? » / « Cette opération vous déconnectera. » ; (2) « Modifier votre CODR » / demande de transmission à l'administrateur. Libellés Annuler / OK, retour booléen, endpoints de déconnexion et de demande CODR, destinations et gardes en cours inchangés. Commit `8e11983a`. **TRAITÉ**.
- **MEMBRE / FICHE PARC** : `ESPACE-MEMBRE/fiche-parc.js`, confirmation de l'heure d'arrivée migrée vers `02-dialogue-reference-choix.html`, comme la version publique déjà migrée ; CSS commun et fragment chargés avec les utilitaires existants de cette page. Retour booléen et création de réservation inchangés. En absence du slot shift, secours `window.confirm` conservé. Commit `273434dc`. **TRAITÉ**.
- **PUBLIC / ACCUEIL** : `ESPACE-PUBLIC/accueil-public.js` contient une fonction `ouvrirDialogueBoutons(options)` encore basée sur l'ancien objet, mais la recherche dans ce fichier ne trouve aucun appel à cette fonction (déclaration uniquement). **REPORTÉ : vérifier les autres références / ne pas faire de modification cosmétique à un helper non consommé.**
- **MEMBRE / MES INFORMATIONS**, `afficherEcheancesPaiementSuspension` : choix d'une échéance parmi plusieurs boutons Payer, contenu variable ; il s'agit d'un écran métier de paiement, **REPORTÉ COMPLEXE** et non d'une confirmation binaire.
- **MEMBRE / MES INFORMATIONS**, `afficherResultatSecurite` : deux boutons « OK » et « Annuler » aboutissent exactement à la même fermeture ; ce n'est pas un choix booléen, **à requalifier INFORMATION/ERREUR** d'après le message dynamique avant modification.
- **Contrôle qualité** : ces décisions reposent sur lecture des appels et des conditions de retour. Aucun test navigateur réel, aucun changement Worker. Conserver les CSS historiques consommés par les autres types de dialogues.

### CHOIX — réconciliation de l'inventaire initial et nouveau cas ADMIN (13 novembre 2026)
- **Inventaire source effectivement mis à jour** : `OBJET/CSSBASE/INVENTAIRE-DIALOGUES-APPLICATION-20261112.md`, nouvelle section H « Suivi opérationnel CHOIX au 13 novembre 2026 » avec statut `TRAITÉ`, `REPORTÉ — COMPLEXE`, `REPORTÉ — SUPPRESSION` ou `REPORTÉ — À QUALIFIER` par source/cas. L'audit statique original (sections A–G, 261 fichiers recensés) reste inchangé. Commit `5a3f87b4`.
- **ADMIN / SUIVI DA** : `LCDP_admin/ESPACE-ADMIN/C_MEMBRES/SuiviDA.html` : confirmation « Valider le JJ/MM/AAAA ? » migrée du helper générique `afficherAlerte` vers `02-dialogue-reference-choix.html` avec Annuler/Valider. Le formulaire date, ses validations, `enregistrerDecision` et les requêtes existantes ne changent pas ; si le gabarit ne charge pas, le retour `false` empêche toute écriture. Commit `904d5a3a`.
- **Statut inventaire SuiviDA** ajouté au tableau de suivi, commit `d46ef591`.
- **Contrôle ciblé supplémentaire** : dans `reserver-membre.js`, l'ancien `02-dialogue-bouton` sert encore à l'affichage des échéances avec boutons Payer (écran métier), au récapitulatif d'accès (confirmation avec contenu structuré), aux informations à une action, et aux annulations (SUPPRESSION). Dans `abonnement-membre.js`, le même composant est utilisé pour le mode de paiement, les choix de workflow et les échéances ; aucun de ces conteneurs ne peut être converti mécaniquement en simple confirmation binaire. `accueil-public.js` contient une déclaration d'ancien helper sans appel interne retrouvé. Ces cas restent documentés, aucun changement cosmétique forcé.
- **Pense-bête arbitrage utilisateur toujours actif** : menus avec trois comptes, écrans de planning et d'abonnement multi-actions, confirmations à contenu structuré et impacts de sortie/annulation. Les cas SUPPRESSION et ERREUR attendent leur lot dédié.
- **Tests** : vérifications de code et commits, pas de test navigateur. Ne pas annoncer une clôture exhaustive des dialogues CHOIX sur la seule base du scan statique.


### SUPPRESSION — première migration ADMIN (13 novembre 2026)
- `LCDP_admin/ESPACE-ADMIN/B_ADMIN/PrixAbo.js` : remplacement de la confirmation native « Supprimer définitivement cette version de l’abonnement » par `02-dialogue-reference-suppression.html` et le CSS de convergence. Boutons Conserver / Supprimer ; refus, Escape, clic extérieur ou indisponibilité du fragment/CSS renvoient `false` et empêchent la requête. Retour du focus géré ; requête POST `/abonnement` avec `action: "delete"`, validations et rechargement de liste inchangés. Commit `49224c72`.
- Contrôle : relecture de source et commit GitHub ; aucun test navigateur effectué. Les autres suppressions identifiées (Cle, list-points, FAQ, actualités, annulations membre) restent ouvertes et ne sont pas présumées migrées.


### SUPPRESSION — entrée de points ADMIN (13 novembre 2026)
- `LCDP_admin/ESPACE-ADMIN/B_ADMIN/list-points.js` : comparaison avec l'ancien `02-dialogue-bouton.html`, lequel affichait « Supprimer l’entrée » / « Cette suppression est définitive. » avec Annuler et Supprimer ; migration du seul dialogue vers `02-dialogue-reference-suppression.html` (mêmes textes et retours booléens). CSS de convergence chargé à la demande ; refus, Escape, clic extérieur ou échec de chargement => `false`. Code `supprimerPoint` et requêtes Worker inchangés. Commit `b1bb145e`.
- Comparaisons complémentaires : `Cle.js` (ancien dialogue + secours `window.confirm`) non traité ; `faq-admin.js` (suppression de bloc brouillon avec relance du clic) non traité ; `admin-actualite.js` (suppression article public/pop-up) non traité ; `mes-acces-membre.js` (annulations et notifications) non traité ; autres cas à qualifier.
- Aucun test navigateur. Les cas non traités restent inscrits dans l'inventaire.


### SUPPRESSION — clés administratives (13 novembre 2026)
- **Source examinée** : `LCDP_admin/ESPACE-ADMIN/B_ADMIN/Cle.js`, méthode `demanderConfirmationSuppression(libelle)`, sollicitée avant `supprimer()`. Ancien fonctionnement : `02-dialogue-bouton.html`, titre dynamique « Supprimer [libellé] », message « Cette suppression est définitive. », Annuler/Supprimer, secours natif `window.confirm` si slot ou gabarit absent.
- **TRAITÉ (migration statique)** : utilisation de `02-dialogue-reference-suppression.html` avec CSS de convergence, titre dynamique et texte conservés, retour booléen ; refus/Escape/clic extérieur/échec de chargement bloquent toute suppression. Suppression du secours natif dans cette seule méthode. `supprimer()`, méthode DELETE et paramètres `originalDatemaj` non modifiés. Commit `af3a4e67`.
- **Comparaison** : l'ancienne croix implicite devient une fermeture neutre par Escape/clic extérieur ; le chemin de panne se ferme désormais sans confirmation native, donc sans écriture. Pas de test navigateur.


### SUPPRESSION — bloc FAQ ADMIN (13 novembre 2026)
- `LCDP_admin/ESPACE-ADMIN/B_ADMIN/faq-admin.js` : comparaison de l'ancienne confirmation de suppression d'un bloc du brouillon (`02-dialogue-bouton.html`, « Supprimer cette FAQ ? », texte avec le titre de question, Non/Oui) et du gabarit SUPPRESSION. Ancienne confirmation spécifiquement déclenchée lorsque `options.confirmer === 'Oui'`, contrairement à la publication qui conserve CHOIX.
- **TRAITÉ — migration statique** : branche suppression désormais raccordée à `02-dialogue-reference-suppression.html` et CSS de convergence, libellés et retour booléen conservés ; Escape, clic extérieur, refus => `false`. L'écouteur interceptant le clic, le WeakSet autorisant le clic relancé, la publication et l'enregistrement ne sont pas modifiés. Si le fragment échoue, exception traitée par le gestionnaire existant : aucun bloc supprimé. Commit `abf8b51d`.
- Tests navigateur non réalisés ; effets visuels et de focus à vérifier en situation réelle.


### SUPPRESSION — actualités ADMIN (13 novembre 2026)
- **Comparaison** : `LCDP_admin/ESPACE-ADMIN/B_ADMIN/admin-actualite.js` utilisait `02-dialogue-bouton.html` pour « Supprimer l’actualité », message précisant la suppression du brouillon, du site public et de la pop-up éventuelle, fichier image conservé. La publication/dépublication et le réglage pop-up utilisent déjà le profil CHOIX.
- **TRAITÉ — migration statique** : branche `options.confirmer === "Supprimer"` passée à `02-dialogue-reference-suppression.html`, boutons Annuler/Supprimer, même texte, retour booléen. Escape, clic extérieur, annulation, absence du slot ou échec de fragment/CSS => `false`. Ancien fragment retiré de ce gestionnaire ; les autres actions restent sur CHOIX. Le `sauver('supprimer',a.id)` et le Worker restent inchangés. Commit `245b3b42`.
- **Limites** : aucun test navigateur ; suppression effective et conservation de l'image à vérifier sur parcours réel, pas présumées validées.


### SUPPRESSION — annulation d'accès / invitation MEMBRE (13 novembre 2026)
- **Comparaison** : `LCDP_membre/ESPACE-MEMBRE/mes-acces-membre.js`, `demanderAnnulation(r)`. Avant : `window.confirm(question)`, avec deux messages distincts selon `estRecue(r)` (invitation reçue / accès et invitations associées). Après : `02-dialogue-reference-suppression.html`, titre distinguant les deux cas et message métier existant conservé ; boutons Conserver / Oui, annuler.
- **TRAITÉ — migration statique** : retour booléen, Escape, clic extérieur, refus et absence de ressources => pas d'appel d'annulation. Le contrôle `annulationEnCours`, le contrôle de période, le délai d'annulation sur bouton, la requête `POST /annuler-reservation`, le rechargement et les notifications ne changent pas. Commit `845cf9aa`.
- **Non traité** : les autres annulations de réservation/invitation dans `planning-membre.js`, `abonnement-membre.js` et composants connexes. Aucun test navigateur.


### SUPPRESSION — bilan des anciens mécanismes réellement retirés (13 novembre 2026)
- **Audit des diffs de six commits** : `49224c72` (`PrixAbo.js` : `window.confirm`), `b1bb145e` (`list-points.js` : ancien `02-dialogue-bouton.html`), `af3a4e67` (`Cle.js` : dialogue ancien et secours natif), `abf8b51d` (`faq-admin.js` : branche de suppression ancienne), `245b3b42` (`admin-actualite.js` : dialogue ancien et secours natif), `845cf9aa` (`mes-acces-membre.js` : `window.confirm`).
- **Bilan** : six fichiers JavaScript changés ; aucun fichier entier supprimé par ces commits. Les actions métier de suppression/annulation sont conservées ; elles ne sont pas exécutées par les commits. L'ancien gabarit partagé `02-dialogue-bouton.html` n'est pas supprimé, car d'autres consommateurs sont encore documentés.
- **Document de référence** : inventaire `OBJET/CSSBASE/INVENTAIRE-DIALOGUES-APPLICATION-20261112.md`, section J, commit `cc9b5be7`.
- **Toujours ouverts** : annulations des autres écrans MEMBRE, consommateurs anciens à qualifier, validation navigateur et revue d'inutilisation avant tout nettoyage de fichiers partagés. Ne pas assimiler « référence retirée dans une fonction » à « composant désormais inutilisé dans le dépôt ».


### SUPPRESSION — abonnement MEMBRE, première confirmation (13 novembre 2026)
- **Comparaison vérifiée** : `LCDP_membre/ESPACE-MEMBRE/abonnement-membre.js`, `demanderAnnulationAvoir(card)`. Première étape antérieure : `afficherAlerte("Voulez-vous annuler l'abonnement ?")` (alerte `02-alerte.html`, bouton OK = `true`, fermeture = `false`). Elle est remplacée par le gabarit `02-dialogue-reference-suppression.html` (Conserver / Oui, annuler), même décision booléenne. Commit `623e9bd0`. Échap, clic extérieur, absence de CSS/fragment => refus sans appel Worker.
- **NON TRAITÉ — deuxième étape distincte** : `afficherAlerte("Des frais de traitement d’annulation s’appliquent conformément aux Conditions Générales de Vente.")`, dont le `true` conditionne encore la demande d'avoir. La traiter comme validation explicite des frais, sans la confondre avec une simple information.
- **Métier inchangé** : `POST /demander-annulation`, `idabo`, informations d'avoir et rechargement des abonnements, ordre des deux validations. Aucun test navigateur.
- **CSS** : les fragments `02-alerte.html` et leurs CSS ne sont pas retirés : autres usages et seconde validation toujours présents. Aucun retrait CSS autorisé sur le seul constat de la migration.


### SUPPRESSION — annulations depuis PLANNING membre (13 novembre 2026)
- **Avant** : `LCDP_membre/ESPACE-MEMBRE/planning-membre.js`, `traiterAnnulationReservation` demandait « Confirmer l’annulation » avec Non/Oui et deux messages distincts selon invite/réservation, via `ouvrirDialogueBoutons` ou `ouvrirDialogueBoutonsParDessusLightbox` en présence d'un workflow.
- **Après / TRAITÉ (migration statique)** : appel à `confirmerSuppressionPlanning(message, superposition)`, gabarit `02-dialogue-reference-suppression.html`, boutons Non/Oui, décision booléenne. Variante superposée portée à z-index 12000. Refus, Escape, clic extérieur et échec CSS/HTML renvoient `false` ; l'action d'annulation n'est pas lancée. Commit `fb5871a3`.
- **Métier conservé** : recherche de la réservation, limite de délai, contrôle de l'idflux, requête `POST /annuler-reservation`, rechargement et affichage des suites. Les deux helpers historiques ne sont pas supprimés faute de vérification de tous leurs consommateurs.
- **Nettoyage CSS** : aucun CSS supprimé. Ancien `02-dialogue-bouton.html` et CSS historiques encore nécessaires potentiellement ; dépendances à vérifier avant retrait. Aucun test navigateur.


### SUPPRESSION — nettoyage ciblé après migration PLANNING membre (13 novembre 2026)
- **Vérification du code après migration `fb5871a3`** : dans `LCDP_membre/ESPACE-MEMBRE/planning-membre.js`, `ouvrirDialogueBoutons` et `ouvrirDialogueBoutonsParDessusLightbox` n'avaient plus d'appels internes (une déclaration chacune ; le nouveau `confirmerSuppressionPlanning` est bien appelé). Deux fonctions locales anciennes retirées, soit 129 lignes de source. Commit `2e068a28`.
- **Comparaison avant/après** : avant ce nettoyage, les deux helpers contenaient deux références au fragment `02-dialogue-bouton.html` ; après, aucune référence littérale à ce fragment ne demeure dans `planning-membre.js`. Le nouveau dialogue SUPPRESSION et l'appel métier de réservation restent présents.
- **Périmètre / prudence CSS** : aucun gabarit partagé ni CSS supprimé ; l'absence de référence dans ce fichier ne démontre pas l'absence de consommateurs dans les cinq dépôts. Aucun test navigateur.


### SUPPRESSION — opération ponctuelle dans le planning ADMIN (13 novembre 2026)
- **Comparaison source** : `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js`, clic sur `[data-delete]` dans `#operations`. Avant : `confirm('Supprimer cette opération pour '+parc.nom+' ? Les réservations annulées restent annulées.')`. Après : helper `demanderSuppressionOperation(parc.nom)`, fragment `02-dialogue-reference-suppression.html`, boutons Conserver/Supprimer, même avertissement sur les réservations annulées, résultat booléen.
- **TRAITÉ — migration statique**, commit `6092e8c6`. Annulation/Échap/clic extérieur et absence de ressources => refus sans requête. La feuille `lcdp-lightbox-convergence.css` était déjà déclarée dans `planning-parc.html`. L'appel `api('/supprimer-operation',{...contexte(),id})`, son traitement et les notifications restent inchangés.
- **NON TRAITÉ — distinct** : `nouvelleBase` et `annuler-base` conservent des confirmations `confirm` concernant l'abandon du brouillon de base (sans suppression serveur), `appliquerIA` concerne un enregistrement pouvant annuler des réservations. Les dialogues de sortie à plusieurs actions restent hors profil binaire.
- Aucun fichier CSS/gabarit supprimé. Aucune validation navigateur.


### SUPPRESSION — abandon de base non enregistrée, planning ADMIN (13 novembre 2026)
- **Comparaison ciblée** : `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js`, deux `confirm()` natifs : (1) dans `nouvelleBase()` lorsqu'une nouvelle base est déjà modifiée, message « Abandonner la nouvelle base en cours ? » ; (2) bouton `annuler-base`, message « Abandonner la nouvelle base ? ».
- **TRAITÉ — migration statique**, commit `23fab949` : les deux chemins réutilisent le gabarit SUPPRESSION via le helper `demanderSuppressionOperation` paramétré (titre, message et libellé « Abandonner »). La confirmation de suppression d'opération existante conserve ses textes et ses appels. Refus, Escape, clic extérieur ou impossibilité de charger le fragment donnent `false` et n'abandonnent pas la base. `nouvelleBase()` devient asynchrone ; son écouteur attend la promesse, sans modifier les règles de préparation de base.
- **Conséquence métier vérifiée au niveau du code** : abandon d'un brouillon local, aucune suppression serveur dans ces deux chemins ; la méthode `annulerBase()` et l'enregistrement de base ne sont pas modifiés.
- **NON TRAITÉ** : confirmation native d'enregistrement d'opération IA pouvant annuler des réservations, dialogue de sortie à plusieurs issues, autres cas recensés dans les cinq dépôts.
- **Nettoyage** : deux appels natifs `confirm()` en moins dans ce fichier (de trois à un). Aucun CSS ni gabarit historique supprimé. Pas de test navigateur.


### SUPPRESSION — deuxième validation des frais d'annulation, abonnement MEMBRE (13 novembre 2026)
- **Avant** : `LCDP_membre/ESPACE-MEMBRE/abonnement-membre.js`, deuxième condition préalable à `POST /demander-annulation`, `afficherAlerte("Des frais de traitement d’annulation s’appliquent conformément aux Conditions Générales de Vente.")` renvoyant `true` après OK et `false` si fermeture.
- **TRAITÉ — migration statique**, commit `a2cbea71` : même avertissement sur les frais, deuxième appel au gabarit SUPPRESSION avec titre « Confirmer l’annulation avec frais ? », actions « Conserver » et « Poursuivre l’annulation ». Aucun enregistrement sans première ET deuxième validation ; refus/fermeture/ressource indisponible bloquent l'appel. Le helper existant est paramétré sans modifier le contrat booléen.
- **Métier inchangé** : `POST /demander-annulation`, `idabo`, contrôle d'absence d'abonnement, informations sur l'avoir et rechargement ; aucun Worker modifié.
- **CSS et composants** : retrait de ce dernier usage d'`afficherAlerte` pour valider les frais, mais `afficherAlerte` reste appelée ailleurs ; `02-alerte.html` et ses CSS ne sont donc pas supprimés. Tests navigateur non réalisés.


### CHOIX adjacent — dernière confirmation native du planning ADMIN (13 novembre 2026)
- `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js`, `appliquerIA()` : ancienne confirmation native « Enregistrer cette opération ... ? Une réduction d’accès annule les réservations concernées. » n'est **pas une suppression** ; elle autorise un enregistrement pouvant provoquer des annulations.
- **TRAITÉ — classification CHOIX et migration statique**, commit `636b04f8` : réutilisation du helper CHOIX `demanderChoixPlanningAdmin` déjà en place, titre « Enregistrer cette opération ? », message d'avertissement conservé, bouton « Enregistrer ». Le Worker `POST /operation` et les conséquences métier sont inchangés.
- **Résultat ciblé** : plus aucun appel natif `confirm(...)` dans ce fichier après les migrations SUPPRESSION (opération et deux abandons de base) et la migration CHOIX (opération IA). Aucune suppression de CSS ou de fragment partagé, aucun test navigateur.


### Contrôle résiduel de dépendances après frais d'annulation (13 novembre 2026)
- Vérification statique et syntaxique des deux fichiers modifiés : `LCDP_membre/ESPACE-MEMBRE/abonnement-membre.js` et `LCDP_admin/ESPACE-ADMIN/B_PARCS/planning-parc.js` compilent syntaxiquement en JavaScript.
- Dans `abonnement-membre.js`, **trois consommateurs littéraux subsistent** pour `02-dialogue-bouton.html` : `afficherEtapePaiement()` (mode de paiement), `ouvrirDialogueChoix(options)` (choix dans le workflow), et l'affichage « Paiement en attente » (échéances non payées). Ce sont des usages métiers distincts des deux confirmations d'annulation traitées. Ne pas supprimer ce gabarit ni ses CSS pour ce fichier.
- Dans `planning-parc.js`, zéro référence littérale à `02-dialogue-bouton.html` et zéro appel natif `confirm()` ; profil SUPPRESSION et profil CHOIX utilisés. Ces constats locaux ne préjugent pas d'autres consommateurs inter-dépôts.


### SUPPRESSION — titres « À propos » ADMIN (13 novembre 2026)
- **Avant** : `LCDP_admin/ESPACE-ADMIN/B_ADMIN/a-propos-admin.js`, `confirmerSuppression(titre)` utilisait `02-dialogue-bouton.html`, titre « Supprimer ce titre ? », message « Supprimer « ... » ? La suppression sera diffusée après enregistrement. », boutons Non/Oui. Le clic sur Oui retirait uniquement un titre de la liste brouillon en mémoire, marquait le formulaire modifié, puis imposait un enregistrement séparé pour diffuser les changements.
- **TRAITÉ — migration statique**, commit `f867df3f` : remplacement de l'ancien gabarit par `02-dialogue-reference-suppression.html`, chargement de `lcdp-lightbox-convergence.css`, textes et réponses booléennes Non/Oui conservés. Escape, clic extérieur et erreur de chargement ferment ou bloquent le processus sans retirer le titre.
- **Métier conservé** : retrait local via `titres.filter`, marquage `modifier()`, enregistrement séparé via `/admin/a-propos` et verrouillage `busy`/commandes. Pas de changement Worker.
- **Nettoyage** : l'unique référence locale à `02-dialogue-bouton.html` est retirée de ce fichier. Aucun ancien gabarit ou CSS central supprimé, car d'autres consommateurs existent. Aucun test navigateur.


### Convergence / nettoyage des dépendances héritées — quatre éditeurs légaux ADMIN (13 novembre 2026)
- **Contrôle des branches** : `LCDP_admin/ESPACE-ADMIN/B_ADMIN/cgv-admin.js`, `mentions-legales-admin.js`, `reglement-app-admin.js`, `reglement-club-admin.js`. Les quatre `demanderConfirmationPublication()` utilisent déjà `02-dialogue-reference-choix.html` ; après l'appel actif, les chemins se terminent systématiquement par un retour booléen, un retour `false` si slot manquant, ou une exception. Les blocs suivants chargeant `02-dialogue-bouton.html` sont donc inatteignables.
- **RETIRÉ — nettoyage statique** : branche ancienne à boutons supprimée de chaque fichier, sans modifier le gestionnaire CHOIX actif, les appels de publication, les Workers ni les CSS. Commits `9bd3e3d4` (CGV), `8d000213` (mentions légales), `38511e0d` (règlement application), `3e9970ec` (règlement club).
- **Bilan ciblé** : zéro référence littérale à l'ancien fragment `02-dialogue-bouton.html` dans ces quatre fichiers après nettoyage ; la référence CHOIX y subsiste. Ce sont des retraits de code mort de publication, **pas** quatre migrations SUPPRESSION supplémentaires.
- **Limites** : ni CSS partagé ni fichier gabarit supprimé ; d'autres consommateurs du dialogue ancien demeurent ailleurs. Pas de test navigateur.


## Convergence prioritaire MEMBRE / PUBLIC, puis COACH / PARC — 13 novembre 2026

### SUPPRESSION — `LCDP_membre/ESPACE-MEMBRE/reserver-membre.js`
- **Cas 1, abandon du planning en attente** : ancien `ouvrirDialogueBoutonsSuperpose` « Annuler votre planning ? », précisant que seules les dates non enregistrées sont retirées et que les réservations confirmées restent conservées, avec réponses NON/ANNULER. Après : gabarit `02-dialogue-reference-suppression.html` via le helper existant `afficherConfirmationSuppressionPanier(options)`, personnalisation du titre/message/boutons, même décision booléenne. Si aucune date n'est en attente, le chemin d'effacement direct déjà existant est maintenu.
- **Cas 2, annulation d'une réservation/invitation déjà enregistrée** : ancien `ouvrirDialogueBoutonsSuperpose` NON/ANNULER, avec type, parc et date. Après : même gabarit SUPPRESSION paramétré, messages et résultat conservés. `POST /annuler-reservation`, `idflux`, verrouillage du bouton, résultat et actualisation restent inchangés.
- **TRAITÉ — migration statique**, commit `3d6826db`. La fonction SUPPRESSION existante conserve ses valeurs par défaut et son usage pour l'annulation du panier ABO-RÉZA. Complément `85bdb74e` : fermeture neutre par clic sur fond, comme dans l'ancien dialogue. Refus/Échap/clic extérieur ne lancent aucune suppression.
- **NON TRAITÉ** : deux références littérales `02-dialogue-bouton.html` restantes dans `reserver-membre.js` pour l'affichage des échéances de paiement et les dialogues multi-actions/étapes de PLANIFIER. Pas de retrait du gabarit ni de CSS partagé.

### CHOIX — `LCDP_membre/ESPACE-MEMBRE/accueil-membre.js`
- **TRAITÉ — migration statique**, commit `009bedee` : confirmation de déconnexion déplacée de `ouvrirDialogueBoutons` vers `02-dialogue-reference-choix.html`, même titre/texte/boutons Annuler/Confirmer, décision booléenne ; la requête `POST /deconnexion` reste inchangée. L'ancien helper demeure nécessaire à la validation de transfert de navigateur propriétaire (CODA) ; ne pas le retirer. Trois références à `02-dialogue-bouton.html` restent dans cette source (paiement et sécurité).

### PUBLIC — nettoyage et CHOIX
- **RETIRÉ — code orphelin** : `LCDP_public/ESPACE-PUBLIC/accueil-public.js`, helper local `ouvrirDialogueBoutons(options)` : une déclaration et aucun appel dans ce fichier. Retrait de 60 lignes et de sa seule référence à `02-dialogue-bouton.html`. Commit `ac70287d`. Les alertes encore utilisées par l'accueil restent en place ; le profil INFORMATION demeure disponible.
- **TRAITÉ — CHOIX** : `LCDP_public/ESPACE-PUBLIC/fiche-parc.js`, `ouvrirConfirmationShift` : ancien secours natif `window.confirm(texte)` lorsque le slot de détail était absent. Ce test de slot était inutile à l'affichage du gabarit CHOIX déjà monté dans `document.body`. Le secours natif et sa dépendance au slot sont supprimés, le gabarit CHOIX est utilisé dans tous les cas, sans changement de la requête de réservation. Commit `686e2282`.
- `fiche-parc.html` déclarait déjà `lcdp-lightbox-convergence.css`. **NON TRAITÉ** : autres boîtes d'erreur/alerte, choix multi-comptes dans `box-menu-burger-public.js` et usages non binaires, qui restent à qualifier.

### INFORMATION — espace PARC et espace COACH
- **PARC TRAITÉ — migration d'un message informatif** : `LCDP_parc/ESPACE-PARC/accueil-parc.js` ajoute le mode `options.profil === "information"`, avec `02-dialogue-reference-information.html`, sortie par Fermer/Échap/clic extérieur. Commit `d3b0835b`. `accueil-parc.html` charge explicitement le CSS de convergence (commit `ebe2cd1a`). `box-menu-burger-parc.js` passe désormais `{profil:"information"}` pour le message « Mon compte sera créée prochainement » (commit `0baa3731`). La branche d'erreur de déconnexion reste sur l'alerte existante.
- **COACH TRAITÉ — raccordement d'un message informatif** : `LCDP_coach/ESPACE-COACH/box-menu-burger-coach.js` transmet `{profil:"information"}` au gestionnaire INFORMATION déjà présent dans `accueil-coach.js`. Commit `2c24dbf4`. Le CSS de convergence est déjà présent dans `accueil-coach.html` ; autres erreurs et comportement de déconnexion inchangés.
- **NON TRAITÉ — comptes multiples** : les menus burger COACH et PARC conservent `02-dialogue-bouton.html` pour « Changer d’espace connecté », véritable choix entre trois comptes, non assimilable à une confirmation binaire CHOIX.
- **Nettoyage CSS** : aucun ancien CSS supprimé ; `02-alerte.html` et `02-dialogue-bouton.html` restent requis par des consommateurs vérifiés. Une seule nouvelle déclaration CSS, la convergence sur accueil PARC.

**Vérifications** : sept fichiers JavaScript relus après commit et valides syntaxiquement (`reserver-membre.js`, `accueil-membre.js`, `accueil-public.js`, `fiche-parc.js`, `accueil-parc.js`, `box-menu-burger-parc.js`, `box-menu-burger-coach.js`). Aucun parcours testé dans un navigateur, aucun test réseau des Workers et aucune revue exhaustive de l'ensemble des consommateurs CSS.


### Complément INFORMATION COACH — fermeture cohérente avec PARC (13 novembre 2026)
- `LCDP_coach/ESPACE-COACH/accueil-coach.js`, branche déjà migrée INFORMATION : la fermeture ne répondait qu'au bouton Fermer. Mise en cohérence avec PARC : bouton Fermer, Échap et clic sur fond, nettoyage de l'écouteur et résolution unique. Commit `17ebb351`. Aucun message, contrat d'alerte, Worker ni voie d'erreur modifié.
- Contrôle : huit fichiers JS au total sont modifiés dans ce rapprochement prioritaire, dont `accueil-coach.js`. Le profil ERREUR n'est pas traité et les CSS historiques restent conservés.


### Convergence MEMBRE — sécurité du compte, déconnexion burger et suppression d'alerte (13 novembre 2026)
- **INFORMATION — `LCDP_membre/ESPACE-MEMBRE/mes-informations.js`, `afficherResultatSecurite(message)`**. Avant : `02-dialogue-bouton.html` « Sécurité du compte », boutons OK et Annuler ayant exactement le même effet `fermer()` (aucune décision métier). Après : `02-dialogue-reference-information.html`, même titre et même message, bouton unique OK ; Échap et clic extérieur ferment aussi sans effet métier. Le secours `afficherAlerteSuperposee(message)` est conservé. Commit `90ea6640`. **TRAITÉ — migration statique.** Une référence littérale à l'ancien `02-dialogue-bouton.html` subsiste dans `mes-informations.js` pour la liste des échéances non payées, avec actions Payer : **NON TRAITÉ — paiement**.
- **CHOIX — `LCDP_membre/ESPACE-MEMBRE/box-menu-burger-membre.js`, `confirmerDeconnexionBurger()`**. Avant : écouteur Échap déclaré avec `{once:true}`, donc retiré dès la première touche clavier (y compris Tab). Après : écouteur maintenu jusqu'à la fermeture, retiré par `fermer()` ; Échap et navigation Tab/Shift+Tab corrects entre Annuler et Confirmer ; fermeture par fond et effet de déconnexion conservés. Commit `ad23d98a`. **TRAITÉ — cohérence du dialogue CHOIX existant.** Le dialogue `02-dialogue-bouton.html` reste consommé pour le choix entre plusieurs espaces connectés : **CONSERVER**.
- **SUPPRESSION — `LCDP_membre/ESPACE-MEMBRE/mes-informations.js`, `demanderSuppressionAlerte(titre)`**. Profil SUPPRESSION déjà en place ; fermeture initiale par bouton ou Échap seulement, sans restauration du focus. Après : clic sur fond neutre, Échap avec `preventDefault`, retour du focus si possible, boucle Tab entre Conserver et Supprimer, retour booléen inchangé. Commit `2b49ded3`. **TRAITÉ — harmonisation du dialogue existant**, sans changement à l'API d'alertes.
- **CSS** : `mes-informations.html` chargeait déjà `lcdp-lightbox-convergence.css`. Aucun fichier CSS ni gabarit partagé retiré. Contrôle de source et des effets des boutons effectué, tests navigateur non réalisés.


### Convergence CHOIX — navigateur propriétaire / Ma clé sur accueil MEMBRE (13 novembre 2026)
- **Avant** : `LCDP_membre/ESPACE-MEMBRE/accueil-membre.js`, `proposerTransfertNavigateur()`, utilisait `ouvrirDialogueBoutons(options)` sur `02-dialogue-bouton.html`, avec un seul bouton « Utiliser ce navigateur à la place » et fermeture neutre. Le dialogue ne demandait pas directement le CODA : il précédait le formulaire de transfert sécurisé.
- **TRAITÉ — migration statique**, commit `5d346631` : `afficherConfirmationChoixMembre(options)` factorise le profil `02-dialogue-reference-choix.html` déjà utilisé pour la déconnexion ; mêmes titre et avertissement, boutons explicites Annuler / « Utiliser ce navigateur à la place ». Refus, Échap, clic extérieur ou ressource indisponible renvoient `false`.
- **Métier préservé** : le formulaire CODA, le nombre d'essais et son appel `/browser-transfer` sont inchangés ; la déconnexion continue d'utiliser la même confirmation CHOIX paramétrable et l'appel `/deconnexion` n'est pas modifié.
- **Nettoyage** : `ouvrirDialogueBoutons(options)` ne possédait plus aucun autre appel local et est retiré avec son fragment historique (65 lignes de source). Le fichier `accueil-membre.js` passe de trois à deux références littérales à `02-dialogue-bouton.html` ; ces deux consommations restantes concernent des écrans métier de paiement et de saisie CODA, donc **CONSERVER** le gabarit et ses CSS.
- **Limites** : vérification de code et commit, pas de test navigateur ni test du Worker /browser-transfer.


### CHOIX / INFORMATION — suppression des secours de confirmation natifs DA MEMBRE (13 novembre 2026)
- **Avant** : `LCDP_membre/ESPACE-MEMBRE/da-membre.js`, `afficherAlerteDa(message, {mode:"confirmation"})` charge `02-dialogue-reference-choix.html`, puis en cas de panne du CSS/fragment/structure exécute `window.confirm(message)`. Deux autres recours `window.confirm` subsistaient dans les branches génériques de `02-alerte.html`, alors que la branche `mode === "confirmation"` retourne toujours plus haut : ils étaient inatteignables pour ce mode.
- **TRAITÉ — nettoyage cohérence CHOIX**, commit `b16b2b91` : refus `false` en cas d'échec du gabarit CHOIX, aucune confirmation native dans le fichier ; retrait des deux conditions devenues inaccessibles. Les profils CHOIX / INFORMATION et la branche d'alerte générique restent présents, sans modification de leurs messages ou du parcours DA.
- **Sécurité** : si le dialogue ne peut être affiché, le code ne confirme plus l'action en secours natif ; aucun appel métier ne doit être lancé par une confirmation échouée. Le `window.alert` de secours des simples alertes reste utilisé ; il ne s'agit pas d'un nettoyage ERREUR.
- **Vérifications ciblées** : `da-membre.js` passe de trois à zéro occurrence `window.confirm`. Les quatre fichiers JS touchés lors de la passe MEMBRE (`mes-informations.js`, `box-menu-burger-membre.js`, `accueil-membre.js`, `da-membre.js`) passent la vérification syntaxique. Aucun CSS ni gabarit partagé supprimé ; aucun test navigateur.


### CHOIX — sécurité de connexion membre sur la page publique (13 novembre 2026)
- **Source** : `LCDP_public/ESPACE-PUBLIC/connexion-membre.js`, `finaliserSecuriteAvantConnexion(data)`, utilisé lorsque les codes de sécurité du compte ne sont pas définis. Avant : `02-dialogue-bouton.html`, titre « Sécurité du compte », message « Vos codes de sécurité de compte ne sont pas définis. Consultez l'email reçu pour plus d'informations. », actions « Renvoyer l'email » / « Annuler ». La première action seule déclenche `POST` du service `mdptokenz-api` avec `action:"setup-resend"` et `autorisationSecurite`; le parcours se termine par une redirection vers `hello.html`.
- **TRAITÉ — migration statique**, commit `dbefdff7` : `02-dialogue-reference-choix.html`, même titre/message/actions ; retour booléen, Échap/clic extérieur/Annuler => `false` et aucun renvoi d'email ; bouton « Renvoyer l'email » => `true`, requête Worker et redirection inchangées. Le secours d'affichage INFORMATION en cas d'indisponibilité du gabarit est conservé et ne déclenche pas de renvoi.
- **Nettoyage** : l'unique appel de `02-dialogue-bouton.html` est retiré de ce fichier ; `connexion-membre.html` chargeait déjà `lcdp-lightbox-convergence.css`, aucun CSS supplémentaire. Vérification syntaxique passée, sans test navigateur ni test du Worker.
- **À QUALIFIER — PUBLIC** : `hello.js`, `codes-securite.js` conservent `02-alerte.html` avec des contenus de nature variable et parfois des redirections. `connexion-parc.js` / `connexion-coach.js` conservent le dialogue d'erreur `02-alerte.html` et des secours natifs. Ne pas assimiler leurs messages à des INFORMATIONS simples sans comparer les effets de fermeture.


## Convergence PUBLIC — codes de sécurité, hello et connexions coach/parc (13 novembre 2026)

### INFORMATION — `ESPACE-PUBLIC/codes-securite.js`
- **Avant** : `afficherInformation(titre,message,type,redirectUrl)` utilisait `02-alerte.html` pour les messages d'erreur ET le message de réussite des codes. Pour la réussite, le bouton OK déclenchait la fermeture, l'affichage éventuel du masque « Ouverture de la page… » et ensuite la redirection vers `hello.html`. Le type `information` est employé sur la réussite de l'enregistrement des codes.
- **TRAITÉ — migration statique**, commit `6c39ec59` : branche `type === "information"` raccordée à `02-dialogue-reference-information.html` (titre « Information » si vide, message inchangé, bouton « Fermer »), avec chargement à la demande du CSS `lcdp-lightbox-convergence.css`. L'attente de la décision utilisateur et la redirection `redirectUrl` **après** fermeture sont conservées, de même que le masque de navigation. Branches `type === "erreur"` encore sur `02-alerte.html` et fallback natif `alert` : **NON TRAITÉ — ERREUR à qualifier**. Aucun changement au service d'enregistrement des codes.

### ERREUR — `ESPACE-PUBLIC/hello.js`
- **Avant** : les appels à `afficherAlerte(titre,message)` identifiés concernent l'email invalide, le mot de passe absent et les erreurs d'accès public. Ils utilisaient `02-alerte.html` avec titre et message concaténés, fermeture par bouton/croix/fond et secours natif `alert`.
- **TRAITÉ — migration statique**, commit `3412581e` : profil `02-dialogue-reference-erreur.html`, titre et message rendus dans leurs champs dédiés, bouton « Fermer », Échap et clic extérieur, restauration du focus, CSS de convergence chargé à la demande. Le secours `window.alert` reste seulement pour la panne du composant/absence de slot. Aucun traitement de formulaire ni appel Worker modifié.
- **Nettoyage local** : zéro référence résiduelle à `02-alerte.html` dans `hello.js` ; ne pas supprimer le gabarit partagé car d'autres consommateurs persistent.

### ERREUR — `ESPACE-PUBLIC/connexion-parc.js` et `connexion-coach.js`
- **Avant** : un gestionnaire `message(t)` par fichier affichait les erreurs de saisie/connexion/session dans `02-alerte.html`, avec bouton OK, croix et clic extérieur. Les erreurs bloquent/relancent le formulaire et peuvent libérer le bouton de connexion après affichage.
- **TRAITÉ — migration statique**, commits `b7c388e1` (PARC) et `09fc3bc1` (COACH) : profil `02-dialogue-reference-erreur.html`, titre « Connexion impossible », message inchangé, bouton Fermer, Échap/clic extérieur, focus restitué, CSS de convergence chargé à la demande. Maintien du secours natif `window.alert` si la ressource n'est pas disponible.
- **Métier inchangé** : `POST /login`, `GET /session`, contrôle de compte, champs envoyés au Worker, redirections vers les espaces correspondants, état du bouton lors de la connexion. Aucun changement au Worker.

**Contrôles** : les quatre fichiers JS sont syntaxiquement valides à la relecture des sources GitHub. Aucun ancien CSS n'est supprimé. Le CSS de convergence central existe et est chargé à la demande uniquement par ces profils. Aucun essai navigateur/réseau ni validation sur les cinq dépôts complets. Ne pas interpréter la disparition des références locales comme une autorisation de retirer `02-alerte.html` ou `lcdp-central-module-06.css`.


### Convergence complémentaire ERREUR des codes de sécurité PUBLIC (13 novembre 2026)
- **Source** : `ESPACE-PUBLIC/codes-securite.js`, fonction `afficherInformation(titre,message,type,redirectUrl)`. Après la migration INFORMATION `6c39ec59`, la branche `type !== "information"` (les appels métier observés utilisent `"erreur"`) affichait encore `02-alerte.html`.
- **TRAITÉ — ERREUR**, commit `8b7fe8d3` : branche erreur raccordée à `02-dialogue-reference-erreur.html`, titre « Erreur » par défaut et texte d'origine, bouton « Fermer ». Comme avant, le dialogue attend le clic explicite avant de résoudre. Le profil INFORMATION conserve son gabarit. Le chargement du CSS de convergence couvre désormais les deux profils.
- **Harmonisation et sécurité de rendu**, commit `9b1456b0` : simplification du chargement CSS, masquage de navigation affiché sans exception si `.lcdp-setup-loading__text` est absent. Le masque, l'absence de renvoi métier en cas d'erreur, la redirection `redirectUrl` après clic ainsi que les secours `alert` restent préservés.
- **Nettoyage local** : zéro référence littérale à `02-alerte.html` dans `codes-securite.js`. Ce constat ne permet pas de supprimer globalement le gabarit ou ses CSS : d'autres écrans des cinq dépôts en dépendent. Syntaxe JavaScript contrôlée ; pas de test navigateur.


### ERREUR — mot de passe perdu, liste d'attente et inscription membre (13 novembre 2026)

**Mot de passe perdu — `ESPACE-PUBLIC/mdp-perdu-membre.js`**
- Avant : `afficherMessage(titre,message,options)`, branche `options.type === "erreur"` sur `02-alerte.html`, branche validation déjà sur `02-dialogue-reference-information.html`.
- **TRAITÉ — migration statique**, commit `930865a2` : erreurs sur `02-dialogue-reference-erreur.html`, titre et message séparés, bouton Fermer, fermeture par fond conservée ; validation INFORMATION, envoi `POST /mdp-perdu` et redirection éventuelle après fermeture inchangés. CSS de convergence déjà déclaré dans `mdp-perdu-membre.html`. Le fallback natif `alert` reste disponible en cas de problème de chargement.
- Nettoyage local : 0 référence littérale `02-alerte.html` restante dans ce fichier.

**Liste d'attente — `ESPACE-PUBLIC/formulaire-liste-attente.js`**
- Avant : `afficherInformationListeAttente` utilisait `02-alerte.html` pour les erreurs (configuration/protection/validation/envoi), alors que les messages de validation utilisaient déjà INFORMATION. Fermeture par bouton/croix/fond, Échap attaché avec `{once:true}` donc écouteur invalidé par une première touche non Échap.
- **TRAITÉ — migration statique**, commit `91060d5d` : profil ERREUR pour les messages d'erreur ; titre dédié « Erreur » si titre non fourni, texte métier intact, bouton Fermer et clic extérieur. Échap reste disponible tant que le dialogue est ouvert, puis l'écouteur est retiré. Validation INFORMATION, redirection après fermeture, soumission de la liste d'attente, protection Turnstile et renouvellement de son état sont conservés. CSS de convergence déjà déclaré dans `formulaire-liste-attente.html`.
- Nettoyage local : 0 référence `02-alerte.html` restante dans ce fichier.

**Inscription — `ESPACE-PUBLIC/formulaire-inscription-membre.js`**
- Avant : `afficherAlerte(message,redirectUrl,profil)` utilisait `02-alerte.html` pour toutes les erreurs et `02-dialogue-reference-information.html` pour la réussite. En succès, le bouton « Continuer » est obligatoire avant la redirection ; les erreurs restent simplement fermables.
- **TRAITÉ — migration statique**, commit `c82ddc48` : profil `02-dialogue-reference-erreur.html` pour les erreurs, message intact et titre « Erreur » ; confirmation de réussite INFORMATION et bouton « Continuer » conservés. La fermeture obligatoire avant redirection reste en place, les erreurs acceptent Échap et clic extérieur sans effet métier. Aucun changement à la requête d'inscription ni à la protection du formulaire. CSS de convergence déjà déclaré dans `formulaire-inscription-membre.html`.
- Nettoyage local : 0 référence `02-alerte.html` restante dans ce fichier.

**Contrôles transverses** : les sept fichiers publics examinés dans cette passe (`codes-securite.js`, `hello.js`, `connexion-parc.js`, `connexion-coach.js`, `mdp-perdu-membre.js`, `formulaire-liste-attente.js`, `formulaire-inscription-membre.js`) sont syntaxiquement valides et ne contiennent plus de référence littérale `02-alerte.html`. Ce sont des constats **locaux**, non un inventaire global des cinq dépôts. Aucun CSS ni gabarit partagé supprimé ; aucun parcours navigateur testé.


### PUBLIC — accueil / connexion membre : convergence ERREUR (13 novembre 2026)
- **`ESPACE-PUBLIC/accueil-public-alertes.js`** : le contrôleur des trois boutons de l'accueil présentait déjà l'invitation « Me connecter » dans `02-dialogue-reference-information.html`, mais les erreurs du contrôle des droits utilisaient encore `02-alerte.html`. **TRAITÉ — ERREUR**, commit `3bde8972` : erreurs sur `02-dialogue-reference-erreur.html`, titre « Erreur » et message d'origine, bouton Fermer systématiquement visible (l'ancienne branche cachait le bouton OK lorsque l'action de connexion n'était pas disponible), Échap/clic extérieur avec nettoyage par AbortController. Invitation INFORMATION et `window.location.assign(configuration.destination)` conservées ; `LCDP_AccueilDroits.executer` inchangé. Le CSS de convergence est déjà chargé par `accueil-public.html`.
- **`ESPACE-PUBLIC/connexion-membre.js`** : le formulaire affiche des erreurs de saisie, de service et de connexion dans `afficherInformation(titre,message,type="erreur")` ; seule la réussite ou la sécurité du compte relevaient déjà d'INFORMATION. **TRAITÉ — ERREUR**, commit `f1bd0922` : erreurs sur `02-dialogue-reference-erreur.html` avec titre et message dédiés, bouton Fermer, clic extérieur ; les messages INFORMATION, la confirmation CHOIX de renvoi d'email, les requêtes de connexion et l'appel de renvoi restent inchangés. Le CSS de convergence était déjà chargé dans `connexion-membre.html`.
- **Nettoyage local** : plus aucune référence littérale `02-alerte.html` dans ces deux fichiers. Les neuf fichiers publics vérifiés au cours de cette passe (`codes-securite.js`, `hello.js`, `connexion-parc.js`, `connexion-coach.js`, `mdp-perdu-membre.js`, `formulaire-liste-attente.js`, `formulaire-inscription-membre.js`, `accueil-public-alertes.js`, `connexion-membre.js`) sont syntaxiquement valides et ne contiennent plus de référence littérale à `02-alerte.html`.
- **Limites** : ceci ne démontre pas l'inutilisation globale du gabarit ou de ses CSS dans les cinq dépôts ; aucun CSS partagé retiré, aucun essai de navigateur ni Worker.


### PUBLIC — `accueil-public.js` : dernière branche d'alerte propre à l'accueil (13 novembre 2026)
- **Avant** : `afficherAlerte(message,options)` utilisait déjà INFORMATION pour la connexion requise et les messages concernant le parrain ; la branche non INFORMATION (message d'erreur technique des actions d'accueil) utilisait `02-alerte.html`, ses boutons croix/OK et les variantes de couleur `lcdp-alerte-accueil-*`.
- **TRAITÉ — ERREUR**, commit `e0bd12fa` : la branche d'erreur utilise `02-dialogue-reference-erreur.html`, titre « Erreur » ou celui indiqué par les options, texte d'origine, bouton Fermer, Échap/clic extérieur, nettoyage de l'écouteur. La redirection optionnelle associée à un clic positif est conservée dans la fonction, mais la demande effective « Me connecter » emprunte toujours INFORMATION. `appliquerVarianteAlerteAccueil`, ancien helper utilisé uniquement par la branche retirée, est supprimé.
- **Conséquence locale** : zéro référence `02-alerte.html` dans `accueil-public.js`. Le profil INFORMATION et la gestion des droits `LCDP_AccueilDroits.executer` restent en place, aucun Worker modifié. CSS de convergence déjà déclaré dans `accueil-public.html`.
- **Bilan de ce lot PUBLIC** : dix fichiers JavaScript vérifiés syntaxiquement et sans référence littérale à `02-alerte.html` : `codes-securite.js`, `hello.js`, `connexion-parc.js`, `connexion-coach.js`, `mdp-perdu-membre.js`, `formulaire-liste-attente.js`, `formulaire-inscription-membre.js`, `accueil-public-alertes.js`, `connexion-membre.js`, `accueil-public.js`. **Ce n'est pas un inventaire exhaustif du dépôt** ; le gabarit et les CSS historiques sont conservés, tests navigateur non réalisés.
