(() => {
  'use strict';

  const CHEMIN_MENTIONS_LEGALES = '/ESPACE-PUBLIC/mentions-legales.html';
  const construireUrlMentionsLegales = () => {
    const config = window.SITE_CONFIG || {};
    if (typeof config.publicUrl === 'function') return config.publicUrl(CHEMIN_MENTIONS_LEGALES);
    if (typeof window.LCDP_urlPublic === 'function') return window.LCDP_urlPublic(CHEMIN_MENTIONS_LEGALES);
    const base = String(config.publicBaseUrl || config.PUBLIC_BASE || window.LCDP_PUBLIC_BASE || window.SITE_BASE || '').replace(/\/+$/, '');
    return base ? base + CHEMIN_MENTIONS_LEGALES : CHEMIN_MENTIONS_LEGALES;
  };
  function normaliserLienMentionsLegales(racine = document) {
    racine.querySelectorAll('[data-lcdp-footer-mentions-legales], [data-lcdp-box-footer] a[href*="mentions-legales"]').forEach(element => {
      element.removeAttribute('data-lcdp-footer-mentions-legales');
      element.removeAttribute('onclick');
      element.href = construireUrlMentionsLegales();
      element.dataset.siteHref = CHEMIN_MENTIONS_LEGALES;
    });
  }
  function ouvrirPageMentionsLegales(event) {
    event?.preventDefault();
    window.location.assign(construireUrlMentionsLegales());
    return false;
  }
  document.addEventListener('click', event => {
    const declencheur = event.target.closest('[data-lcdp-footer-mentions-legales]');
    if (!declencheur) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    ouvrirPageMentionsLegales();
  }, true);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => normaliserLienMentionsLegales(), {once:true});
  } else normaliserLienMentionsLegales();
  window.LCDP_ouvrirMentionsLegalesFooter = ouvrirPageMentionsLegales;
  window.LCDP_chargerMentionsLegalesFooterDepuisObjet = ouvrirPageMentionsLegales;
  window.LCDP_initialiserFooterMentionsLegales = () => { normaliserLienMentionsLegales(); return true; };
})();

(() => {
  'use strict';
  if (window.LCDP_verificationFooterInstalle) return;
  window.LCDP_verificationFooterInstalle = true;

  // Styles exclusivement issus du CSS central : spinner c085, dialogue c066, alerte c033.
  const tokens = new Set(String(document.documentElement.getAttribute('data-lcdp-css') || '').split(/\s+/).filter(Boolean));
  ['c085', 'c066', 'c033'].forEach(token => tokens.add(token));
  document.documentElement.setAttribute('data-lcdp-css', [...tokens].join(' '));

  const CLE_PUBLIQUE = '0x4AAAAAAFiynf6HIp1GlPxM';
  const API_VERIFICATION = 'https://lacleduparc.fr/api/verification';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let actif = null;
  let chargementTurnstile = null;
  const attentes = new Set();
  let calqueCommun = null;

  function urlObjet(chemin) {
    const config = window.SITE_CONFIG || {};
    if (typeof config.objetUrl === 'function') return config.objetUrl(chemin);
    if (typeof window.LCDP_urlObjet === 'function') return window.LCDP_urlObjet(chemin);
    return String(config.objetBaseUrl || config.OBJET_BASE || window.LCDP_OBJET_BASE || '/OBJET').replace(/\/+$/, '') + chemin;
  }
  async function chargerFragment(chemin) {
    const reponse = await fetch(urlObjet(chemin), {method:'GET', credentials:'same-origin', cache:'no-cache'});
    if (!reponse.ok) throw new Error('Composant indisponible : ' + chemin);
    const template = document.createElement('template');
    template.innerHTML = (await reponse.text()).trim();
    return template.content.cloneNode(true);
  }
  function creerSpinner() {
    const conteneur = document.createElement('div');
    conteneur.className = 'lcdp-loading-spinner';
    conteneur.setAttribute('aria-hidden', 'true');
    for (const type of ['track','arc']) {
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox','0 0 36 36');
      svg.setAttribute('class','lcdp-loading-spinner__' + type);
      const cercle = document.createElementNS(SVG_NS, 'circle');
      [['cx','18'],['cy','18'],['r','16'],['fill','none'],['stroke','currentColor'],['stroke-width','3'],['stroke-linecap','round']].forEach(([nom,valeur]) => cercle.setAttribute(nom,valeur));
      if (type === 'arc') { cercle.setAttribute('stroke-dasharray','100'); cercle.setAttribute('stroke-dashoffset','75'); }
      svg.append(cercle); conteneur.append(svg);
    }
    const point = document.createElement('span');
    point.className = 'lcdp-loading-spinner__dot';
    conteneur.append(point);
    return conteneur;
  }
  function creerCalque() {
    const calque = document.createElement('div');
    calque.className = 'lcdp-verification-envoi-attente lcdp-verification-envoi-actif';
    calque.setAttribute('role','status');
    calque.setAttribute('aria-label','Vérification en cours');
    calque.append(creerSpinner());
    document.body.append(calque);
    return calque;
  }
  window.LCDP_chargement = {
    afficher() {
      const jeton = {};
      attentes.add(jeton);
      if (!calqueCommun) calqueCommun = creerCalque();
      return jeton;
    },
    masquer(jeton) {
      if (!attentes.delete(jeton)) return;
      if (attentes.size === 0 && calqueCommun) {calqueCommun.remove(); calqueCommun = null;}
    }
  };
  function chargerTurnstile() {
    if (window.turnstile?.render) return Promise.resolve(window.turnstile);
    if (chargementTurnstile) return chargementTurnstile;
    chargementTurnstile = new Promise((resolve,reject) => {
      let script = document.querySelector('script[data-lcdp-turnstile]');
      if (!script) {
        script = document.createElement('script');
        script.dataset.lcdpTurnstile = '';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        document.head.append(script);
      }
      let termine = false;
      const debut = Date.now();
      const echouer = () => {
        if (termine) return;
        termine = true;
        script.remove();
        chargementTurnstile = null;
        reject(new Error('La vérification ne répond pas. Fermez puis réessayez.'));
      };
      script.addEventListener('error',echouer,{once:true});
      (function verifier() {
        if (termine) return;
        if (window.turnstile?.render) {termine = true; resolve(window.turnstile); return;}
        if (Date.now() - debut >= 15000) {echouer(); return;}
        setTimeout(verifier,100);
      })();
    });
    return chargementTurnstile;
  }
  let cssDialogueReference = null;
  async function assurerCssDialogueReference() {
    if (cssDialogueReference) return cssDialogueReference;
    const href = urlObjet('/CSSBASE/lcdp-lightbox-convergence.css');
    if ([...document.querySelectorAll('link[rel="stylesheet"]')]
      .some(lien => lien.href === new URL(href, document.baseURI).href)) return;
    cssDialogueReference = new Promise((resolve,reject) => {
      const lien = document.createElement('link');
      lien.rel = 'stylesheet';
      lien.href = href;
      lien.onload = resolve;
      lien.onerror = () => {
        lien.remove();
        cssDialogueReference = null;
        reject(new Error('CSS des dialogues de référence indisponible.'));
      };
      document.head.appendChild(lien);
    });
    return cssDialogueReference;
  }
  async function afficherAlerte(message,type = 'information',retour = null) {
    let racine;
    const information = type !== 'erreur';
    try {
      await assurerCssDialogueReference();
      const fragment = await chargerFragment(information
        ? '/HTMLBASE/02-dialogue-reference-information.html'
        : '/HTMLBASE/02-dialogue-reference-erreur.html');
      racine = fragment.querySelector(information
        ? '[data-lcdp-dialogue-reference="information"]'
        : '[data-lcdp-dialogue-reference="erreur"]');
      const titre = racine?.querySelector('[data-lcdp-dialogue-titre]');
      const texte = racine?.querySelector('[data-lcdp-dialogue-message]');
      const ok = racine?.querySelector(information
        ? '[data-lcdp-dialogue-action="compris"]'
        : '[data-lcdp-dialogue-action="fermer"]');
      if (!racine || !titre || !texte || !ok) throw new Error('Structure du dialogue de référence incomplète.');
      titre.textContent = information ? 'Vérification envoyée' : 'Erreur de vérification';
      texte.textContent = message;
      ok.textContent = 'OK';
      document.body.append(fragment);
      await new Promise(resolve => {
        let termine = false;
        function terminer() {
          if (termine) return;
          termine = true;
          document.removeEventListener('keydown',echap);
          racine.remove();
          resolve();
        }
        function echap(event) {
          if (event.key === 'Escape') { event.preventDefault(); terminer(); }
        }
        ok.addEventListener('click',terminer,{once:true});
        racine.addEventListener('click',event => {
          if (event.target === racine) terminer();
        });
        document.addEventListener('keydown',echap);
        ok.focus();
      });
    } catch (erreur) {
      racine?.remove();
      console.error('Dialogue de vérification indisponible :',erreur);
      window.alert(message);
    }
    if (retour?.isConnected) retour.focus();
  }
  async function creerFormulaire(boutonRetour) {
    const fragment = await chargerFragment('/HTMLBASE/04-dialogue-champ.html');
    const boite = fragment.querySelector('[data-lcdp-box-dialogue-champ]');
    const titre = boite?.querySelector('[data-lcdp-dialogue-champ-title]');
    const contenu = boite?.querySelector('[data-lcdp-dialogue-champ-content]');
    const form = boite?.querySelector('[data-lcdp-dialogue-champ-form]');
    const erreur = boite?.querySelector('[data-lcdp-dialogue-champ-error]');
    const fermer = boite?.querySelector('[data-lcdp-dialogue-champ-close]');
    const annuler = boite?.querySelector('[data-lcdp-dialogue-champ-cancel]');
    const envoyer = boite?.querySelector('[data-lcdp-dialogue-champ-submit]');
    if (![boite,titre,contenu,form,erreur,fermer,annuler,envoyer].every(Boolean)) throw new Error('Dialogue centralisé incomplet');

    titre.textContent = 'Vérification';
    envoyer.textContent = 'Envoyer';
    const groupe = document.createElement('div');
    groupe.className = 'lcdp-box-dialogue-champ__field';
    const etiquette = document.createElement('label');
    etiquette.className = 'lcdp-box-dialogue-champ__label';
    etiquette.htmlFor = 'lcdp-verification-email';
    etiquette.textContent = 'Votre adresse e-mail';
    const email = document.createElement('input');
    email.id = 'lcdp-verification-email'; email.type = 'email'; email.required = true; email.maxLength = 254;
    email.autocomplete = 'email'; email.className = 'lcdp-box-dialogue-champ__input';
    groupe.append(etiquette,email);
    const challenge = document.createElement('div');
    challenge.setAttribute('aria-label','Protection antirobot');
    contenu.append(groupe,challenge);
    document.body.append(fragment);

    const etat = {boite,form,email,envoyer,fermer,annuler,erreur,challenge,
      widget:null,token:'',phase:'formulaire',retour:boutonRetour,attenteProtection:null,delaiProtection:null,relances:0};
    const messageErreur = texte => {erreur.textContent = texte; erreur.hidden = !texte;};
    etat.finAttenteProtection = () => {
      if (etat.attenteProtection) {
        window.LCDP_chargement.masquer(etat.attenteProtection);
        etat.attenteProtection = null;
      }
    };
    etat.fermerBoite = () => {
      if (etat.phase === 'envoi') return;
      clearTimeout(etat.delaiProtection);
      etat.finAttenteProtection();
      if (etat.widget !== null && window.turnstile) {
        try {window.turnstile.remove(etat.widget);} catch { /* La fermeture reste possible. */ }
      }
      boite.remove();
      if (actif === etat) actif = null;
      if (boutonRetour.isConnected) boutonRetour.focus();
    };
    fermer.addEventListener('click',etat.fermerBoite);
    annuler.addEventListener('click',etat.fermerBoite);
    boite.addEventListener('keydown',event => {
      if (event.key === 'Escape') {event.preventDefault();etat.fermerBoite();}
    });
    form.addEventListener('submit',async event => {
      event.preventDefault();
      if (etat.phase === 'envoi' || !form.reportValidity()) return;
      if (!etat.token) {messageErreur('La protection antirobot n’est pas encore validée.'); return;}
      messageErreur('');
      etat.phase = 'envoi'; envoyer.disabled = true; fermer.disabled = true; annuler.disabled = true;
      const token = etat.token; etat.token = '';
      boite.style.display = 'none';
      const attente = window.LCDP_chargement.afficher();
      let succes = false;
      let message = '';
      try {
        const reponse = await fetch(API_VERIFICATION,{
          method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',
          body:JSON.stringify({email:email.value.trim(),token}),signal:AbortSignal.timeout(40000)
        });
        let data = null;
        try {data = await reponse.json();} catch { /* Une réponse HTML est possible. */ }
        succes = reponse.ok && data?.ok === true;
        message = succes ? (typeof data?.message === 'string' && data.message ? data.message : 'Votre demande de vérification a été envoyée.') :
          reponse.status === 429 ? 'Service occupé. Réessayez dans quelques instants.' :
          (typeof data?.message === 'string' && data.message ? data.message : 'Envoi impossible. Réessayez plus tard.');
      } catch {message = 'Envoi non confirmé. Réessayez plus tard.';}
      finally {window.LCDP_chargement.masquer(attente);}
      if (succes) {
        etat.phase = 'formulaire';
        etat.fermerBoite();
        await afficherAlerte(message,'validation',boutonRetour);
      } else {
        boite.style.removeProperty('display');
        etat.phase = 'formulaire';
        envoyer.disabled = false; fermer.disabled = false; annuler.disabled = false;
        if (etat.widget !== null && window.turnstile) {
          window.turnstile.reset(etat.widget);
          etat.surveillerProtection();
        }
        await afficherAlerte(message,'erreur',email);
      }
    });
    email.focus();
    return etat;
  }

  document.addEventListener('click',async event => {
    const bouton = event.target.closest('[data-lcdp-footer-verification], [popovertarget="lcdp-footer-verification-info"]');
    if (!bouton || bouton.getAttribute('popovertargetaction') === 'hide') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (actif) return;
    // Ancien popover : ne pas laisser deux dialogues ouverts.
    document.getElementById('lcdp-footer-verification-info')?.hidePopover?.();
    actif = {phase:'ouverture'};
    const attente = window.LCDP_chargement.afficher();
    let api,etat;
    try {
      api = await chargerTurnstile();
      etat = await creerFormulaire(bouton);
      actif = etat;
    } catch (erreur) {
      actif = null;
      window.LCDP_chargement.masquer(attente);
      await afficherAlerte(erreur.message || 'Vérification indisponible. Réessayez.','erreur',bouton);
      return;
    }
    window.LCDP_chargement.masquer(attente);
    etat.attenteProtection = window.LCDP_chargement.afficher();
    etat.surveillerProtection = () => {
      clearTimeout(etat.delaiProtection);
      etat.delaiProtection = setTimeout(() => {
        if (!etat.boite.isConnected || etat.token || etat.phase === 'envoi') return;
        if (etat.relances < 1 && etat.widget !== null) {
          etat.relances++;
          api.reset(etat.widget);
          etat.surveillerProtection();
        } else {
          etat.finAttenteProtection();
          etat.erreur.textContent = 'La protection antirobot ne répond pas. Fermez puis réessayez.';
          etat.erreur.hidden = false;
        }
      },15000);
    };
    try {
      etat.widget = api.render(etat.challenge,{
        sitekey:CLE_PUBLIQUE,action:'verification',theme:'light',appearance:'interaction-only',
        retry:'auto','retry-interval':8000,
        size:window.innerWidth < 350 ? 'compact' : 'flexible',
        'before-interactive-callback':() => etat.finAttenteProtection(),
        callback:token => {
          if (!etat.boite.isConnected) return;
          clearTimeout(etat.delaiProtection);
          etat.finAttenteProtection();
          etat.token = token;
          etat.erreur.textContent = ''; etat.erreur.hidden = true;
        },
        'expired-callback':() => {
          etat.token = '';
          if (etat.phase !== 'envoi' && etat.boite.isConnected) {api.reset(etat.widget);etat.surveillerProtection();}
        },
        'timeout-callback':() => {
          etat.finAttenteProtection(); etat.token = '';
          etat.erreur.textContent = 'La protection antirobot a expiré. Fermez puis réessayez.';
          etat.erreur.hidden = false;
        },
        'error-callback':() => {
          etat.finAttenteProtection(); etat.token = '';
          etat.erreur.textContent = 'Protection antirobot indisponible. Fermez puis réessayez.';
          etat.erreur.hidden = false;
          return true;
        }
      });
      if (!etat.token) etat.surveillerProtection();
    } catch {
      etat.finAttenteProtection();
      etat.erreur.textContent = 'Protection antirobot indisponible. Fermez puis réessayez.';
      etat.erreur.hidden = false;
    }
  },true);
})();
