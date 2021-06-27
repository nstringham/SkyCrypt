const { escape } = require("lodash");

const patrons = ["Who knows?"];

/**
 * renders a list of patreon links
 * @param {string[]} patrons
 * @returns {string} HTML
 */
function render(patrons) {
  return patrons
    .map((patron) => {
      return /*html*/ `
        <a href="/stats/${escape(patron)}">
          <span class="patron piece-legendary-fg">${escape(patron)}</span>
        </a>
      `;
    })
    .join(", ");
}

module.exports = {
  patrons,
  render,
};
