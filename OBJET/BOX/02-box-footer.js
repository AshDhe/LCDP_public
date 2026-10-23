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

  function afficherConfirmation(message, retour) {
    const box = document.createElement('div');
    box.setAttribute('popover', 'manual');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', message || 'Adresse enregistrée');
    // Le calque occupe l'écran ; la carte dans le Shadow DOM reste compacte.
    // Aucun style de .lcdp-contact-info ou des div/boutons de la page ne s'y applique.
    const styles = {
      all: 'initial', position: 'fixed', inset: '0', margin: '0',
      width: '100%', height: '100%', 'min-width': '0', 'min-height': '0',
      'max-width': 'none', 'max-height': 'none', padding: '18px', border: '0',
      'box-sizing': 'border-box', background: 'rgba(31,42,36,.46)',
      'backdrop-filter': 'blur(4px)', transform: 'none', overflow: 'auto'
    };
    for (const [propriete, valeur] of Object.entries(styles)) {
      box.style.setProperty(propriete, valeur, 'important');
    }
    const racine = box.attachShadow({mode: 'closed'});
    const style = document.createElement('style');
    style.textContent = `
      .carte { box-sizing:border-box; width:280px; max-width:100%;
        height:auto; min-height:0; margin:auto; padding:24px;
        border:1px solid #cbd1cc; border-radius:24px; background:#fff;
        color:#1f2a24; font:16px/1.5 Arial,sans-serif; text-align:center;
        box-shadow:0 18px 50px rgba(31,42,36,.18); }
      p { margin:0 0 20px; overflow-wrap:anywhere; }
      button { box-sizing:border-box; display:block; width:110px; height:52px;
        margin:0 auto; padding:0 20px; border:0; border-radius:16px;
        background:var(--lcdp-color-primary,#57754c); color:#fff;
        font:600 16px/1 Arial,sans-serif; cursor:pointer; }
      button:focus-visible { outline:2px solid #1f2a24; outline-offset:4px; }
    `;
    const carte = document.createElement('div');
    carte.className = 'carte';
    if (message) {
      const texte = document.createElement('p');
      texte.textContent = message;
      carte.append(texte);
    }
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = 'OK';
    ok.addEventListener('click', () => {
      box.hidePopover();
      box.remove();
      retour.focus();
    });
    carte.append(ok);
    racine.append(style, carte);
    document.body.append(box);
    box.showPopover();
    box.style.setProperty('display', 'flex', 'important');
    ok.focus();
  }
  const CLE_PUBLIQUE = '0x4AAAAAAFiynf6HIp1GlPxM';
  const API_VERIFICATION = 'https://lacleduparc.fr/api/verification';
  let chargementTurnstile = null;

  function chargerTurnstile() {
    if (window.turnstile?.render) return Promise.resolve(window.turnstile);
    if (chargementTurnstile) return chargementTurnstile;
    chargementTurnstile = new Promise((resolve, reject) => {
      let script = document.querySelector('script[data-lcdp-turnstile]');
      if (!script) {
        script = document.createElement('script');
        script.dataset.lcdpTurnstile = '';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        document.head.append(script);
      }
      let fini = false;
      const debut = Date.now();
      function verifier() {
        if (fini) return;
        if (window.turnstile?.render) { fini = true; resolve(window.turnstile); return; }
        if (Date.now() - debut >= 15000) { echouer(); return; }
        setTimeout(verifier, 100);
      }
      function echouer() {
        if (fini) return;
        fini = true;
        script.remove();
        chargementTurnstile = null;
        reject(new Error('La vérification ne répond pas. Fermez puis réessayez.'));
      }
      script.addEventListener('error', echouer, {once:true});
      verifier();
    });
    return chargementTurnstile;
  }

  function creerFormulaire(boutonRetour) {
    const box = document.createElement('div');
    box.setAttribute('popover','manual');
    box.setAttribute('role','dialog');
    box.setAttribute('aria-label','Vérification');
    const proprietes = {all:'initial',position:'fixed',inset:'0',width:'100%',height:'100%',
      'max-width':'none','max-height':'none','min-width':'0','min-height':'0',margin:'0',padding:'12px',
      'box-sizing':'border-box',border:'0',background:'rgba(31,42,36,.46)',
      'backdrop-filter':'blur(4px)',overflow:'auto',transform:'none'};
    for (const [nom,valeur] of Object.entries(proprietes)) box.style.setProperty(nom,valeur,'important');
    const racine = box.attachShadow({mode:'closed'});
    const style = document.createElement('style');
    style.textContent = `
      .carte { position:relative; box-sizing:border-box; width:380px; max-width:100%;
        height:auto; min-height:0; margin:auto; padding:52px 12px 18px;
        border:1px solid #cbd1cc; border-radius:24px; background:#fff; color:#1f2a24;
        font:16px/1.4 Arial,sans-serif; box-shadow:0 18px 50px rgba(31,42,36,.18); }
      form { display:flex; align-items:center; gap:8px; margin:0; }
      input { box-sizing:border-box; flex:1; width:0; min-width:0; height:46px;
        padding:10px; border:1px solid #57754c; border-radius:8px;
        background:#fff; color:#1f2a24; font:16px Arial,sans-serif; }
      button { box-sizing:border-box; min-height:46px; padding:10px 12px;
        border:1px solid #57754c; border-radius:8px;
        background:#57754c; color:#fff; font:16px Arial,sans-serif; cursor:pointer; }
      button:disabled { opacity:.55; cursor:default; }
      .fermer { position:absolute; top:6px; right:6px; width:40px; min-height:40px;
        padding:0; border:0; border-radius:50%; background:#f7f7f4; color:#1f2a24;
        font-size:28px; line-height:1; }
      .statut { margin:8px 0 0; text-align:center; font-size:14px; }
      .statut:empty { display:none; }
      button:focus-visible { outline:2px solid #1f2a24; outline-offset:3px; }
      input:focus-visible { outline:none; }
    `;
    const carte = document.createElement('div'); carte.className = 'carte';
    const fermer = document.createElement('button'); fermer.type = 'button';
    fermer.className = 'fermer'; fermer.textContent = '×'; fermer.setAttribute('aria-label','Fermer');
    const form = document.createElement('form');
    const email = document.createElement('input');
    email.type = 'email'; email.required = true; email.maxLength = 254;
    email.autocomplete = 'email';
    email.setAttribute('aria-label','Adresse email');
    const envoyer = document.createElement('button'); envoyer.type = 'submit';
    envoyer.textContent = 'Envoyer'; envoyer.disabled = true;
    form.append(email,envoyer);
    const statut = document.createElement('p'); statut.className = 'statut';
    statut.setAttribute('role','status'); statut.setAttribute('aria-live','polite');
    statut.textContent = 'Vérification en cours…';
    // Turnstile est rendu dans le DOM public, projeté dans la carte isolée.
    const challenge = document.createElement('div'); challenge.slot = 'challenge';
    challenge.style.cssText = 'all:initial!important;display:block!important;width:100%!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;box-sizing:border-box!important;';
    const emplacement = document.createElement('slot'); emplacement.name = 'challenge';
    carte.append(fermer,form,emplacement,statut);
    racine.append(style,carte); box.append(challenge); document.body.append(box);
    box.showPopover(); box.style.setProperty('display','flex','important');
    const etat = {phase:'formulaire',box,form,email,envoyer,statut,fermer,challenge,
      widget:null,token:'',retour:boutonRetour};
    etat.fermerBoite = () => {
      if (etat.phase === 'envoi') return;
      if (etat.widget !== null && window.turnstile) window.turnstile.remove(etat.widget);
      box.hidePopover(); box.remove();
      if (actif === etat) actif = null;
      boutonRetour.focus();
    };
    fermer.addEventListener('click',etat.fermerBoite);
    box.addEventListener('click',event => {
      if (event.composedPath()[0] === box) etat.fermerBoite();
    });
    box.addEventListener('keydown',event => {
      if (event.key === 'Escape') {event.preventDefault();etat.fermerBoite();}
    });
    form.addEventListener('submit',async event => {
      event.preventDefault();
      if (etat.phase === 'envoi' || !form.reportValidity()) return;
      if (!etat.token) {statut.textContent = 'Patientez pendant la vérification.';return;}
      etat.phase = 'envoi'; envoyer.disabled = true; fermer.disabled = true;
      const token = etat.token; etat.token = '';
      box.hidePopover();
      const attente = window.LCDP_chargement.afficher();
      let succes = false;
      try {
        const r = await fetch(API_VERIFICATION,{
          method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',
          body:JSON.stringify({email:email.value.trim(),token}),signal:AbortSignal.timeout(40000)});
        let data = null;
        try {data = await r.json();} catch { /* Le pare-feu peut renvoyer une page HTML. */ }
        if (r.ok && data?.ok === true) succes = true;
        else statut.textContent = r.status === 429 ?
          'Service occupé. Réessayez dans quelques instants.' :
          (typeof data?.message === 'string' ? data.message : 'Envoi impossible. Réessayez plus tard.');
      } catch {statut.textContent = 'Envoi non confirmé. Réessayez plus tard.';}
      finally {window.LCDP_chargement.masquer(attente);}
      etat.phase = 'formulaire'; fermer.disabled = false;
      if (succes) {
        etat.fermerBoite();
        afficherConfirmation('',boutonRetour);
      } else {
        box.showPopover();
        if (etat.widget !== null) window.turnstile.reset(etat.widget);
        email.focus();
      }
    });
    email.focus();
    return etat;
  }

  document.addEventListener('click', async event => {
    const bouton = event.target.closest('[popovertarget="lcdp-footer-verification-info"]');
    if (!bouton || bouton.getAttribute('popovertargetaction') === 'hide') return;
    event.preventDefault();
    if (actif) return;
    actif = {phase:'ouverture'};
    const attente = window.LCDP_chargement.afficher();
    let api;
    try {api = await chargerTurnstile();}
    catch (erreur) {
      actif = null; window.LCDP_chargement.masquer(attente);
      afficherConfirmation(erreur.message,bouton); return;
    }
    window.LCDP_chargement.masquer(attente);
    const etat = creerFormulaire(bouton); actif = etat;
    try {
      etat.widget = api.render(etat.challenge,{
        sitekey:CLE_PUBLIQUE,action:'verification',theme:'light',appearance:'interaction-only',
        size:window.innerWidth < 350 ? 'compact' : 'flexible',
        callback:token => {
          if (!etat.box.isConnected) return;
          etat.token = token; etat.envoyer.disabled = false;
          if (etat.statut.textContent === 'Vérification en cours…') etat.statut.textContent = '';
        },
        'expired-callback':() => {etat.token = '';etat.envoyer.disabled = true;api.reset(etat.widget);},
        'error-callback':() => {
          etat.token = '';etat.envoyer.disabled = true;
          etat.statut.textContent = 'Vérification indisponible. Fermez puis réessayez.';
          return true;
        }
      });
    } catch {
      etat.statut.textContent = 'Vérification indisponible. Fermez puis réessayez.';
    }
  },true);
})();
