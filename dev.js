// Dev dock: a small panel for trying the page in different states on a local preview.
// main.js loads this file only on localhost, and .vercelignore keeps it off the live site.
// Settings persist in localStorage, so they survive reloads; "Reset" clears them.
(function () {
  var KEY = "siteDev";
  var ZONES = [
    ["", "Browser (actual)"],
    ["America/Argentina/Buenos_Aires", "Buenos Aires"],
    ["America/Sao_Paulo", "São Paulo (same offset)"],
    ["America/New_York", "New York"],
    ["America/Chicago", "Chicago"],
    ["America/Los_Angeles", "Los Angeles"],
    ["America/Mexico_City", "Mexico City"],
    ["Europe/London", "London"],
    ["Europe/Madrid", "Madrid"],
    ["Asia/Kolkata", "Kolkata"],
    ["Asia/Tokyo", "Tokyo"],
    ["Australia/Sydney", "Sydney"],
    ["UTC", "UTC (unknown zone, falls back to New York)"]
  ];
  // Fixed moments at 3 pm Argentina time (18:00 UTC), to check daylight-saving differences.
  var DATES = [
    ["", "Live"],
    ["2026-01-15T18:00:00Z", "Jan 15, 3 pm AR (northern winter)"],
    ["2026-07-15T18:00:00Z", "Jul 15, 3 pm AR (northern summer)"]
  ];

  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  var copyBtn = document.querySelector(".copy");
  var copyWasShown = copyBtn && !copyBtn.hidden;

  var apply = function () {
    var root = document.documentElement;
    if (state.theme) root.setAttribute("data-theme", state.theme);
    else root.removeAttribute("data-theme");

    window.siteDev = { tz: state.tz || "", now: state.now || "" };
    if (window.siteRenderClock) window.siteRenderClock();

    if (copyBtn && copyWasShown) copyBtn.hidden = !!state.noClipboard;
  };

  var css = [
    ".devdock{position:fixed;right:16px;bottom:16px;z-index:1000;font:13px/1.4 system-ui,-apple-system,sans-serif;color:var(--ink);",
    "background:var(--paper);border:1px solid var(--rule);border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);max-width:calc(100vw - 32px)}",
    ".devdock summary{cursor:pointer;padding:6px 12px;font-weight:600;list-style:none;user-select:none}",
    ".devdock summary::-webkit-details-marker{display:none}",
    ".devdock[open] summary{border-bottom:1px solid var(--rule)}",
    ".devdock .body{display:grid;gap:10px;padding:12px;width:280px;max-width:100%}",
    ".devdock label,.devdock .field{display:grid;gap:4px;color:var(--muted)}",
    ".devdock select,.devdock button{font:inherit;color:var(--ink);background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:4px 6px}",
    ".devdock button{cursor:pointer}",
    ".devdock .body>*,.devdock label>*{min-width:0}",
    ".devdock select{width:100%}",
    ".devdock .seg{display:flex;gap:0}",
    ".devdock .seg button{flex:1;border-radius:0}",
    ".devdock .seg button:first-child{border-radius:6px 0 0 6px}",
    ".devdock .seg button:last-child{border-radius:0 6px 6px 0}",
    ".devdock .seg button+button{border-left:0}",
    ".devdock .seg button[aria-pressed=true]{background:var(--ink);color:var(--paper)}",
    ".devdock .check{display:flex;align-items:center;gap:6px;color:var(--ink)}",
    ".devdock .row{display:flex;gap:8px}",
    ".devdock .row button{flex:1}"
  ].join("");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var options = function (list, value) {
    return list.map(function (o) {
      return '<option value="' + o[0] + '"' + (o[0] === (value || "") ? " selected" : "") + ">" + o[1] + "</option>";
    }).join("");
  };

  var dock = document.createElement("details");
  dock.className = "devdock";
  dock.open = state.open !== false;
  dock.innerHTML =
    "<summary>Dev</summary>" +
    '<div class="body">' +
    '<div class="field"><span>Theme</span><span class="seg" role="group" aria-label="Theme">' +
    '<button type="button" data-theme="">System</button>' +
    '<button type="button" data-theme="light">Light</button>' +
    '<button type="button" data-theme="dark">Dark</button></span></div>' +
    '<label>Visitor time zone<select name="tz">' + options(ZONES, state.tz) + "</select></label>" +
    '<label>Date and time<select name="now">' + options(DATES, state.now) + "</select></label>" +
    '<span class="check"><input type="checkbox" id="devdock-clip"' + (state.noClipboard ? " checked" : "") +
    '><label for="devdock-clip" style="display:inline;color:inherit">No clipboard (hides Copy)</label></span>' +
    '<span class="row"><button type="button" data-act="footer">Go to footer</button>' +
    '<button type="button" data-act="reset">Reset</button></span>' +
    "</div>";
  document.body.appendChild(dock);

  var themeButtons = dock.querySelectorAll("[data-theme]");
  var syncTheme = function () {
    themeButtons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-theme") === (state.theme || "")));
    });
  };
  themeButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      state.theme = b.getAttribute("data-theme");
      save(); syncTheme(); apply();
    });
  });

  dock.querySelector("[name=tz]").addEventListener("change", function (e) {
    state.tz = e.target.value; save(); apply();
  });
  dock.querySelector("[name=now]").addEventListener("change", function (e) {
    state.now = e.target.value; save(); apply();
  });
  dock.querySelector("#devdock-clip").addEventListener("change", function (e) {
    state.noClipboard = e.target.checked; save(); apply();
  });
  dock.querySelector("[data-act=footer]").addEventListener("click", function () {
    document.querySelector(".colophon").scrollIntoView({ behavior: "smooth" });
  });
  dock.querySelector("[data-act=reset]").addEventListener("click", function () {
    state = { open: true };
    save();
    dock.querySelector("[name=tz]").value = "";
    dock.querySelector("[name=now]").value = "";
    dock.querySelector("#devdock-clip").checked = false;
    syncTheme(); apply();
  });
  dock.addEventListener("toggle", function () { state.open = dock.open; save(); });

  syncTheme();
  apply();
})();
