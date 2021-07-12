/**
 * renders the footer
 * @param {{page:string, fileHashes:{css:{[key:string]:string}}, extra:{isFoolsDay:boolean}}} options
 * @returns {string} HTML
 */
function render({ page, fileHashes, extra }) {
  return /*html*/ `
<script src="https://unpkg.com/popper.js@1"></script>
<script src="https://unpkg.com/tippy.js@5"></script>
<script src="https://twemoji.maxcdn.com/v/latest/twemoji.min.js" crossorigin="anonymous"></script>
<script async src="https://arc.io/widget.min.js#oNMq8LVU"></script>

<script>
  window.addEventListener('load', (event) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {scope: '/'})
      .then((reg) => {
        // registration worked
        console.log('Registration succeeded. Scope is ' + reg.scope);
      }).catch((error) => {
        // registration failed
        console.log('Registration failed with ' + error);
      });
    }
  });
</script>

${
  extra.isFoolsDay
    ? /*html*/ `
    <style>
      #player_model {
        transform: scaleY(-1);
      }
      .profile-avatar {
        transition: transform 0.2s ease-in-out;
      }
      :hover > .profile-avatar {
        transform: rotate(180deg);
      }
    </style>
  `
    : ""
}

${page == "api" ? /*html*/ `<link rel="stylesheet" href="/resources/css/api.css?${fileHashes.css["api.css"]}">` : ""}
  `;
}

module.exports = {
  render,
};
