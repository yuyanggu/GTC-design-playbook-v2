/* ============================================================================
   Password gate — simple client-side lock.

   Runs FIRST, synchronously, in <head> (before the deferred site modules), so it
   can set window.__GTC_LOCKED__ before main.js / chapter.js boot. Those modules
   guard their boot with `if (!window.__GTC_LOCKED__)`, so while locked NOTHING
   initialises — no GSAP timelines, no ScrollSmoother, no load animation running
   behind the overlay. On a correct password we save a flag and RELOAD, so the
   site initialises fresh and animates from the start once unlocked.

   NOTE: this is a soft gate, not real security — the password lives in this file
   and anyone can read it. It only keeps casual visitors out.
   ========================================================================== */
(function () {
  var KEY = "gtc-auth";
  var PASS = "gtcdesign";

  var authed = false;
  try { authed = localStorage.getItem(KEY) === "1"; } catch (e) { /* storage blocked */ }

  // The flag the site modules read. true → they skip their boot.
  window.__GTC_LOCKED__ = !authed;
  if (authed) return;

  // Hide the page behind the gate from first paint (class drives CSS in styles.css).
  document.documentElement.classList.add("gtc-locked");

  function build() {
    if (document.querySelector(".gtc-gate")) return;
    var gate = document.createElement("div");
    gate.className = "gtc-gate";
    gate.innerHTML =
      '<form class="gtc-gate__card" autocomplete="off" novalidate>' +
        '<p class="gtc-gate__eyebrow">GovTech Consulting</p>' +
        '<h1 class="gtc-gate__title">The Design Playbook</h1>' +
        '<p class="gtc-gate__hint">Enter the password to continue.</p>' +
        '<div class="gtc-gate__row">' +
          '<input class="gtc-gate__input" type="password" name="pw" aria-label="Password" placeholder="Password" />' +
          '<button class="gtc-gate__btn" type="submit">Enter</button>' +
        '</div>' +
        '<p class="gtc-gate__error" role="alert" hidden>Incorrect password. Try again.</p>' +
      '</form>';
    document.body.appendChild(gate);

    var form = gate.querySelector("form");
    var input = gate.querySelector(".gtc-gate__input");
    var err = gate.querySelector(".gtc-gate__error");
    input.focus();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value === PASS) {
        try { localStorage.setItem(KEY, "1"); } catch (e2) { /* storage blocked */ }
        window.location.reload();
      } else {
        err.hidden = false;
        gate.classList.add("gtc-gate--shake");
        input.value = "";
        input.focus();
        setTimeout(function () { gate.classList.remove("gtc-gate--shake"); }, 450);
      }
    });
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
