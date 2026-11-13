# Invitations DUO et FAMILLE — contrat backend (13 novembre 2026)

## État vérifié

- Le formulaire actuel MES ACCÈS est géré par `planning-membre.js` et le Worker `inviter-membre-api`.
- La table `invitation` associe aujourd'hui `idflux` et `idmembre` ; `idmembre` est obligatoire. Elle ne suffit pas pour les adresses sans compte.
- La commande d'abonnement `abo.idprixabo` référence `prixabo.idprixabo`. Les droits concernent `maxduo`, `duoplus`, `freqduoplus`, `famille` et d'éventuelles options `aboreza_options` rattachées au panier.
- `aboreza-membre.js` présente `freqduoplus` comme un nombre d'utilisations **par mois** et `duoplus` comme le nombre d'invités simultanés.
- Les tables `inviteabo` (carnet par abonnement) et `inviteacces` (sélection par réservation) ont été créées sur Supabase avec RLS et sans accès client direct.

## Contrat requis pour raccorder le contrôleur déjà préparé

Le Worker `inviter-membre-api` doit fournir un contexte authentifié, obtenu à partir d'un `idflux`. Il doit déterminer le membre propriétaire et la commande couvrant la date de réservation. Il **ne doit jamais faire confiance** à un `idabo`, des quotas ou un `idmembre` passés par le navigateur.

La réponse doit fournir :

```json
{
  "privileges": {"maxduo": 0, "duoplus": 0, "freqduoplus": 0, "famille": 0},
  "duoplusUtilisesMois": 0,
  "contacts": {"duo": [], "famille": []},
  "selection": {"duo": [], "famille": []}
}
```

Les nombres sont des entiers issus de la commande et de ses options, **pas des valeurs par défaut**. `duoplusUtilisesMois` doit exclure l'accès courant si celui-ci a déjà consommé une utilisation, afin de permettre son réaffichage et sa modification sans comptage double. Chaque entrée de `contacts.duo` et `contacts.famille` contient `idinviteabo` et `email`; les tableaux `selection` contiennent les identifiants déjà sélectionnés pour l'accès.

La requête d'enregistrement doit contenir `idflux` et, pour chaque catégorie, `existants` (identifiants du carnet sélectionnés) et `nouveaux` (e-mails nouveaux). Pour permettre une réponse de succès, le Worker doit vérifier dans une transaction les droits et le quota **au moment de l'enregistrement**, pas seulement au chargement du formulaire.

## Vérifications impératives côté Worker

1. Vérifier la session membre, son droit sur `fluxm.idflux`, le statut de l'abonnement et sa période de couverture.
2. Déterminer l'`idprixabo` commandé et les options effectivement achetées. Vérifier la sémantique de `multiplicateur` avant de calculer les majorations ; ne pas la deviner.
3. Valider et normaliser les adresses e-mail, empêcher les doublons et les mélanges de catégories non autorisés.
4. Contrôler `maxduo` sur les invités DUO **différents** cumulés pour l'abonnement ; contrôler `duoplus` sur les DUO simultanément sélectionnés et `freqduoplus` sur le nombre d'utilisations mensuelles, en comptant chaque accès une fois.
5. Contrôler la limite FAMILLE issue de `prixabo.famille` et de ses options. Elle est indépendante du DUO+.
6. Insérer les adresses sans compte dans `inviteabo` avec `idmembreinvite=NULL` ; stocker les sélections et leur statut dans `inviteacces`. L'envoi d'e-mail doit être planifié de façon idempotente et traçable.
7. Ne retourner `confirme: true` que pour une opération effectivement enregistrée et dont le traitement d'envoi est confirmé ou mis en file de manière traçable ; sinon ne jamais envoyer de message de réussite.
8. Ne pas modifier `duoactif`, qui correspond à des demandes distinctes de membres souhaitant être invités.
9. Garder la possibilité de fermer par la croix sans écritures ; laisser `Groupe` grisé et informatif jusqu'à son traitement dédié.

## Fichiers préparés et activation

- `LCDP_public/OBJET/HTMLBASE/04-card-invites-abonnement.html` : présentation séparée DUO/FAMILLE, croix, cases, champs et boutons.
- `LCDP_membre/ESPACE-MEMBRE/invites-abonnement.js` : validation du contexte, sélection locale, plafonds, formulaire, soumission par callbacks.
- `LCDP_public/OBJET/CSSBASE/lcdp-mes-acces-membre.css` : règles ciblées, sans toucher aux champs de l'ancien formulaire.

Le nouveau contrôleur **n'est pas connecté à `planning-membre.js`**. Cette activation est volontairement différée jusqu'à l'adaptation du Worker ; sinon l'interface présenterait des droits erronés ou des invitations non enregistrées.

Le chantier « Mes invités / Mes invitants » dans Mon compte reste exclu de cette passe.

## Audit du Worker fourni par l'utilisateur (w-inviter-membre(6).js)

Code fourni le 13/11/2026, 1 619 lignes, syntaxe JS contrôlée.

- Routes existantes : POST `/inviter-reservation`, GET `/invites`, POST `/invites`, GET `/reservations-invitables` ; les anciennes routes doivent être conservées.
- Limite actuelle : `lireNbinvitAbonnement` prend `abo.nbinvit` et plafonne la valeur à 10. Elle ne lit ni `prixabo.maxduo`, ni `duoplus`, ni `freqduoplus`, ni `famille`.
- L'abonnement actuel est recherché à la date du jour. Pour une réservation future, les droits doivent être obtenus pour la commande couvrant la date de l'accès.
- Les adresses sans compte sont **déjà prises en charge** : `chercherOuCreerMembreInvitation` crée au besoin une fiche `membres` provisoire avec `emailvalid=false` et `emailvalidmode=invitation`. Il faut réutiliser le mécanisme existant plutôt qu'affirmer que l'envoi sans compte est impossible.
- Le message `Aucune modification de la liste des invités.` provient de `handleMajInvites` lorsque ni mise à jour ni ajout n'ont été enregistrés.
- Un envoi Resend est lancé en arrière-plan via `ctx.waitUntil` ; la réponse métier actuelle n'atteste pas la livraison effective de chaque e-mail.

**Liaison des options à vérifier :** un contrôle en lecture seule sur la base du projet ne trouve aucun `aboreza_paniers.numero_commande = abo.orderid` pour les 13 lignes `abo`. La table `aboreza_inclusions` ne contient aucune ligne alors que `aboreza_options` en contient. Ne pas inventer de liaison d'options effectivement commandées à un abonnement sans contrat de référence supplémentaire. Ne pas extrapoler la signification de `multiplicateur` (notamment l'option « +5 DUO+ » avec multiplicateur 5).

Le Worker Cloudflare n'est pas accessible via les connecteurs de déploiement actifs. Le fichier reçu est la source de travail pour une **nouvelle version à générer et fournir**, pas une preuve d'un déploiement sur le site.

La vue préparée `04-card-invites-abonnement.html` et le contrôleur `invites-abonnement.js` ne sont pas reliés à `planning-membre.html` ni à `planning-membre.js`. Il est donc attendu que l'ancienne box Inviter reste visible tant que le raccordement et le nouveau Worker ne sont pas prêts.


## Passerelle des privilèges supplémentaires : schéma existant vérifié

La base possède **déjà** la table `aboreza_inclusions` avec `(idpanier, idabo)` comme clé primaire et deux clés étrangères vers `aboreza_paniers` et `abo`. Il ne faut **pas** créer de doublon fonctionnel de cette table.

Le chemin canonique est :

```
abo.idabo -- aboreza_inclusions.idabo
           aboreza_inclusions.idpanier -- aboreza_paniers.idpanier
                                        -- aboreza_options.idpanier
aboreza_options.idprixabo -- prixabo.idprixabo
abo.idprixabo -- prixabo.idprixabo
```

**Situation vérifiée :** la table `aboreza_inclusions` a **0 ligne**. Les trois lignes d'options enregistrées appartiennent à trois paniers différents : **un panier finalisé** et **deux paniers annulés**. Une seule ligne `aboreza_paniers.numero_commande` est renseignée parmi 31 paniers ; le contrôle `abo.orderid = aboreza_paniers.numero_commande` retourne zéro correspondance.

Le panier finalisé avec option a **un abonnement payé candidat** présentant le même membre, la même formule et les mêmes dates exactes. En revanche, son numéro de commande ne coïncide pas avec `abo.orderid`. Ce rapprochement de dates et de membre ne constitue pas une preuve suffisante pour établir automatiquement la liaison `idabo` ↔ `idpanier` en production. Un point de contrôle dans le Worker de finalisation de la commande est nécessaire pour créer la ligne au moment de la validation du paiement.

La lecture des privilèges supplémentaires doit exiger cumulativement :
- une inclusion existante (`aboreza_inclusions`) vers l'abonnement ciblé ;
- un panier réellement finalisé et `options_confirmees=true` ;
- une identité membre identique entre le panier et l'abonnement ;
- une ligne d'option dont l'`idprixabo` référence effectivement la formule d'option tarifaire ;
- aucune attribution de privilège sur les paniers annulés.

Les privilèges cumulés proviennent de la formule `prixabo` de l'abonnement plus les composantes `prixabo` des options **réellement rattachées à cette commande**. Aucun quota ne doit être calculé uniquement à partir du texte `code_option`.

**Attention au champ `multiplicateur` :** sur l'option « +5 DUO+ » du panier finalisé, `prix_unitaire_ttc=20`, `multiplicateur=5` et `montant_ttc=100`. Le produit `20 × 5 = 100` confirme son rôle dans la tarification de cette ligne ; cela n'autorise pas à déduire que le quota `duoplus` est multiplié par cinq. Il faut vérifier le Worker d'ABO-RÉZA ou de facturation pour établir précisément sa sémantique sur les privilèges.

Pour l'adaptation de `w-inviter-membre.js`, les écritures d'invitations doivent s'effectuer côté serveur avec une vérification atomique des quotas (MAXDUO, DUO+ simultanés et fréquence mensuelle, MAXFAMILL), en distinguant carnet `inviteabo` et accès `inviteacces`. Aucune valeur d'option non rattachée ne doit être appliquée par simple ressemblance de dates.

**Règle de non-régression :** ne pas activer le formulaire V2 ni remplacer les routes existantes tant que la passerelle n'est pas renseignée lors des nouvelles commandes, que les droits supplémentaires ne sont pas calculés de façon déterministe et que l'enregistrement atomique n'est pas vérifié.
