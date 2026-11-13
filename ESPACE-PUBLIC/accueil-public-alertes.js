/* Accueil public : contrôle d'accès et dialogues de référence INFORMATION / ERREUR. */
(() => {
  'use strict';

  const actions = [
    { selecteur: '.public-home__action--plan', action: 'planifier', libelle: 'PLANIFIER', variante: 'reserver' },
    { selecteur: '.public-home__action--access', action: 'mes_acces', libelle: 'MES ACCÈS', variante: 'planning' },
    { selecteur: '.public-home__action--key', action: 'ma_cle', libelle: 'MA CLÉ', variante: 'ouvrir' }
  ];

  function urlPublique(chemin) {
    const configuration = window.SITE_CONFIG || {};
    const base = String(configuration.publicBaseUrl || configuration.PUBLIC_BASE || configuration.siteBase || '').replace(/\/+$/, '');
    return base + chemin;
  }

  function urlObjet(chemin) {
    const configuration = window.SITE_CONFIG || {};
    if (typeof configuration.objetUrl === 'function') return configuration.objetUrl(chemin);
    const base = String(configuration.objetBaseUrl || configuration.OBJET_BASE || '').replace(/\/+$/, '');
    return base ? base + chemin : urlPublique('/OBJET' + chemin);
  }

  function emplacementAlerte() {
    let slot = document.getElementById('lcdp-lightbox-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'lcdp-lightbox-slot';
      document.body.appendChild(slot);
    }
    return slot;
  }

  let chargementAlerteEnCours = false;
  async function afficherAlerte(message, configuration = {}) {
    if (chargementAlerteEnCours) return;
    chargementAlerteEnCours = true;
    try {
      // Les invitations à se connecter relèvent d'INFORMATION ; les échecs relèvent d'ERREUR.
      const information = Boolean(configuration.actionLibelle && configuration.destination);
      const chemin = information
        ? '/HTMLBASE/02-dialogue-reference-information.html'
        : '/HTMLBASE/02-dialogue-reference-erreur.html';
      const reponse = await fetch(urlObjet(chemin), { cache: 'no-cache' });
      if (!reponse.ok) throw new Error('Objet de dialogue indisponible.');
      const modele = document.createElement('template');
      modele.innerHTML = (await reponse.text()).trim();

      const slot = emplacementAlerte();
      slot.replaceChildren(modele.content.cloneNode(true));
      const boite = slot.querySelector(information
        ? '[data-lcdp-dialogue-reference="information"]'
        : '[data-lcdp-dialogue-reference="erreur"]');
      const texte = slot.querySelector('[data-lcdp-dialogue-message]');
      const validerBouton = slot.querySelector(information
        ? '[data-lcdp-dialogue-action="compris"]'
        : '[data-lcdp-dialogue-action="fermer"]');
      const titre = slot.querySelector('[data-lcdp-dialogue-titre]');
      if (!boite || !texte || !validerBouton || !titre) {
        slot.replaceChildren();
        throw new Error('Objet de dialogue incomplet.');
      }

      texte.textContent = String(message);
      titre.textContent = information ? 'Connexion nécessaire' : 'Erreur';
      validerBouton.textContent = information ? configuration.actionLibelle : 'Fermer';

      const precedentFocus = document.activeElement;
      const ecouteurs = new AbortController();
      function fermer() {
        ecouteurs.abort();
        slot.replaceChildren();
        if (precedentFocus && typeof precedentFocus.focus === 'function') precedentFocus.focus();
      }
      boite.addEventListener('click', e => { if (e.target === boite) fermer(); }, { signal: ecouteurs.signal });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') fermer();
        if (e.key === 'Tab') {
          const elements = [validerBouton];
          if (!elements.length) return;
          const index = elements.indexOf(document.activeElement);
          if (e.shiftKey && index <= 0) { e.preventDefault(); elements[elements.length - 1].focus(); }
          else if (!e.shiftKey && index === elements.length - 1) { e.preventDefault(); elements[0].focus(); }
        }
      }, { signal: ecouteurs.signal });
      validerBouton.addEventListener('click', () => {
        fermer();
        if (configuration.destination) window.location.assign(configuration.destination);
      }, { signal: ecouteurs.signal });
      validerBouton.focus();
    } finally {
      chargementAlerteEnCours = false;
    }
  }

  let demandeEnCours = false;
  async function traiterAction(configuration) {
    if (demandeEnCours) return;
    demandeEnCours = true;
    try {
      if (!window.LCDP_AccueilDroits || typeof window.LCDP_AccueilDroits.executer !== 'function') {
        throw new Error('Le contrôle des droits est momentanément indisponible.');
      }
      const resultat = await window.LCDP_AccueilDroits.executer(configuration.action);
      if (resultat === 'non_connecte') {
        await afficherAlerte(
          'Vous devez être connecté(e) à votre compte membre pour utiliser la fonction ' + configuration.libelle + '.',
          {
            variante: configuration.variante,
            actionLibelle: 'Me connecter',
            destination: urlPublique('/ESPACE-PUBLIC/connexion-membre.html')
          }
        );
      }
      // Tous les autres cas (droits, abonnement, accès planifié, etc.)
      // sont pris en charge par controle-acces-accueil.js.
    } catch (erreur) {
      console.error('Accueil public :', erreur);
      try {
        await afficherAlerte(erreur?.message || 'Erreur technique. Merci de réessayer.', { variante: configuration.variante });
      } catch (erreurAlerte) {
        console.error('Accueil public, affichage alerte :', erreurAlerte);
      }
    } finally {
      demandeEnCours = false;
    }
  }

  function initialiser() {
    const racine = document.querySelector('.public-home__actions');
    if (!racine || racine.dataset.lcdpAlertesInitialisees === 'true') return;
    racine.dataset.lcdpAlertesInitialisees = 'true';
    actions.forEach(configuration => {
      const bouton = racine.querySelector(configuration.selecteur);
      if (bouton) bouton.addEventListener('click', () => traiterAction(configuration));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiser, { once: true });
  else initialiser();
})();
