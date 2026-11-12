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
