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

(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = document.getElementById("form-status");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "Sending…";
    status.className = "form-status";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          form.hidden = true;
          status.textContent = "Thanks! Your message is on its way — I'll get back to you soon. 💛";
          status.className = "form-status success";
          return;
        }
        return response.json().then(function (data) {
          var detail =
            data && data.errors && data.errors.map(function (err) { return err.message; }).join(", ");
          status.textContent = detail || "Something went wrong — please try emailing me directly instead.";
          status.className = "form-status error";
        });
      })
      .catch(function () {
        status.textContent = "Something went wrong — please try emailing me directly instead.";
        status.className = "form-status error";
      });
  });
})();

(function () {
  var strips = document.querySelectorAll("[data-scroll-strip]");
  if (!strips.length) return;

  Array.prototype.forEach.call(strips, function (strip) {
    var controls = strip.parentElement ? strip.parentElement.querySelectorAll(".strip-arrow") : [];
    var frame = strip.querySelector(".tape-frame");
    var step = frame ? frame.getBoundingClientRect().width : 280;

    Array.prototype.forEach.call(controls, function (btn) {
      btn.addEventListener("click", function () {
        var dir = parseInt(btn.getAttribute("data-scroll-dir"), 10) || 1;
        strip.scrollBy({ left: dir * step, behavior: "smooth" });
      });
    });

    // Native overflow-x scrolling only responds to trackpad/touch/scrollbar
    // gestures, not a mouse click-and-drag - since the container promises
    // that with its grab cursor, wire up the drag itself.
    var isDown = false;
    var dragStartX = 0;
    var scrollStartLeft = 0;

    strip.addEventListener("mousedown", function (e) {
      isDown = true;
      dragStartX = e.pageX;
      scrollStartLeft = strip.scrollLeft;
    });
    window.addEventListener("mouseup", function () {
      isDown = false;
    });
    window.addEventListener("mousemove", function (e) {
      if (!isDown) return;
      e.preventDefault();
      strip.scrollLeft = scrollStartLeft - (e.pageX - dragStartX);
    });
  });
})();
