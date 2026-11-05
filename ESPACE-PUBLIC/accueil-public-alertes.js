/* Accueil public : connexion des trois boutons au contrôle d'accès partagé
   et à l'objet central 02-box-alerte.html (styles c033 du CSS central). */
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
      const reponse = await fetch(urlObjet('/HTMLBASE/02-alerte.html'), { cache: 'no-cache' });
      if (!reponse.ok) throw new Error('Objet 02-box-alerte.html indisponible.');
      const modele = document.createElement('template');
      modele.innerHTML = (await reponse.text()).trim();

      const slot = emplacementAlerte();
      slot.replaceChildren(modele.content.cloneNode(true));
      const boite = slot.querySelector('[data-lcdp-box-alerte]');
      const texte = slot.querySelector('[data-lcdp-alerte-message]');
      const fermerBouton = slot.querySelector('[data-lcdp-alerte-close]');
      const validerBouton = slot.querySelector('[data-lcdp-alerte-ok]');
      if (!boite || !texte || !fermerBouton || !validerBouton) {
        slot.replaceChildren();
        throw new Error('Objet 02-box-alerte.html incomplet.');
      }

      texte.textContent = String(message);
      if (configuration.variante) boite.classList.add('lcdp-alerte-accueil-' + configuration.variante);
      if (configuration.actionLibelle) validerBouton.textContent = configuration.actionLibelle;
      else validerBouton.hidden = true;

      const precedentFocus = document.activeElement;
      const ecouteurs = new AbortController();
      function fermer() {
        ecouteurs.abort();
        slot.replaceChildren();
        if (precedentFocus && typeof precedentFocus.focus === 'function') precedentFocus.focus();
      }
      fermerBouton.addEventListener('click', fermer, { signal: ecouteurs.signal });
      boite.addEventListener('click', e => { if (e.target === boite) fermer(); }, { signal: ecouteurs.signal });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') fermer();
        if (e.key === 'Tab') {
          const elements = [fermerBouton, ...(validerBouton.hidden ? [] : [validerBouton])];
          const index = elements.indexOf(document.activeElement);
          if (e.shiftKey && index <= 0) { e.preventDefault(); elements[elements.length - 1].focus(); }
          else if (!e.shiftKey && index === elements.length - 1) { e.preventDefault(); elements[0].focus(); }
        }
      }, { signal: ecouteurs.signal });
      validerBouton.addEventListener('click', () => {
        fermer();
        if (configuration.destination) window.location.assign(configuration.destination);
      }, { signal: ecouteurs.signal });
      fermerBouton.focus();
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
