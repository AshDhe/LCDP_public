(() => {
  "use strict";

  const BALISES_AUTORISEES = new Set([
    "P",
    "BR",
    "STRONG",
    "EM",
    "UL",
    "OL",
    "LI",
    "A"
  ]);

  const SELECTEUR_DANGEREUX = [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "svg",
    "math",
    "form",
    "input",
    "button",
    "textarea",
    "select",
    "template"
  ].join(",");

  function nettoyerHtml(htmlBrut) {
    const template = document.createElement("template");
    template.innerHTML = String(htmlBrut || "");

    template.content
      .querySelectorAll(SELECTEUR_DANGEREUX)
      .forEach((element) => element.remove());

    Array.from(template.content.querySelectorAll("div"))
      .reverse()
      .forEach((element) => {
        const contientBloc = Array.from(element.children)
          .some((enfant) => {
            return ["P", "UL", "OL"].includes(enfant.tagName);
          });

        if (contientBloc) {
          element.replaceWith(...element.childNodes);
          return;
        }

        const paragraphe = document.createElement("p");

        while (element.firstChild) {
          paragraphe.appendChild(element.firstChild);
        }

        element.replaceWith(paragraphe);
      });

    Array.from(template.content.querySelectorAll("*")).forEach((element) => {
      if (!BALISES_AUTORISEES.has(element.tagName)) {
        element.replaceWith(...element.childNodes);
        return;
      }

      Array.from(element.attributes).forEach((attribut) => {
        const nom = attribut.name.toLowerCase();

        if (
          element.tagName === "BR" &&
          nom === "data-lcdp-soft-break" &&
          attribut.value === "true"
        ) {
          return;
        }

        if (
          element.tagName === "A" &&
          (nom === "href" || nom === "data-site-href")
        ) {
          const url = normaliserUrlLien(attribut.value);

          if (url) {
            element.setAttribute(attribut.name, url);
          } else {
            element.removeAttribute(attribut.name);
          }

          return;
        }

        if (
          element.tagName === "A" &&
          nom === "class" &&
          attribut.value === "lcdp-link-secondary"
        ) {
          return;
        }

        element.removeAttribute(attribut.name);
      });
    });

    return normaliserParagraphesHtml(template.innerHTML)
      .replace(/<p>(?:\s|&nbsp;|<br(?:\s[^>]*)?>)*<\/p>/gi, "")
      .trim();
  }

  function normaliserParagraphesHtml(html) {
    const tokens = String(html || "").match(
      /<[^>]+>|[^<]+/g
    ) || [];
    const pileInline = [];
    const resultat = [];
    let dansParagraphe = false;
    let profondeurListe = 0;

    function ouvrirParagraphe() {
      if (dansParagraphe) return;
      resultat.push("<p>");
      dansParagraphe = true;
    }

    function fermerParagraphe() {
      if (!dansParagraphe) return;

      fermerInlineOuverts(resultat, pileInline);
      resultat.push("</p>");
      dansParagraphe = false;
    }

    function scinderParagraphe() {
      if (!dansParagraphe) return;

      const inlineAReouvrir = pileInline.slice();
      fermerInlineOuverts(resultat, pileInline);
      resultat.push("</p><p>");

      inlineAReouvrir.forEach((inline) => {
        resultat.push(inline.ouverture);
        pileInline.push(inline);
      });
    }

    tokens.forEach((token) => {
      const balise = token.match(
        /^<\/?([a-z0-9]+)\b[^>]*>$/i
      );

      if (!balise) {
        if (profondeurListe > 0) {
          resultat.push(token);
          return;
        }

        if (
          dansParagraphe ||
          String(token).replace(/&nbsp;/gi, " ").trim()
        ) {
          ouvrirParagraphe();
          resultat.push(token);
        }

        return;
      }

      const nom = String(balise[1] || "").toLowerCase();
      const fermeture = /^<\//.test(token);

      if (nom === "ul" || nom === "ol") {
        if (fermeture) {
          resultat.push(token);
          profondeurListe = Math.max(0, profondeurListe - 1);
        } else {
          fermerParagraphe();
          resultat.push(token);
          profondeurListe += 1;
        }

        return;
      }

      if (profondeurListe > 0) {
        resultat.push(token);
        return;
      }

      if (nom === "p") {
        if (fermeture) {
          fermerParagraphe();
        } else {
          fermerParagraphe();
          ouvrirParagraphe();
        }

        return;
      }

      if (nom === "br") {
        const sautSouple = /\bdata-lcdp-soft-break\s*=\s*["']true["']/i
          .test(token);

        if (sautSouple) {
          ouvrirParagraphe();
          resultat.push('<br data-lcdp-soft-break="true">');
        } else {
          scinderParagraphe();
        }

        return;
      }

      if (["strong", "em", "a"].includes(nom)) {
        if (fermeture) {
          if (!dansParagraphe) return;

          resultat.push("</" + nom + ">");

          for (let index = pileInline.length - 1; index >= 0; index -= 1) {
            if (pileInline[index].nom === nom) {
              pileInline.splice(index, 1);
              break;
            }
          }
        } else {
          ouvrirParagraphe();
          resultat.push(token);
          pileInline.push({
            nom,
            ouverture: token
          });
        }

        return;
      }

      resultat.push(token);
    });

    fermerParagraphe();

    return resultat.join("");
  }

  function fermerInlineOuverts(resultat, pileInline) {
    for (let index = pileInline.length - 1; index >= 0; index -= 1) {
      resultat.push("</" + pileInline[index].nom + ">");
    }

    pileInline.length = 0;
  }

  function normaliserUrlLien(value) {
    const url = String(value || "").trim();

    if (!url || url.startsWith("//")) return "";

    const compact = url
      .replace(/[\u0000-\u0020\u007f]+/g, "")
      .toLowerCase();

    return (
      compact.startsWith("http://") ||
      compact.startsWith("https://") ||
      compact.startsWith("mailto:") ||
      compact.startsWith("tel:") ||
      compact.startsWith("/") ||
      compact.startsWith("#") ||
      compact.startsWith("../") ||
      compact.startsWith("./")
    ) ? url : "";
  }

  window.LCDP_DOCUMENTS_LEGAUX = Object.freeze({
    nettoyerHtml
  });
})();
