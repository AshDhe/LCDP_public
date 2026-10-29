(() => {
  "use strict";
  if (window.LCDP_ACTUALITE_GROUPES) return;
  const groupes = Object.freeze({
    RESEAU: Object.freeze({label:"Actualité réseau"}),
    CLUB: Object.freeze({label:"Actualité club"}),
    COACHS: Object.freeze({label:"Actualité coach"}),
    ASSO: Object.freeze({label:"Actualité asso"})
  });
  const cle = value => Object.hasOwn(groupes, value) ? value : "RESEAU";
  function cartouche(value) {
    const code=cle(value), e=document.createElement("span");
    e.className="lcdp-actualite-groupe";e.dataset.groupe=code;e.textContent=groupes[code].label;
    return e;
  }
  window.LCDP_ACTUALITE_GROUPES=Object.freeze({groupes,cle,cartouche});
})();
