(function () {
  // The browser bar in dark mode takes the active palette's background (see data-dark).
  var darkBar = document.querySelector('meta[name="theme-color"][media*="dark"]');
  var syncDarkBar = function () {
    var paper = getComputedStyle(document.documentElement).getPropertyValue("--d-paper").trim();
    if (darkBar && paper) darkBar.setAttribute("content", paper);
  };
  syncDarkBar();
  window.siteSyncDarkBar = syncDarkBar;

  // Email: assembled here so the address is not sitting in the HTML for scrapers.
  // Every link with data-user gets the mailto; only the contact one shows the address.
  document.querySelectorAll("a[data-user]").forEach(function (a) {
    a.href = "mailto:" + a.getAttribute("data-user") + "@" + a.getAttribute("data-domain");
  });
  var link = document.querySelector(".email");
  if (link) {
    var address = link.getAttribute("data-user") + "@" + link.getAttribute("data-domain");
    link.textContent = address;

    var btn = document.querySelector(".copy");
    if (btn && navigator.clipboard) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(address).then(function () {
          btn.setAttribute("data-state", "done");
          setTimeout(function () {
            btn.removeAttribute("data-state");
          }, 2000);
        });
      });
    }
  }

  // Time-zone line under the email: local time in Argentina next to the visitor's own time, plus how much our
  // working days (9 am to 6 pm on each side) overlap. The visitor's place comes from the browser's
  // time zone, so nothing is looked up or sent anywhere. Unknown zones fall back to New York.
  var clock = document.getElementById("clock");
  var clockText = clock && clock.querySelector(".clock-text");
  if (clockText && window.Intl) {
    var AR = "America/Argentina/Cordoba";
    var NY = "America/New_York";
    var browserZone;
    try { browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    // The dev dock (dev.js, local only) can set window.siteDev.tz / .now to try other states.
    var dev = function () { return window.siteDev || {}; };

    var time = function (tz, now) {
      return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz })
        .format(now).replace(" AM", " am").replace(" PM", " pm");
    };
    // Offset from UTC in hours, read from the formatted wall-clock time (handles DST).
    var offset = function (tz, now) {
      var parts = {};
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric"
      }).formatToParts(now).forEach(function (p) { parts[p.type] = +p.value; });
      var wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute);
      return Math.round((wall - now.getTime()) / 900000) / 4;
    };
    var hours = function (n) { return n + (n === 1 ? " hour" : " hours"); };

    // The line animates in word by word (see styles.css) when it first appears, and again only if
    // the visitor's zone changes (the dev dock). The minute ticking over just swaps the text.
    var shownZone, shownLine;
    var show = function (line, zone) {
      if (zone === shownZone && line === shownLine) return; // leaves a running animation alone
      // Words stay wrapped either way (the hover blur needs them); is-still skips the entrance.
      clockText.classList.toggle("is-still", zone === shownZone);
      clockText.textContent = "";
      line.split(" ").forEach(function (word, i) {
        var span = document.createElement("span");
        span.className = "word";
        span.style.setProperty("--i", i);
        span.textContent = word;
        if (i) clockText.appendChild(document.createTextNode(" "));
        clockText.appendChild(span);
      });
      shownZone = zone;
      shownLine = line;
      clockText.classList.add("is-ready");
    };

    var render = function () {
      var now = dev().now ? new Date(dev().now) : new Date();
      var visitor = dev().tz || browserZone;
      var guessed = !visitor || !/\//.test(visitor) || /^Etc\//.test(visitor);
      if (guessed) visitor = NY;
      var inArgentina = /^America\/(Argentina\/|Buenos_Aires$|Cordoba$)/.test(visitor);
      var ar = time(AR, now);
      if (inArgentina) {
        show("Hi, fellow Argentine 🇦🇷", visitor);
        return;
      }
      var diff = offset(visitor, now) - offset(AR, now); // visitor minus Argentina
      // Overlap of two 9-to-18 days shifted by diff hours (checked across midnight too).
      var overlap = 0;
      [-24, 0, 24].forEach(function (d) {
        var s = Math.max(9, 9 - diff + d), e = Math.min(18, 18 - diff + d);
        overlap = Math.max(overlap, e - s);
      });
      overlap = Math.floor(overlap);

      // The visitor already knows their own time, so only an unknown zone names New York's.
      var line = "It’s " + ar + " in Argentina";
      if (guessed) line += ", " + time(NY, now) + " in New York. " + hours(overlap) + " of working overlap.";
      else if (diff === 0) line += ", same as you.";
      else if (overlap > 0) line += ". We have " + hours(overlap) + " of working overlap.";
      else line += ". I can meet off-hours.";
      show(line, visitor);
    };
    render();
    setInterval(render, 30000);
    window.siteRenderClock = render;
  }

  // Reveal (the time-zone line and the footer invitation). With a mouse it works in two steps, on the
  // whole 64px-tall box: passing over it only peeks (nothing moves), and staying opens it, so the
  // text slides right to make room for the avatar, over a trail of amber dust. On touch screens a
  // tap on the text opens it right away.
  var DWELL = 400; // ms the mouse has to stay before it opens
  var LINGER = 220; // ms it stays open after the mouse leaves, so slipping off the edge is forgiven
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Wraps each word of fixed text in a .word span for the blur. A link stays whole, as one piece,
  // so it keeps its underline; punctuation right after it never wraps onto the next line.
  var wrapWords = function (text) {
    var nodes = Array.prototype.slice.call(text.childNodes);
    text.textContent = "";
    var last = null; // the last piece added with no space after it
    var add = function (piece) {
      if (!last) text.appendChild(piece);
      else {
        var glued = document.createElement("span");
        glued.className = "glued";
        text.replaceChild(glued, last);
        glued.appendChild(last);
        glued.appendChild(piece);
        piece = glued;
      }
      last = piece;
    };
    nodes.forEach(function (node) {
      if (node.nodeType !== 3) {
        node.classList.add("word");
        add(node);
        return;
      }
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          text.appendChild(document.createTextNode(" "));
          last = null;
          return;
        }
        var span = document.createElement("span");
        span.className = "word";
        span.textContent = part;
        add(span);
      });
    });
  };

  var reveal = function (box) {
    var text = box.querySelector(".reveal-text");
    if (!text) return;

    // While the line slides, each word blurs and comes back into focus, left to right, like the
    // greeting's entrance. Done with element.animate so it never restarts that CSS animation.
    var blurWords = function () {
      var words = text.querySelectorAll(".word");
      if (still.matches || !text.animate) return;
      var entering = Array.prototype.some.call(words, function (w) {
        return w.getAnimations().some(function (a) {
          return a.animationName === "word-in" && a.playState !== "finished";
        });
      });
      if (entering) return;
      var stagger = Math.min(35, 240 / words.length);
      words.forEach(function (word, i) {
        word.getAnimations().forEach(function (a) { a.cancel(); });
        word.animate([
          { filter: "blur(0)", opacity: 1, transform: "none" },
          { filter: "blur(4px)", opacity: 0.35, transform: "translateY(0.12em)", offset: 0.35 },
          { filter: "blur(0)", opacity: 1, transform: "none" }
        ], { duration: 520, delay: i * stagger, easing: "ease-out" });
      });
    };

    // Amber fairy dust behind the box: a few specks along a soft wave, lighting up left to right.
    var dust = document.createElement("span");
    dust.className = "reveal-dust";
    dust.setAttribute("aria-hidden", "true");
    var SPECKS = 22;
    for (var n = 0; n < SPECKS; n++) {
      var t = (n + Math.random()) / SPECKS; // evenly spread, with jitter
      var speck = document.createElement("i");
      if (n % 7 === 3) speck.className = "spark";
      speck.style.left = (10 + t * 88) + "%";
      speck.style.top = "calc(50% + " + Math.round(Math.sin(t * Math.PI * 2.2) * 9 + (Math.random() - 0.5) * 26) + "px)";
      speck.style.setProperty("--size", (1.5 + Math.random() * 1.5).toFixed(1) + "px");
      speck.style.setProperty("--delay", Math.round(t * 700 + Math.random() * 150) + "ms");
      speck.style.setProperty("--time", Math.round(1800 + Math.random() * 1400) + "ms");
      dust.appendChild(speck);
    }
    box.insertBefore(dust, box.firstChild);

    // The peek: the words light up in a quick left-to-right wave, in place.
    var peekWave = function () {
      var words = text.querySelectorAll(".word");
      if (still.matches || !text.animate) return;
      var ink = getComputedStyle(box).getPropertyValue("--ink").trim();
      var stagger = Math.min(40, 260 / words.length);
      words.forEach(function (word, i) {
        // Not while the greeting's entrance is still running on it.
        if (word.getAnimations().some(function (a) { return a.animationName === "word-in" && a.playState !== "finished"; })) return;
        word.animate([{ color: ink, offset: 0.4 }], { duration: 460, delay: i * stagger, easing: "ease-in-out" });
      });
    };

    var dustTimer;
    var setOpen = function (open) {
      if (open === box.classList.contains("is-open")) return;
      box.classList.toggle("is-open", open);
      blurWords();
      // has-dust outlives is-open for a moment, so the specks fade out instead of vanishing.
      clearTimeout(dustTimer);
      if (open) box.classList.add("has-dust");
      else dustTimer = setTimeout(function () { box.classList.remove("has-dust"); }, 400);
    };
    var openTimer, closeTimer;
    var isOpen = function () { return box.classList.contains("is-open"); };
    var arm = function () {
      clearTimeout(openTimer);
      openTimer = setTimeout(function () {
        box.classList.remove("is-peek");
        setOpen(true);
      }, DWELL);
    };
    box.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      clearTimeout(closeTimer);
      if (isOpen()) return;
      box.classList.add("is-peek");
      peekWave();
      if (!e.target.closest("a")) arm();
    });
    box.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "mouse") return;
      clearTimeout(openTimer);
      box.classList.remove("is-peek");
      if (isOpen()) closeTimer = setTimeout(function () { setOpen(false); }, LINGER);
    });
    // While the mouse is on a link the box doesn't open, so the link never slides from under it.
    text.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "mouse") clearTimeout(openTimer);
      });
      a.addEventListener("pointerleave", function (e) {
        if (e.pointerType === "mouse" && box.classList.contains("is-peek")) arm();
      });
    });
    // A scroll gesture never fires pointerup. A tap on a link just follows the link.
    document.addEventListener("pointerup", function (e) {
      if (e.pointerType === "mouse") return;
      var inText = text.contains(e.target);
      if (inText && e.target.closest("a")) return;
      setOpen(inText && !box.classList.contains("is-open"));
    });
  };
  var invite = document.querySelector(".invite .reveal-text");
  if (invite) wrapWords(invite);
  document.querySelectorAll(".reveal").forEach(reveal);

  // Dev dock: only on a local preview, never on the live site (dev.js is not deployed either).
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    var s = document.createElement("script");
    s.src = "/dev.js";
    document.body.appendChild(s);
  }
})();
