const { escape: esc } = require("lodash");

const defaultPack = {
  name: "Default",
  author: "Various Artists",
  basePath: "/resources/img",
  url: "",
  id: null,
};

/**
 * renders the header
 * @param {{page:string, fileNameMap:{[key:string]:string}, extra:{donations:{patreon:string},themes:{[key:string]:{}},packs:{}[]}, req}} options
 * @returns {string} HTML
 */
function render({ page, fileNameMap, extra, req }) {
  return /*html*/ `
<script>
  function applyProcessedTheme(processedTheme) {
    const element = document.documentElement;
    element.classList.toggle("light", processedTheme.light);
    document.querySelector('meta[name="theme-color"]').content = processedTheme.light ? "#dbdbdb" : "#282828";
    element.setAttribute("style", "");
    for (const key in processedTheme.styles) {
      element.style.setProperty(key, processedTheme.styles[key]);
    }
    document.querySelectorAll('link[rel="icon"]').forEach((favicon) => {
      if (favicon.href.match("logo_square")) {
        favicon.href = processedTheme.logoURL;
      }
    });
    document.querySelector("#enchanted-glint feImage")?.setAttribute("href", processedTheme.enchantedGlint);
  }
  {
    const processedTheme = localStorage.getItem("processedTheme");
    if (processedTheme) {
      applyProcessedTheme(JSON.parse(processedTheme));
    }
  }
</script>
<script type="module" src="/resources/js/${fileNameMap["themes"]}"></script>
<header>
  <div data-tippy-content="Supporting LGBTQ+ rights all around the year! ❤️<br><br>Click for a surprise. :)" class="pride-flag"></div>
  <script>document.querySelector(".pride-flag").classList.add(localStorage.getItem("currentFlag") ?? "logo");</script>
  <a href="/" id="site_name">SkyCrypt</a>
  <button class="social-button expander" id="info-button" aria-expanded="false">
    About
  </button>
  <div id="info-box" class="expandable">
    <div id="info_box_content">
      <p>The SkyCrypt project is maintained by boblovespi, FantasmicGalaxy, MartinNemi03, metalcupcake5 and Shiiyu. It is an open-source project. </p>
      <p>You can report bugs, suggest features, or contribute to the code on <a class="link link-github" href="https://github.com/SkyCryptWebsite/SkyCrypt" target="_blank" rel="noreferrer">GitHub</a>. It would be much appreciated!</p>
      <p>Chat: <a class="link link-discord" href="https://discord.gg/cNgADv2kEQ">discord.gg/cNgADv2kEQ</a></p>
      <p>The original project, <a href="https://sky.lea.moe">sky.lea.moe</a>, was orginally created by <a class="link link-twitter" href="https://twitter.com/LeaPhant" target="_blank" rel="noreferrer">LeaPhant</a>. Thanks for all of what you've done Lea!</p>
      <h4>Used Resources</h4>
      <ul>
        <li>Data: <a rel="noreferrer" href="https://api.hypixel.net/" target="_blank">Hypixel API</a> by <span class="name">Hypixel</span>.</li>
        <li>Animated Custom Weapons and Armors: <a rel="noreferrer" href="https://hypixel.net/threads/2138599/" target="_blank">FurfSky+</a> by <span class="name">Furf__</span>.</li>
        <li>Additional Custom Textures: <a rel="noreferrer" href="https://hypixel.net/threads/2147652/" target="_blank">Vanilla+</a> by <span class="name">TBlazeWarriorT</span>.</li>
        <li>Default Textures: <a rel="noreferrer" href="https://www.minecraft.net/" target="_blank">Minecraft</a> by <span class="name">Mojang</span>.</li>
        <li>Player Heads: <a rel="noreferrer" href="https://hypixel.net/forums/skyblock.157/" target="_blank">SkyBlock</a> by <span class="name">Hypixel</span>.</li>
        <li>Background Resource Pack: <a rel="noreferrer" href="https://www.planetminecraft.com/texture_pack/16x132-dandelion-cute-and-swirly/" target="_blank">Dandelion</a> by <span class="name">Steelfeathers</span>.</li>
        <li>Background Shaders: <a rel="noreferrer" href="https://sildurs-shaders.github.io/" target="_blank">Sildur's Vibrant Shaders</a> by <span class="name">Sildur</span>.</li>
        <li>Emojis: <a rel="noreferrer" href="https://twemoji.twitter.com/" target="_blank">Twemoji</a> by <span class="name">Twitter</span>.</li>
        <li>Skin Renderer: <a rel="noreferrer" href="https://github.com/bs-community/skinview3d/" target="_blank">skinview3d</a> by <span class="name">Blessing Skin</span>.</li>
        <li>Weight Calculations: <a rel="noreferrer" href="https://github.com/Senither/hypixel-skyblock-facade" target="_blank">Hypixel SkyBlock Facade</a>(and other cool projects) by <span class="name">Senither</span>.</li>
      </ul>
    </div>
  </div>

  <a href="/api" style="text-decoration: none;" class="social-button" id="api_button">API</a>
  ${
    "donations" in extra
      ? /*html*/ `
        <a title="Patreon" target="_blank" rel="noreferrer" href="https://patreon.com/shiiyu" class="social-button patreon">
          <span>${esc(extra.donations.patreon)} Patrons</span>
          <div class="social-icon"></div>
        </a>
      `
      : ""
  }
  <form class="lookup-player">
    <input name="ign" type="search" enterkeyhint="go" placeholder="Enter username" aria-label="username" required>
    <button type="submit">
      <svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <title>search</title>
        <path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
      </svg>
    </button>
  </form>
  <a href="https://blacklivesmatters.carrd.co/" target="_blank" rel="noreferrer" data-tippy-content="<strong>Black Lives Matter!</strong><br><br>Click for a collection of links on how to support the fight against racial inequality." class="blm-logo" aria-label="Black Lives Matter"></a>
  <button id="themes-button" class="expander" aria-expanded="false">
    <svg viewBox="0 0 24 24">
      <path fill="currentColor" d="M19,11.5C19,11.5 17,13.67 17,15A2,2 0 0,0 19,17A2,2 0 0,0 21,15C21,13.67 19,11.5 19,11.5M5.21,10L10,5.21L14.79,10M16.56,8.94L7.62,0L6.21,1.41L8.59,3.79L3.44,8.94C2.85,9.5 2.85,10.47 3.44,11.06L8.94,16.56C9.23,16.85 9.62,17 10,17C10.38,17 10.77,16.85 11.06,16.56L16.56,11.06C17.15,10.47 17.15,9.5 16.56,8.94Z" />
    </svg>
    <span>Themes</span>
  </button>
  <div id="themes-box" class="expandable list">
    ${Object.entries(extra.themes)
      .filter(([theme_id, theme]) => !theme.hidden)
      .map(([theme_id, theme]) => {
        const icon =
          "/resources/img/logo_square.svg" +
          (theme.colors?.logo?.replace("#", "?color=") ?? "") +
          (theme.light ? "&invert" : "");
        return /*html*/ `
        <label class="list-item">
          <img class="icon" src="${esc(icon)}" alt="" loading="lazy">
          <span class="name">${esc(theme.name)}</span>
          <div class="author">by <span>${esc(theme.author)}</span></div>
          <input type="radio" name="theme" value="${esc(theme_id)}">
        </label>
      `;
      })
      .join("")}
  </div>
  ${
    page != "api"
      ? /*html*/ `
        <button id="packs-button" class="expander" aria-expanded="false">
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M2,10.96C1.5,10.68 1.35,10.07 1.63,9.59L3.13,7C3.24,6.8 3.41,6.66 3.6,6.58L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.66,6.72 20.82,6.88 20.91,7.08L22.36,9.6C22.64,10.08 22.47,10.69 22,10.96L21,11.54V16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V10.96C2.7,11.13 2.32,11.14 2,10.96M12,4.15V4.15L12,10.85V10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V12.69L14,15.59C13.67,15.77 13.3,15.76 13,15.6V19.29L19,15.91M13.85,13.36L20.13,9.73L19.55,8.72L13.27,12.35L13.85,13.36Z" />
          </svg>
          <span>Packs</span>
          <script>
            if (sessionStorage.getItem("open packs")) {
              sessionStorage.removeItem("open packs");
              document.querySelector("#packs-button").setAttribute("aria-expanded", true);
            }
          </script>
        </button>
        <div id="packs-box" class="expandable list">
          ${[defaultPack, ...extra.packs]
            .filter((a) => !a.hidden)
            .map(
              (pack) => /*html*/ `
                <label class="list-item">
                  <img class="icon pack-icon" src="${esc(pack.basePath + "/pack.png")}" alt="" loading="lazy">
                  <a class="name" href="${esc(pack.url)}" target="_blank" rel="noreferrer">
                    ${esc(pack.name)}${pack.version ? /*html*/ `<small>${esc(pack.version)}</small>` : ""}
                  </a><br>
                  <div class="author">by <span>${esc(pack.author)}</span></div>
                  <button
                    name="pack"
                    value="${esc(pack.id)}"
                    ${
                      pack.disabled
                        ? `disabled title="Disabled due to unknown issues."`
                        : req.cookies.pack == pack.id
                        ? `disabled aria-selected`
                        : ""
                    }
                  ></button>
                </label>
              `
            )
            .join("")}
        </div>
      `
      : ""
  }
</header>
<noscript style="
  position: fixed;
  top: 48px;
  width: 100%;
  background-color: #000;
  color: #ff4444;
  font-size: 8vw;
  z-index: 10000;
">
  please enable JavaScript!
</noscript>
  `;
}

module.exports = {
  render,
};
