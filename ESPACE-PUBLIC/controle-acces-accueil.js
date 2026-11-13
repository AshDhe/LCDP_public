/* Contrôle commun des boutons PLANIFIER / MES ACCÈS / MA CLÉ.
   Le Worker reste la source des droits ; aucun cookie n'accorde d'autorisation. */
(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const chemin = {
    planifier: '/ESPACE-MEMBRE/reserver-membre.html',
    mes_acces: '/ESPACE-MEMBRE/planning-membre.html',
    ma_cle: '/ESPACE-MEMBRE/lacleduparc.html',
    regulariser: '/ESPACE-MEMBRE/abonnement-membre.html'
  };
  const libelles = {planifier:'PLANIFIER',mes_acces:'MES ACCÈS',ma_cle:'MA CLÉ'};
  const MINUTE = 60000;
  let traitementEnCours = false;

  function urlMembre(path) {
    if (typeof window.LCDP_urlMembre === 'function') return window.LCDP_urlMembre(path);
    if (typeof config.membreUrl === 'function') return config.membreUrl(path);
    return String(config.membreBaseUrl || config.MEMBRE_BASE || config.siteBase || '').replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
  }
  function urlObjet(path) {
    if (typeof window.LCDP_urlObjet === 'function') return window.LCDP_urlObjet(path);
    if (typeof config.objetUrl === 'function') return config.objetUrl(path);
    const base = config.objetBaseUrl || config.OBJET_BASE || ((config.publicBaseUrl || config.PUBLIC_BASE || '').replace(/\/+$/, '') + '/OBJET');
    return String(base).replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
  }
  function endpoint(cle,ancienne,nom) {
    return String(config[cle] || config[ancienne] || (typeof config.apiUrl === 'function' ? config.apiUrl(nom) : '') || '').replace(/\/+$/, '');
  }
  function urlApi(nom) {
    if (nom === 'index') return endpoint('workerIndexMembreUrl','WORKER_INDEX_MEMBRE_URL','index-membre-api');
    if (nom === 'planning') return endpoint('workerPlanningMembreUrl','WORKER_PLANNING_MEMBRE_URL','planning-membre-api');
    return endpoint('workerLaCleDuParcUrl','WORKER_LA_CLE_DU_PARC_URL','la-cle-du-parc-api');
  }
  async function requete(nom,path) {
    const base = urlApi(nom);
    if (!base) throw new Error('Le service de vérification des droits n’est pas configuré.');
    const controleur = new AbortController();
    const delai = window.setTimeout(() => controleur.abort(), 12000);
    let reponse;
    try {
      reponse = await fetch(base + path, {
        method:'GET',credentials:'include',cache:'no-store',
        signal:controleur.signal,headers:{Accept:'application/json'}
      });
    } catch (erreur) {
      if (erreur?.name === 'AbortError') {
        throw new Error('Le contrôle d’accès ne répond pas. Réessayez.');
      }
      throw erreur;
    } finally {
      window.clearTimeout(delai);
    }
    const data = await reponse.json().catch(() => null);
    if (reponse.status === 401) return {nonConnecte:true};
    if (!reponse.ok || !data || (nom === 'index' && (data.success !== true || data.connected !== true)) ||
        (nom === 'planning' && data.ok !== true && data.success !== true)) {
      throw new Error(String(data?.message || 'Impossible de vérifier vos droits. Merci de réessayer.'));
    }
    return data;
  }
  function vraie(x) { return x === true || x === 1 || x === 'true' || x === '1'; }
  const etatSanction = d => vraie(d.suspension) || d.statutCompte === 'suspension' || d.statutcompte === 'suspension';
  const etatImpaye = d => vraie(d.abonnementSuspendu) || vraie(d.suspendu);
  function dateDebut(r) {
    const t = Date.parse(String(r?.datebookd || ''));
    return Number.isFinite(t) ? t : NaN;
  }
  function eligibles(rows) {
    return (Array.isArray(rows) ? rows : []).filter(r =>
      String(r?.statut || '').toLowerCase() === 'bookd' && Number.isFinite(dateDebut(r)));
  }
  function hh(t) {return new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'}).format(new Date(t)).replace(':',' h ');}
  function fin(r) {
    const valeur = r?.datebookf || r?.endsAt || r?.dateFin || r?.datefin;
    const date = Date.parse(String(valeur || ''));
    return Number.isFinite(date) && date > dateDebut(r) ? date : NaN;
  }

  async function alerte(message, action = null, profil = 'erreur') {
    const slot = document.getElementById('lcdp-lightbox-slot');
    if (!slot) throw new Error('Emplacement de lightbox introuvable.');
    const mode = action ? 'choix' : profil === 'information' ? 'information' : 'erreur';
    const href = urlObjet('/CSSBASE/lcdp-lightbox-convergence.css');
    if (![...document.querySelectorAll('link[rel="stylesheet"]')]
      .some(lien => lien.href === new URL(href, document.baseURI).href)) {
      await new Promise((resolve,reject) => {
        const lien = document.createElement('link');
        lien.rel = 'stylesheet';
        lien.href = href;
        lien.onload = resolve;
        lien.onerror = () => {
          lien.remove();
          reject(new Error('CSS de convergence indisponible.'));
        };
        document.head.appendChild(lien);
      });
    }
    const source = {
      choix: '/HTMLBASE/02-dialogue-reference-choix.html',
      information: '/HTMLBASE/02-dialogue-reference-information.html',
      erreur: '/HTMLBASE/02-dialogue-reference-erreur.html'
    }[mode];
    const response = await fetch(urlObjet(source), {cache:'no-cache'});
    if (!response.ok) throw new Error('Objet lightbox indisponible.');
    const template = document.createElement('template');
    template.innerHTML = (await response.text()).trim();
    slot.replaceChildren(template.content.cloneNode(true));
    const boite = slot.querySelector('[data-lcdp-dialogue-reference="' + mode + '"]');
    const titre = boite?.querySelector('[data-lcdp-dialogue-titre]');
    const texte = boite?.querySelector('[data-lcdp-dialogue-message]');
    const confirmer = boite?.querySelector(mode === 'choix'
      ? '[data-lcdp-dialogue-action="confirmer"]'
      : mode === 'information'
        ? '[data-lcdp-dialogue-action="compris"]'
        : '[data-lcdp-dialogue-action="fermer"]');
    const annuler = mode === 'choix'
      ? boite?.querySelector('[data-lcdp-dialogue-action="annuler"]')
      : null;
    if (!boite || !titre || !texte || !confirmer || (mode === 'choix' && !annuler)) {
      slot.replaceChildren();
      throw new Error('Structure de lightbox incomplète.');
    }
    titre.textContent = mode === 'choix' ? 'Accès à votre espace' :
      mode === 'information' ? 'Information' : 'Accès indisponible';
    texte.textContent = message;
    confirmer.textContent = action ? action.libelle : 'Fermer';
    if (annuler) annuler.textContent = 'Fermer';

    const focusInitial = document.activeElement;
    const controller = new AbortController();
    const fermer = () => {
      controller.abort();
      slot.replaceChildren();
      if (focusInitial?.isConnected && typeof focusInitial.focus === 'function') {
        focusInitial.focus({preventScroll:true});
      }
    };
    confirmer.addEventListener('click', () => {
      fermer();
      if (action) window.location.href = urlMembre(chemin[action.destination]);
    }, {signal:controller.signal});
    annuler?.addEventListener('click',fermer,{signal:controller.signal});
    boite.addEventListener('click',event=>{
      if (event.target === boite) fermer();
    },{signal:controller.signal});
    document.addEventListener('keydown',event=>{
      if (event.key === 'Escape') {event.preventDefault();fermer();}
      if (mode === 'choix' && event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === annuler) {
          event.preventDefault();confirmer.focus();
        } else if (!event.shiftKey && document.activeElement === confirmer) {
          event.preventDefault();annuler.focus();
        }
      }
    },{signal:controller.signal});
    if (annuler) annuler.focus(); else confirmer.focus();
  }
  function planifier() {return {libelle:'PLANIFIER',destination:'planifier'};}
  function regulariser() {return {libelle:'Régulariser',destination:'regulariser'};}
  async function planning() {
    const data=await requete('planning','/mes-reservations');
    if(data.nonConnecte) return data;
    if(!Array.isArray(data.reservations)) throw new Error('Le planning ne peut pas être vérifié.');
    return eligibles(data.reservations);
  }

  async function gererMaCle(options) {
    if(typeof options.avantMaCle === 'function') options.avantMaCle();
    const rep=await requete('cle','/access');
    if(rep.nonConnecte) return 'non_connecte';
    if(rep.allowed === true) {window.location.href=urlMembre(chemin.ma_cle);return 'ouvert';}
    if(rep.reason === 'browser_not_owner') {
      if(typeof options.surNavigateurNonProprietaire === 'function') await options.surNavigateurNonProprietaire();
      else await alerte('Ce navigateur n’est pas votre navigateur propriétaire. Utilisez votre navigateur autorisé pour accéder à Ma clé.');
      return 'refuse';
    }
    const motif=String(rep.reason || '').toLowerCase();
    if(motif === 'subscription_unpaid') {
      await alerte('Votre abonnement est impayé. Vous devez le régulariser pour utiliser la fonction MA CLÉ.',regulariser());
      return 'refuse';
    }
    if(motif === 'suspension') {await alerte('Votre compte est suspendu. Vos droits sont bloqués.');return 'refuse';}
    if(rep.success === false || (motif !== 'no_current_access' && motif !== 'no_reservation' && motif !== 'no_invitation' && motif !== 'key_inactive' && motif !== 'too_early' && motif !== 'too_late' && motif !== 'sponsor_not_checked_in')) {
      await alerte(String(rep.message || 'Impossible de vérifier votre clé. Merci de réessayer.'));
      return 'refuse';
    }
    const resas=await planning();
    if(resas.nonConnecte) return 'non_connecte';
    const now=Date.now();
    const proche=resas.filter(r=>dateDebut(r)-30*MINUTE<=now && now<dateDebut(r)-15*MINUTE).sort((a,b)=>dateDebut(a)-dateDebut(b))[0];
    if(proche) {
      const debut=dateDebut(proche),invitation=vraie(proche.invitation);
      let message='Votre clé sera active à partir de '+hh(debut-15*MINUTE)+(Number.isFinite(fin(proche))?' jusqu’à '+hh(fin(proche)+30*MINUTE):'')+' pour l’accès planifié.';
      if(invitation) message+=' Votre invitant doit d’abord valider son checkin sans valider le vôtre.';
      await alerte(message, null, 'information');return 'refuse';
    }
    const pendant=resas.filter(r=>Number.isFinite(fin(r)) && dateDebut(r)-15*MINUTE<=now && now<=fin(r)+30*MINUTE).sort((a,b)=>dateDebut(a)-dateDebut(b))[0];
    if(motif==='sponsor_not_checked_in' && pendant && vraie(pendant.invitation)) {
      await alerte('Votre clé sera active jusqu’à '+hh(fin(pendant)+30*MINUTE)+' quand votre invitant aura validé son checkin sans valider le vôtre.', null, 'information');
      return 'refuse';
    }
    const depassee=resas.filter(r=>Number.isFinite(fin(r)) && fin(r)+30*MINUTE<now).sort((a,b)=>fin(b)-fin(a))[0];
    if(depassee) {await alerte('Votre clé n’est plus active pour l’accès planifié.', null, 'information');return 'refuse';}
    if(pendant && motif !== 'no_current_access' && motif !== 'no_reservation' && motif !== 'no_invitation') {
      await alerte(String(rep.message || 'Votre clé n’est pas active actuellement.'));return 'refuse';
    }
    await alerte("Vous n'avez pas d'accès en cours",planifier());
    return 'refuse';
  }

  async function executer(action,options={}) {
    if(traitementEnCours) return 'en_cours';
    if(!Object.prototype.hasOwnProperty.call(libelles,action)) throw new Error('Fonction inconnue.');
    traitementEnCours=true;
    try {
      const etat=await requete('index','/index');
      if(etat.nonConnecte) return 'non_connecte';
      if(etatSanction(etat)) {
        await alerte('Votre compte est suspendu. Vos droits sont bloqués.');return 'refuse';
      }
      if(etatImpaye(etat)) {
        await alerte('Votre abonnement est impayé. Vous devez le régulariser pour utiliser la fonction '+libelles[action]+'.',regulariser());
        return 'refuse';
      }
      if(action==='planifier') {const destination=urlMembre(chemin.planifier);window.location.href=options.planifierMode==='ia' ? destination+'?mode=ia' : destination;return 'ouvert';}
      // MES ACCÈS reste consultable même sans accès futur (onglet Passés).
      // Le contrôle serveur de connexion, suspension et impayés reste inchangé.
      if(action==='mes_acces') {window.location.href=urlMembre(chemin.mes_acces);return 'ouvert';}
      return await gererMaCle(options);
    } finally {traitementEnCours=false;}
  }
  window.LCDP_AccueilDroits=Object.freeze({executer});
})();
