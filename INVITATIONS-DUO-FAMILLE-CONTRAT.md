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
- Aucun nouveau CSS spécifique au formulaire : réutilisation des composants CSS/Tailwind communs c040, c054 et c065.

Le contrôleur est raccordé à `planning-membre.js` et à `inviter-membre.js`. Chaque page tente la route `GET /invites-abonnement/contexte` ; si le Worker actuel répond 404, l'ancien formulaire demeure opérationnel. Le nouveau formulaire n'apparaîtra qu'après déploiement du Worker compatible.

Le chantier « Mes invités / Mes invitants » dans Mon compte reste exclu de cette passe.

## Audit du Worker fourni par l'utilisateur (w-inviter-membre(6).js)

Code fourni le 13/11/2026, 1 619 lignes, syntaxe JS contrôlée.

- Routes historiques en production d'origine : POST `/inviter-reservation`, GET `/invites`, POST `/invites`, GET `/reservations-invitables`. Le Worker préparé conserve les lectures et liens signés, mais refuse les deux anciens POST non catégorisés (HTTP 409) pour empêcher un contournement des nouveaux quotas ; les deux formulaires membres actifs ont été raccordés à la nouvelle route.
- Limite actuelle : `lireNbinvitAbonnement` prend `abo.nbinvit` et plafonne la valeur à 10. Elle ne lit ni `prixabo.maxduo`, ni `duoplus`, ni `freqduoplus`, ni `famille`.
- L'abonnement actuel est recherché à la date du jour. Pour une réservation future, les droits doivent être obtenus pour la commande couvrant la date de l'accès.
- Les adresses sans compte sont **déjà prises en charge** : `chercherOuCreerMembreInvitation` crée au besoin une fiche `membres` provisoire avec `emailvalid=false` et `emailvalidmode=invitation`. Il faut réutiliser le mécanisme existant plutôt qu'affirmer que l'envoi sans compte est impossible.
- Le message `Aucune modification de la liste des invités.` provient de `handleMajInvites` lorsque ni mise à jour ni ajout n'ont été enregistrés.
- Un envoi Resend est lancé en arrière-plan via `ctx.waitUntil` ; la réponse métier actuelle n'atteste pas la livraison effective de chaque e-mail.

**Liaison des options clarifiée le 13/11/2026 après réception des trois Workers de paiement :** une commande payée est rattachée explicitement à son abonnement par `paiement_commandes.idabo`. La clé `paiement_commandes.idpanier` permet de rejoindre `aboreza_options`. L'ancienne comparaison `abo.orderid = aboreza_paniers.numero_commande` était incorrecte : ce sont deux références distinctes. Le rôle d'`aboreza_inclusions` est l'intégration d'abonnements antérieurs dans un nouveau panier, et **non** le rattachement des options achetées. Les privilèges supplémentaires sont à lire exclusivement sur les commandes payées et paniers finalisés. La fonction `paiement_confirmer_commande` écrit l'`idabo` de la commande dans la même transaction que la finalisation.

Le Worker préparé est livré sous le nom `w-inviter-membre.js`. Son code est vérifié localement, mais n'a pas été déployé sur Cloudflare.

Les pages `planning-membre.html`/`planning-membre.js` et `inviter-membre.html`/`inviter-membre.js` chargent le nouveau formulaire uniquement lorsque le Worker expose la route de contexte ; l'ancien formulaire demeure en repli sur HTTP 404.


## Passerelle des privilèges : correspondance canonique vérifiée dans Supabase

Les trois Workers source fournis sont `w-factupaiement(6).js`, `w-paiement(20261113-164759).js` et `w-rezabo(7).js`. Ils ont été comparés aux fonctions SQL réelles `paiement_confirmer_commande` et `paiement_creer_abo_commande`, sans modifier leur code ni déployer de Worker.

**Chemin exact :**

```text
abo.idabo <- paiement_commandes.idabo
              paiement_commandes.idpanier -> aboreza_paniers.idpanier
                                          -> aboreza_options.idpanier
aboreza_options.idprixabo -> prixabo.idprixabo (privilèges optionnels)
abo.idprixabo              -> prixabo.idprixabo (privilèges de base)
```

Au 13/11/2026, les deux commandes `paiement_commandes.statut='paye'` ont un `idabo` non nul et une relation valide avec `abo`, en accord avec `abo.orderid = paiement_commandes.orderid`. L'une de ces commandes contient l'option `+5 DUO+` sur un panier `finalise`, avec `options_confirmees=true`. Les deux autres lignes d'options appartiennent à des paniers `annule` et doivent être exclues.

**Conditions obligatoires de lecture** : `paiement_commandes.statut='paye'` ; `paiement_commandes.idabo = abo.idabo` ; `aboreza_paniers.idpanier = paiement_commandes.idpanier` et `aboreza_paniers.statut='finalise'` ; `aboreza_paniers.options_confirmees=true` pour les lignes d'options ; `aboreza_paniers.idmembre = abo.idmembre = paiement_commandes.idmembre` ; `aboreza_options.idprixabo = prixabo.idprixabo`. Ne jamais calculer des privilèges depuis une option annulée, un panier non payé ou un simple libellé.

**Multiplicateur confirmé dans le Worker `w-paiement` :** `prix_unitaire_ttc × multiplicateur = montant_ttc`. Le Worker vérifie `multiplicateur=1` pour `+5 DUOMAX` et la durée du panier (en mois) pour les autres options, avec `1` pour `1J`. Ainsi, `multiplicateur=5` sur une option `+5 DUO+` d'un abonnement `5M` concerne **la facturation** et ne signifie pas cinq fois le privilège `duoplus`. Les valeurs de droits sont les colonnes `maxduo`, `duoplus`, `freqduoplus` et `famille` de la ligne `prixabo` référencée par chaque option.

**Aucun changement nécessaire aux Workers de paiement pour créer la clé** : `paiement_creer_abo_commande` retrouve/crée l'abonnement et renseigne `paiement_commandes.idabo` ; `paiement_confirmer_commande` confirme paiement, abonnement et accès atomiquement. L'usage des droits doit être implémenté **dans le Worker d'invitation**, sans réinterpréter `aboreza_inclusions` ni toucher aux paiements.

**État de préparation :** calcul des privilèges, contrôles temporels, quotas simultanés/cumulés et transaction `inviteabo`/`inviteacces`/`invitation`/`fluxm` mis en place dans Supabase. Les routes nouvelles du Worker sont préparées et les deux pages membres raccordées. Tests unitaires Node et tests SQL avec annulation transactionnelle réalisés. **Restent non confirmés sans déploiement Cloudflare** : le rendu mobile réel, l'appel réseau authentifié, la réception Resend et le comportement après activation sur les comptes en production.


## Parcours d'annulation et protection contre les contournements

- La fonction `lcdp_annuler_invitation_par_jeton` sécurise l'annulation par lien signé : elle annule dans une seule transaction la ligne `invitation`, la réservation invitée `fluxm` et la sélection `inviteacces` lorsqu'elle existe, tout en gardant le délai de la veille à 14 h.
- Les anciens POST `/inviter-reservation` et `/invites` ne transmettent pas la catégorie DUO/FAMILLE. Sur le Worker **à déployer**, ils sont refusés avec un message explicite (409) au lieu de permettre le contournement des quotas. Les autres lectures et consultations signées restent disponibles.
- Test positif : le Worker utilise la même routine existante d'envoi Resend et de génération des liens signés, y compris pour un compte provisoire ; son fonctionnement réel avec la clé Resend de production devra être validé après déploiement.
- Tests réalisés : fonction SQL de création appelée dans un `BEGIN ... ROLLBACK`, présence de toutes les écritures vérifiée dans la transaction ; refus du dépassement MAXDUO et DUO+ ; annulation d'invitation avec synchronisation vérifiée dans une transaction annulée. Après ces tests, carnet/invitations/compte fictif : 0 ligne créée durablement.
- Les trois Workers de paiement et le Worker de réservation `w-rezabo` restent inchangés.
