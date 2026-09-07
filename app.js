(function () {
  var modal = document.getElementById("trial-modal");
  if (!modal) return;

  var titleEl = document.getElementById("modal-title");
  var goBtn = modal.querySelector("[data-modal-go]");
  var lastFocused = null;

  function openModal(name, url) {
    titleEl.textContent = "Start your free 7-day trial of " + name + "?";
    goBtn.setAttribute("href", url);
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    goBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-trial]");
    if (trigger) {
      e.preventDefault();
      openModal(trigger.getAttribute("data-trial"), trigger.getAttribute("data-url"));
      return;
    }
    if (e.target.closest("[data-modal-close]")) {
      closeModal();
      return;
    }
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
})();
