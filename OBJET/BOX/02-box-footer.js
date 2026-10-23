
Le script Google fourni gère uniquement les alertes : il ne peut pas fermer le formulaire. Le correctif porte sur le JS.

footer-correction-saisie.zip

Remplace les deux fichiers du ZIP, puis recharge avec Ctrl + F5.

La boîte se ferme uniquement par la croix ou Échap.
Le HTML force le chargement du JS corrigé.
Aucun changement des styles ni du script Google.
Tests simulés réussis ; le fonctionnement réel reste à vérifier après remplacement sur ton site.

Pièce jointe utilisateur
Pourquoi la boîte de saisie mail n'apparaît plus, imbécile ?
Le champ se confond avec le fond blanc : j’ai supprimé sa bordure sans conserver de repère visible. C’est une erreur de mon correctif.

Dans le 
JS livré
, il a border:0, background:#fff et aucun texte indicatif. Cela correspond à la zone blanche à gauche d’« Envoyer » sur ta capture.

Il faut rétablir un fond légèrement distinct pour rendre la zone de saisie visible, sans ajouter de contour.


02-box-footer.js
Code
Pièce jointe utilisateur
Pourquoi ce message apparaît, imbécile ?
Ce message vient du Worker Cloudflare, qui le renvoie lorsque son appel de validation à Turnstile échoue : erreur réseau, délai dépassé ou réponse inexploitable.

C’est prévu dans le 
code du Worker
. À cette étape, aucune écriture Google n’est lancée.

La capture seule ne permet pas de connaître la cause exacte. Je ne peux pas le confirmer sans consulter les journaux du Worker au moment de l’envoi.


w-verification.js
Code



(() => {
  "use strict";

  const CHEMIN_MENTIONS_LEGALES =
    "/ESPACE-PUBLIC/mentions-legales.html";

  function construireUrlMentionsLegales() {
    const config = window.SITE_CONFIG || {};

    if (typeof config.publicUrl === "function") {
      return config.publicUrl(CHEMIN_MENTIONS_LEGALES);
    }

    if (typeof window.LCDP_urlPublic === "function") {
      return window.LCDP_urlPublic(CHEMIN_MENTIONS_LEGALES);
    }

    const base = String(
      config.publicBaseUrl ||
      config.PUBLIC_BASE ||
      window.LCDP_PUBLIC_BASE ||
      window.SITE_BASE ||
      ""
    ).replace(/\/+$/, "");

    if (base) {
      return base + CHEMIN_MENTIONS_LEGALES;
    }

    return CHEMIN_MENTIONS_LEGALES;
  }

  function normaliserLienMentionsLegales(racine = document) {
    racine
      .querySelectorAll(
        "[data-lcdp-footer-mentions-legales], " +
        "[data-lcdp-box-footer] a[href*='mentions-legales']"
      )
      .forEach((element) => {
        element.removeAttribute("data-lcdp-footer-mentions-legales");
        element.removeAttribute("onclick");
        element.setAttribute(
          "href",
          construireUrlMentionsLegales()
        );
        element.setAttribute(
          "data-site-href",
          CHEMIN_MENTIONS_LEGALES
        );
      });
  }

  function ouvrirPageMentionsLegales(event) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }

    window.location.assign(construireUrlMentionsLegales());
    return false;
  }

  document.addEventListener(
    "click",
    (event) => {
      const declencheur = event.target.closest(
        "[data-lcdp-footer-mentions-legales]"
      );

      if (!declencheur) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      ouvrirPageMentionsLegales();
    },
    true
  );

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => normaliserLienMentionsLegales(document),
      { once: true }
    );
  } else {
    normaliserLienMentionsLegales(document);
  }

  window.LCDP_ouvrirMentionsLegalesFooter =
    ouvrirPageMentionsLegales;
  window.LCDP_chargerMentionsLegalesFooterDepuisObjet =
    ouvrirPageMentionsLegales;
  window.LCDP_initialiserFooterMentionsLegales = () => {
    normaliserLienMentionsLegales(document);
    return true;
  };
})();

(() => {
  'use strict';
  if (window.LCDP_verificationFooterInstalle) return;
  window.LCDP_verificationFooterInstalle = true;
  let actif = null;
  document.documentElement.setAttribute('data-lcdp-verification-version','20261023-r3');

  function urlObjet(chemin) {
    const config = window.SITE_CONFIG || {};
    if (typeof config.objetUrl === 'function') return config.objetUrl(chemin);
    if (typeof window.LCDP_urlObjet === 'function') return window.LCDP_urlObjet(chemin);
    return String(config.objetBaseUrl || config.OBJET_BASE || window.LCDP_OBJET_BASE || '/OBJET').replace(/\/+$/, '') + chemin;
  }

  function creerCalque() {
    const calque = document.createElement('div');
    calque.setAttribute('popover', 'manual');
    calque.setAttribute('role', 'status');
    calque.setAttribute('aria-label', 'Chargement en cours');
    calque.dataset.lcdpVerificationCalque = '';
    calque.style.cssText = 'position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:rgba(255,255,255,.96);overflow:hidden;';
    const centre = document.createElement('div');
    centre.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';
    const image = document.createElement('img');
    image.alt = '';
    image.width = image.height = 56;
    image.style.cssText = 'display:block;width:56px;height:56px;object-fit:contain;';
    image.src = urlObjet('/BOX/pictowait.gif');
    image.addEventListener('error', () => {
      image.remove();
      const secours = document.createElement('span');