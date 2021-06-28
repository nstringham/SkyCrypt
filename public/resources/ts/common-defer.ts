interface Window {
  tippy: any;
}

function validateURL(url: string) {
  const urlSegments = url.trim().split("/");
  if (urlSegments.length < 1) {
    throw "please enter a Minecraft username or UUID";
  } else if (urlSegments.length > 2) {
    throw `"${url}" has too many "/"`;
  } else {
    if (urlSegments.length === 2) {
      if (urlSegments[1].match(/^[A-Za-z]+/)) {
        urlSegments[1] = urlSegments[1].charAt(0).toUpperCase() + urlSegments[1].substr(1).toLowerCase();
      } else if (!urlSegments[1].match(/^([0-9a-fA-F]{32})$/)) {
        throw `"${urlSegments[1]}" is not a valid profile name or ID`;
      }
    }
    if (
      urlSegments[0].match(
        /^([0-9a-fA-F]{8})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{12})$/
      )
    ) {
      urlSegments[0] = urlSegments[0].replaceAll("-", "");
    } else if (urlSegments[0].match(/^[\w ]{1,16}$/)) {
      urlSegments[0] = urlSegments[0].replace(" ", "_");
    } else {
      throw `"${urlSegments[0]}" is not a valid username or UUID`;
    }
    return "/stats/" + urlSegments.join("/");
  }
}

document.querySelectorAll<HTMLFormElement>(".lookup-player").forEach((form) => {
  form.addEventListener("submit", (submitEvent: Event) => {
    submitEvent.preventDefault();
    const formData = new FormData(form);
    try {
      window.location.href = validateURL(formData.get("ign") as string);
    } catch (error) {
      const errorTip = window.tippy(form.querySelector("input") as HTMLInputElement, {
        trigger: "manual",
        content: error || "please enter a valid Minecraft username or UUID",
      });
      errorTip.show();
      setTimeout(() => {
        errorTip.hide();
        setTimeout(() => {
          errorTip.destroy();
        }, 500);
      }, 1500);
    }
  });
});

function setCookie(name: string, value: string, days?: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; SameSite=Lax; path=/";
}

function eraseCookie(name: string) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

const expanders = document.querySelectorAll(".expander");
for (const expander of expanders) {
  expander.addEventListener("click", () => {
    for (const otherExpander of expanders) {
      if (otherExpander != expander) {
        otherExpander.setAttribute("aria-expanded", "false");
      }
    }
    expander.setAttribute("aria-expanded", (expander.getAttribute("aria-expanded") != "true").toString());
  });
  const focusOutHandler = () => {
    setTimeout(() => {
      if (
        document.activeElement != document.body &&
        document.activeElement != expander &&
        !expander.nextElementSibling?.contains(document.activeElement)
      ) {
        expander.setAttribute("aria-expanded", "false");
      }
    });
  };
  expander.addEventListener("focusout", focusOutHandler);
  expander.nextElementSibling?.addEventListener("focusout", focusOutHandler);
}

document.querySelectorAll<HTMLButtonElement>('#packs-box button[name="pack"]').forEach((element) => {
  element.addEventListener("click", (event) => {
    const clickedButton = event.target as HTMLButtonElement;
    const newPack = clickedButton.value;
    if (newPack) {
      setCookie("pack", newPack, 365);
    } else {
      eraseCookie("pack");
    }

    const oldElement = document.querySelector<HTMLButtonElement>(`#packs-box button[name="pack"][aria-selected]`);
    oldElement?.removeAttribute("disabled");
    oldElement?.removeAttribute("aria-selected");

    if (page == "stats") {
      clickedButton.classList.add("loading");
      sessionStorage.setItem("open packs", "true");
      window.location.reload();
    } else {
      clickedButton.setAttribute("aria-selected", "");
      clickedButton.setAttribute("disabled", "");
    }
  });
});

document.querySelector("#themes-box")?.addEventListener("change", (event) => {
  const newTheme = (event.target as HTMLInputElement).value;
  localStorage.setItem("currentTheme", newTheme);
  loadTheme(newTheme);
});

window.addEventListener("storage", (event) => {
  if (event.key === "currentTheme" && event.newValue != null) {
    setCheckedTheme(event.newValue);
    loadTheme(event.newValue);
  }
});

function setCheckedTheme(theme: string) {
  const checkbox = document.querySelector<HTMLInputElement>(`#themes-box input[value="${theme}"]`);
  if (checkbox == null) {
    throw new Error("no checkbox for theme : " + theme);
  }
  checkbox.checked = true;
}

setCheckedTheme(localStorage.getItem("currentTheme") ?? "default");

window.tippy("*[data-tippy-content]", {
  boundary: "window",
});

const prideFlag = document.querySelector(".pride-flag") as HTMLElement;
const prideFlags = ["rainbow", "trans", "lesbian", "bi", "pan", "nb", "ace", "genderfluid", "logo"];

let currentFlag = prideFlags.length - 1;

const currentFlagString = localStorage.getItem("currentFlag");
if (currentFlagString) {
  currentFlag = parseInt(currentFlagString);
  prideFlag.className = "pride-flag " + prideFlags[currentFlag];
}

prideFlag.addEventListener("click", function () {
  currentFlag++;

  if (currentFlag > prideFlags.length - 1) currentFlag = 0;

  localStorage.setItem("currentFlag", currentFlag.toString());
  prideFlag.className = "pride-flag " + prideFlags[currentFlag];
});
