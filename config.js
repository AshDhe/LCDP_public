(function () {
  const host = window.location.hostname;

  const isGithub =
    host === "ashdhe.github.io" ||
    host === "huguespavret.github.io";

  const githubOrigin = "https://" + host;

  const CONFIG = {
    github: {
      publicBase: githubOrigin + "/LCDP_public",
      objetBase: githubOrigin + "/LCDP_public/OBJET",
      membreBase: githubOrigin + "/LCDP_membre",
      parcBase: githubOrigin + "/LCDP_parc",
      coachBase: githubOrigin + "/LCDP_coach",
      adminBase: githubOrigin + "/LCDP_admin"
    },

    production: {
      publicBase: "https://lacleduparc.fr",
      objetBase: "https://lacleduparc.fr/OBJET",
      membreBase: "https://membre.lacleduparc.fr",
      parcBase: "https://parc.lacleduparc.fr",
      coachBase: "https://coach.lacleduparc.fr",
      adminBase: "https://admin.lacleduparc.fr"
    }
  };

  const active = isGithub ? CONFIG.github : CONFIG.production;

  const WORKERS = {
    mdptokenz: "https://mdptokenz-api.lacleduparc.fr",
    connexionMembre: "https://connexion-membre-api.lacleduparc.fr",
    formInscriptionMembre: "https://form-inscription-membre-api.lacleduparc.fr",
    la: "https://la-api.lacleduparc.fr",
    userRouteur: "https://user-routeur-api.lacleduparc.fr",
    editingAdmin: "https://editing-admin-api.lacleduparc.fr",
    editingAdminFallback: "https://w-editing-admin.hugues-pavret.workers.dev"
  };

  function buildUrl(base, path) {
    return base.replace(/\/$/, "") + "/" + String(path || "").replace(/^\/+/, "");
  }

  window.SITE_CONFIG = {
    publicBaseUrl: active.publicBase,
    siteBase: active.publicBase,
    objetBaseUrl: active.objetBase,

    membreBaseUrl: active.membreBase,
    parcBaseUrl: active.parcBase,
    coachBaseUrl: active.coachBase,
    adminBaseUrl: active.adminBase,

    workerMdptokenzUrl: WORKERS.mdptokenz,
    workerConnexionMembreUrl: WORKERS.connexionMembre,
    workerFormInscriptionMembreUrl: WORKERS.formInscriptionMembre,
    workerUserRouteurUrl: WORKERS.userRouteur,
    workerLaUrl: WORKERS.la,
    workerEditingAdminUrl: WORKERS.editingAdmin,
    workerEditingAdminFallbackUrl: WORKERS.editingAdminFallback,
    WORKER_LA_URL: WORKERS.la,
    WORKER_EDITING_ADMIN_URL: WORKERS.editingAdmin,
    WORKER_EDITING_ADMIN_FALLBACK_URL: WORKERS.editingAdminFallback,


    PUBLIC_BASE: active.publicBase,
    SITE_BASE: active.publicBase,
    OBJET_BASE: active.objetBase,
    MEMBRE_BASE: active.membreBase,
    PARC_BASE: active.parcBase,
    COACH_BASE: active.coachBase,
    ADMIN_BASE: active.adminBase,

    WORKER_MDPTOKENZ_URL: WORKERS.mdptokenz,
    WORKER_CONNEXION_MEMBRE_URL: WORKERS.connexionMembre,
    WORKER_FORM_INSCRIPTION_MEMBRE_URL: WORKERS.formInscriptionMembre,
    WORKER_USER_ROUTEUR_URL: WORKERS.userRouteur,

    publicUrl(path) {
      return buildUrl(active.publicBase, path);
    },

    objetUrl(path) {
      return buildUrl(active.objetBase, path);
    },

    membreUrl(path) {
      return buildUrl(active.membreBase, path);
    },

    parcUrl(path) {
      return buildUrl(active.parcBase, path);
    },

    coachUrl(path) {
      return buildUrl(active.coachBase, path);
    },

    adminUrl(path) {
      return buildUrl(active.adminBase, path);
    },

    apiUrl(workerSubdomain) {
      return "https://" + workerSubdomain + ".lacleduparc.fr";
    }
  };
})();
