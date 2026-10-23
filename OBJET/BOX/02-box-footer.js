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
      secours.style.cssText = 'display:block;width:40px;height:40px;border:4px solid #dce3d7;border-top-color:#57754c;border-radius:50%;';
      centre.append(secours);
      secours.animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}], {duration:800,iterations:Infinity});
    }, {once:true});
    centre.append(image);
    calque.append(centre);
    document.body.append(calque);
    calque.showPopover();
    return calque;
  }

  const attentes = new Set();
  let calqueCommun = null;
  window.LCDP_chargement = {
    afficher() {
      const jeton = {};
      attentes.add(jeton);
      if (!calqueCommun) calqueCommun = creerCalque();
      return jeton;
    },
    masquer(jeton) {
      if (!attentes.delete(jeton)) return;
      if (!attentes.size && calqueCommun) {
        calqueCommun.hidePopover();
        calqueCommun.remove();
        calqueCommun = null;
      }
    }
  };

  function terminer(etat) {
    if (etat.calque) {
      window.LCDP_chargement.masquer(etat.calque);
      etat.calque = null;
    }
    clearTimeout(etat.delai);
    if (actif === etat) actif = null;
  }

  function afficherConfirmation(message, retour) {
    const box = document.createElement('div');
    box.className = 'lcdp-contact-info';
    box.setAttribute('popover', 'manual');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', message || 'Adresse enregistrée');
    box.style.cssText = 'height:auto!important;min-height:0!important;width:min(360px,calc(100% - 36px));padding:32px!important;text-align:center;overflow:hidden;';
    if (message) {
      const texte = document.createElement('p');
      texte.textContent = message;
      texte.style.cssText = 'margin:0 0 20px;';
      box.append(texte);
    }
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'lcdp-button lcdp-button-primary';
    ok.textContent = 'OK';
    ok.style.cssText = 'display:block;margin:0 auto;min-width:100px;';
    ok.addEventListener('click', () => {
      box.hidePopover();
      box.remove();
      retour.focus();
    });
    box.append(ok);
    document.body.append(box);
    box.showPopover();
    ok.focus();
  }

  document.addEventListener('click', event => {
    const bouton = event.target.closest('[popovertarget="lcdp-footer-verification-info"]');
    if (!bouton || bouton.getAttribute('popovertargetaction') === 'hide') return;
    const boite = bouton.closest('[data-lcdp-box-footer]')?.querySelector('#lcdp-footer-verification-info');
    const slot = boite?.querySelector('[data-verification-slot]');
    if (!slot) return;
    event.preventDefault();
    if (actif) return;
    if (slot.dataset.pret === 'oui') { boite.showPopover(); return; }

    const etat = {boite, bouton, calque:window.LCDP_chargement.afficher(), delai:null};
    actif = etat;
    const formulaire = document.createElement('iframe');
    formulaire.title = 'Saisir votre adresse email';
    formulaire.setAttribute('scrolling', 'no');
    formulaire.referrerPolicy = 'no-referrer';
    formulaire.style.cssText = 'display:block;width:100%;height:112px;min-height:0;border:0;margin:0;overflow:hidden;';
    formulaire.addEventListener('load', () => {
      if (!formulaire.isConnected) return;
      slot.dataset.pret = 'oui';
      if (actif !== etat) return;
      terminer(etat);
      boite.showPopover();
    }, {once:true});
    if (typeof slot.lcdpNettoyerMessages === 'function') slot.lcdpNettoyerMessages();
    const canal = window.crypto.randomUUID();
    const urlFormulaire = new URL(slot.dataset.verificationUrl);
    urlFormulaire.searchParams.set('lcdpCanal', canal);
    urlFormulaire.searchParams.set('lcdpOrigine', window.location.origin);
    let envoiEnCours = false;
    const recevoir = event => {
      const data = event.data;
      if (!data || data.type !== 'lcdp-verification' || data.canal !== canal) return;
      if (!/^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)?script\.googleusercontent\.com|[a-z0-9-]+-script\.googleusercontent\.com)$/.test(event.origin)) return;
      if (!formulaire.isConnected) return;
      if (data.etat === 'envoi') {
        if (envoiEnCours || actif) return;
        envoiEnCours = true;
        boite.hidePopover();
        etat.phase = 'envoi';
        etat.calque = window.LCDP_chargement.afficher();
        actif = etat;
        etat.delai = setTimeout(() => {
          if (!envoiEnCours) return;
          envoiEnCours = false;
          terminer(etat);
          afficherConfirmation('La confirmation tarde. Vérifiez le tableau avant de réessayer.', bouton);
        }, 30000);
      } else if (data.etat === 'succes' && envoiEnCours) {
        envoiEnCours = false;
        terminer(etat);
        afficherConfirmation('', bouton);
      } else if (data.etat === 'erreur' && envoiEnCours) {
        envoiEnCours = false;
        terminer(etat);
        boite.showPopover();
      }
    };
    window.addEventListener('message', recevoir);
    slot.lcdpNettoyerMessages = () => window.removeEventListener('message', recevoir);
    formulaire.src = urlFormulaire.href;
    slot.replaceChildren(formulaire);
    // Une erreur reseau ne doit pas laisser le visiteur bloque derriere le calque.
    etat.delai = setTimeout(() => {
      if (actif !== etat) return;
      terminer(etat);
      slot.replaceChildren();
      const message = document.createElement('p');
      message.textContent = 'Le formulaire ne répond pas. Fermez puis réessayez.';
      message.style.cssText = 'margin:12px 0;text-align:center;';
      slot.append(message);
      boite.showPopover();
    }, 25000);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !actif) return;
    if (actif.phase === 'envoi') { event.preventDefault(); return; }
    const etat = actif;
    terminer(etat);
    etat.bouton.focus();
  });
})();
