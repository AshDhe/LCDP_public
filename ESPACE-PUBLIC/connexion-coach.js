(() => {
  'use strict';
  const form = document.getElementById('formulaire-connexion-coach');
  if (!form) return;
  const email = document.getElementById('emailcoach');
  const password = document.getElementById('mdpcoach');
  const button = document.getElementById('bouton-valider-formulaire');
  const show = document.getElementById('afficher-mdp-coach');
  if (!email || !password || !button) return;

  const config = window.SITE_CONFIG || {};
  const endpoint = String(
    config.workerConnexionCoachUrl ||
    config.WORKER_CONNEXION_COACH_URL ||
    'https://connexion-coach-api.lacleduparc.fr'
  ).replace(/\/+$/, '');
  const dest = typeof config.coachUrl === 'function'
    ? config.coachUrl('/ESPACE-COACH/accueil-coach.html')
    : String(config.coachBaseUrl || 'https://coach.lacleduparc.fr').replace(/\/+$/, '') + '/ESPACE-COACH/accueil-coach.html';
  const lost = document.getElementById('lien-mot-de-passe-oublie');
  if (lost) {
    lost.href = typeof config.coachUrl === 'function'
      ? config.coachUrl('/ESPACE-COACH/mdp-perdu-coach.html')
      : String(config.coachBaseUrl || 'https://coach.lacleduparc.fr').replace(/\/+$/, '') + '/ESPACE-COACH/mdp-perdu-coach.html';
  }
  show?.addEventListener('change', () => { password.type = show.checked ? 'text' : 'password'; });
  const slot = document.getElementById('lcdp-lightbox-slot');
  const objetUrl = path => typeof config.objetUrl === 'function'
    ? config.objetUrl(path)
    : String(config.objetBaseUrl || config.OBJET_BASE || 'https://lacleduparc.fr/OBJET').replace(/\/+$/, '') + path;

  async function message(t) {
    if (!slot) { window.alert(t); return; }
    let zone;
    const focusInitial = document.activeElement;
    try {
      const hrefCss = objetUrl('/CSSBASE/lcdp-lightbox-convergence.css');
      if (!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link => link.href === new URL(hrefCss, document.baseURI).href)) {
        await new Promise((resolve, reject) => {
          const feuille = document.createElement('link');
          feuille.rel = 'stylesheet';
          feuille.href = hrefCss;
          feuille.onload = resolve;
          feuille.onerror = () => { feuille.remove(); reject(new Error('CSS ERREUR indisponible.')); };
          document.head.appendChild(feuille);
        });
      }
      const response = await fetch(objetUrl('/HTMLBASE/02-dialogue-reference-erreur.html'), { cache: 'no-cache' });
      if (!response.ok) throw new Error('Dialogue ERREUR indisponible.');
      const template = document.createElement('template');
      template.innerHTML = (await response.text()).trim();
      zone = document.createElement('div');
      zone.append(template.content.cloneNode(true));
      slot.append(zone);
      const dialogue = zone.querySelector('[data-lcdp-dialogue-reference="erreur"]');
      const titre = zone.querySelector('[data-lcdp-dialogue-titre]');
      const texte = zone.querySelector('[data-lcdp-dialogue-message]');
      const bouton = zone.querySelector('[data-lcdp-dialogue-action="fermer"]');
      if (!dialogue || !titre || !texte || !bouton) throw new Error('Dialogue ERREUR incomplet.');
      titre.textContent = 'Connexion impossible';
      texte.textContent = t;
      bouton.textContent = 'Fermer';
      await new Promise(resolve => {
        let fermee = false;
        const fermer = () => {
          if (fermee) return;
          fermee = true;
          document.removeEventListener('keydown', gererClavier);
          zone.remove();
          if (focusInitial?.isConnected && typeof focusInitial.focus === 'function') focusInitial.focus();
          resolve();
        };
        const gererClavier = event => {
          if (event.key === 'Escape') { event.preventDefault(); fermer(); }
        };
        bouton.addEventListener('click', fermer, { once: true });
        dialogue.addEventListener('click', event => { if (event.target === dialogue) fermer(); });
        document.addEventListener('keydown', gererClavier);
        bouton.focus();
      });
    } catch (error) {
      zone?.remove();
      console.warn('Dialogue ERREUR connexion indisponible :', error);
      window.alert(t);
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    const e = email.value.trim().toLowerCase(), pwd = password.value;
    if (!e || !pwd) {
      await message('Renseignez votre adresse e-mail et votre mot de passe.');
      return;
    }
    button.disabled = true;
    button.setAttribute('aria-label', 'Connexion en cours');
    try {
      const r = await fetch(endpoint + '/login', {
        method: 'POST', credentials: 'include', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailcoach: e, mdpcoach: pwd })
      });
      const data = await r.json().catch(() => null);
      if (!r.ok || data?.success !== true) throw Error(data?.message || 'Connexion impossible.');

      const controle = await fetch(endpoint + '/session', {
        method: 'GET', credentials: 'include', cache: 'no-store',
        signal: AbortSignal.timeout(15000)
      });
      const etat = await controle.json().catch(() => null);
      if (!controle.ok || etat?.success !== true || etat?.connected !== true || !etat.idcoach) {
        throw Error('La session ne peut pas être confirmée. Vérifiez les cookies puis réessayez.');
      }
      password.value = '';
      window.location.assign(dest);
    } catch (err) {
      await message(err.message || 'Connexion impossible.');
      button.disabled = false;
      button.setAttribute('aria-label', 'Connexion');
    }
  });
  form.dataset.connexionInitialisee = 'true';
})();
