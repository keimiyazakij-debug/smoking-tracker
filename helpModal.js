(function () {
  let modalEl;
  let openBtnEl;
  let closeBtnEl;

  function getElements() {
    modalEl = modalEl || document.getElementById("helpModal");
    openBtnEl = openBtnEl || document.getElementById("openHelpBtn");
    closeBtnEl = closeBtnEl || document.getElementById("closeHelpBtn");
    return !!(modalEl && openBtnEl && closeBtnEl);
  }

  function showHelp() {
    if (!getElements()) return;
    modalEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      modalEl.classList.add("visible");
    });
    document.body.style.overflow = "hidden";
  }

  function hideHelp() {
    if (!getElements()) return;
    modalEl.classList.remove("visible");
    window.setTimeout(() => {
      modalEl.classList.add("hidden");
    }, 200);
    document.body.style.overflow = "";
  }

  function bind() {
    if (!getElements()) return;
    openBtnEl.addEventListener("click", showHelp);
    closeBtnEl.addEventListener("click", hideHelp);
    modalEl.addEventListener("click", (event) => {
      if (event.target === modalEl) {
        hideHelp();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }

  window.showHelp = showHelp;
  window.hideHelp = hideHelp;
  window.helpModal = {
    showHelp,
    hideHelp
  };
})();
