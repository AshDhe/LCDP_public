const paramsFicheParcNouvelleDate = new URLSearchParams(window.location.search);

const nomParcFicheNouvelleDate = paramsFicheParcNouvelleDate.get("nom") || "";
const departementFicheNouvelleDate = paramsFicheParcNouvelleDate.get("dptmt") || "";

const titreFicheParcNouvelleDate = document.getElementById("titre-fiche-parc-nouvelle-date");
const departementElementFicheParcNouvelleDate = document.getElementById("departement-fiche-parc-nouvelle-date");

if (titreFicheParcNouvelleDate) {
  titreFicheParcNouvelleDate.textContent = nomParcFicheNouvelleDate
    ? "Parc de " + nomParcFicheNouvelleDate
    : "Parc";
}

if (departementElementFicheParcNouvelleDate) {
  departementElementFicheParcNouvelleDate.textContent = departementFicheNouvelleDate
    ? "Département " + departementFicheNouvelleDate
    : "";
}