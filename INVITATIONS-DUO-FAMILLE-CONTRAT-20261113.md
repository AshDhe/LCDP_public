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
- `LCDP_membre/ESPACE-MEMBRE/invites-abonnement-v2.js` : validation du contexte, sélection locale, plafonds, formulaire, soumission par callbacks.
- `LCDP_public/OBJET/CSSBASE/lcdp-mes-acces-membre.css` : règles ciblées, sans toucher aux champs de l'ancien formulaire.

Le nouveau contrôleur **n'est pas connecté à `planning-membre.js`**. Cette activation est volontairement différée jusqu'à l'adaptation du Worker ; sinon l'interface présenterait des droits erronés ou des invitations non enregistrées.

Le chantier « Mes invités / Mes invitants » dans Mon compte reste exclu de cette passe.
