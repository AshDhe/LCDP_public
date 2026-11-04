(() => {
  'use strict';
  const form = document.getElementById('formulaire-connexion-parc');
  if (!form) return;
  const email = document.getElementById('emailparc');
  const password = document.getElementById('mdpparc');
  const button = document.getElementById('bouton-valider-formulaire');
  const show = document.getElementById('afficher-mdp-parc');
  if (!email || !password || !button) return;

  const config = window.SITE_CONFIG || {};
  const endpoint = String(
    config.workerConnexionParcUrl ||
    config.WORKER_CONNEXION_PARC_URL ||
    'https://connexion-parc-api.lacleduparc.fr'
  ).replace(/\/+$/, '');
  const dest = typeof config.parcUrl === 'function'
    ? config.parcUrl('/ESPACE-PARC/accueil-parc.html')
    : String(config.parcBaseUrl || 'https://parc.lacleduparc.fr').replace(/\/+$/, '') + '/ESPACE-PARC/accueil-parc.html';
  const lost = document.getElementById('lien-mot-de-passe-oublie');
  if (lost) {
    lost.href = typeof config.parcUrl === 'function'
      ? config.parcUrl('/ESPACE-PARC/mdp-perdu-parc.html')
      : String(config.parcBaseUrl || 'https://parc.lacleduparc.fr').replace(/\/+$/, '') + '/ESPACE-PARC/mdp-perdu-parc.html';
  }
  show?.addEventListener('change', () => { password.type = show.checked ? 'text' : 'password'; });
  const slot = document.getElementById('lcdp-lightbox-slot');
  const objetUrl = path => typeof config.objetUrl === 'function'
    ? config.objetUrl(path)
    : String(config.objetBaseUrl || config.OBJET_BASE || 'https://lacleduparc.fr/OBJET').replace(/\/+$/, '') + path;

  async function message(t) {
    if (!slot) { window.alert(t); return; }
    let zone;
    try {
      const response = await fetch(objetUrl('/BOX/02-box-alerte.html'), { cache: 'no-cache' });
      if (!response.ok) throw new Error('Boîte d’alerte indisponible.');
      const template = document.createElement('template');
      template.innerHTML = (await response.text()).trim();
      zone = document.createElement('div');
      zone.append(template.content.cloneNode(true));
      slot.append(zone);
      const cible = zone.querySelector('[data-lcdp-alerte-message]');
      const actions = zone.querySelectorAll('[data-lcdp-alerte-ok], [data-lcdp-alerte-close]');
      if (!cible || !actions.length) throw new Error('Boîte d’alerte incomplète.');
      cible.textContent = t;
      await new Promise(resolve => {
        let fermee = false;
        const fermer = () => {
          if (fermee) return;
          fermee = true;
          zone.remove();
          resolve();
        };
        actions.forEach(b => b.addEventListener('click', fermer, { once: true }));
        const overlay = zone.querySelector('[data-lcdp-box-alerte]');
        overlay?.addEventListener('click', event => { if (event.target === overlay) fermer(); });
      });
    } catch (error) { zone?.remove(); window.alert(t); }
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
        body: JSON.stringify({ emailresp: e, mdpparc: pwd })
      });
      const data = await r.json().catch(() => null);
      if (!r.ok || data?.success !== true) throw Error(data?.message || 'Connexion impossible.');

      const controle = await fetch(endpoint + '/session', {
        method: 'GET', credentials: 'include', cache: 'no-store',
        signal: AbortSignal.timeout(15000)
      });
      const etat = await controle.json().catch(() => null);
      if (!controle.ok || etat?.success !== true || etat?.connected !== true || !etat.idresp) {
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
