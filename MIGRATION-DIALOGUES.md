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
- Les dialogues d'erreur et les dialogues nécessitant une décision ou des formulaires ne doivent pas être requalifiés automatiquement en INFORMATION.
- Nettoyage déjà réalisé dans `LCDP_public/OBJET/CSSBASE/lcdp-lightbox-convergence.css` : retrait du bloc spécifique ancienne alerte INFORMATION PLANIFIER.
- Migré en code ne signifie pas que l'ancienne famille graphique n'est plus utilisée ailleurs. Les CSS historiques subsistent et le chantier global est inachevé.

## Commits repères
Historique annoncé au début du chantier : `0f1e5fbb`, `abd31e5b`, `62bb71e9`, `ccbab407`.
Migration progressive : `721116fa`, `770faaf9`, `f46e40dc`, `abbb0c6f`, `e26077e6`, `e31738ac`, `7a5b356a`, `ffb0108e`.

## Reprise du prochain lot
Continuer INFORMATION en prenant les consommateurs restants depuis l'inventaire existant, avec priorité aux points d'appel partagés. Ne pas remplacer mécaniquement un dialogue d'erreur, une action qui retourne `true/false` (par exemple « M'abonner »), ni un choix par un message INFORMATION. Vérifier et retirer les CSS historiques seulement lorsqu'ils ne servent plus. Ne pas annoncer la migration terminée avant suppression et tests des styles historiques.

## Priorité ajustée (demande utilisateur du 12 novembre 2026)
Terminer EXHAUSTIVEMENT les workflows utilisant les anciennes boîtes INFORMATION dans tous les espaces (PUBLIC, MEMBRE, PARC, COACH, ADMIN). Laisser CHOIX, SUPPRESSION et ERREUR en attente. Ne pas supprimer l'ancien fichier CSS tant que des consommateurs d'autres profils l'utilisent. Le profil graphique INFORMATION doit remplacer chaque rendu informatif ancien, tandis que le contexte, les redirections, les comportements et les éventuelles réponses Workers restent inchangés. Vérifier les consommateurs effectifs avant de retirer leurs règles CSS.
