// Home headline treatments. The published one is the data-headline attribute on the <h1> in
// index.html: "classic" (plain), "ink", "trace" or "layers". The local dev dock can preview any of
// them through window.siteLede without changing that setting.
(function () {
  var h1 = document.querySelector(".lede[data-headline]");
  if (!h1) return;
  var DEPLOYED = h1.getAttribute("data-headline");
  var ORIGINAL = h1.innerHTML;
  var TEXT = h1.textContent.trim();
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SVG = "http://www.w3.org/2000/svg";
  var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  var POP = "cubic-bezier(0.34, 1.8, 0.64, 1)";

  var el = function (tag, cls, parent, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  };
  var play = function (node, frames, opts) {
    if (still.matches || !node.animate) return;
    if (!opts.fill) opts.fill = "backwards";
    node.animate(frames, opts);
  };

  // Rebuilds the headline as one span per word. Screen readers get the plain sentence from the
  // label. From the word `together` on, the words are kept on one line.
  var split = function (together) {
    h1.textContent = "";
    h1.setAttribute("aria-label", TEXT);
    var root = el("span", "", h1);
    root.setAttribute("aria-hidden", "true");
    var host = root;
    var words = TEXT.split(" ").map(function (word, i) {
      if (i) host.appendChild(document.createTextNode(" "));
      if (word === together) host = el("span", "tail", root);
      return el("span", "w", host, word);
    });
    return { root: root, words: words };
  };
  // Wraps the bare word ("interface", "API") so punctuation stays outside the effect. Returns
  // nothing if the sentence no longer has it.
  var keyWord = function (words, bare) {
    var w = words.filter(function (x) { return x.textContent.replace(/\W/g, "") === bare; })[0];
    if (!w) return null;
    var rest = w.textContent.slice(bare.length);
    w.textContent = "";
    var key = el("span", "key", w, bare);
    if (rest) w.appendChild(document.createTextNode(rest));
    return key;
  };
  var softRise = function (words) {
    words.forEach(function (w, i) {
      play(w, [
        { opacity: 0, filter: "blur(8px)", transform: "translateY(.28em)" },
        { opacity: 1, filter: "blur(0)", transform: "none" }
      ], { duration: 900, delay: 60 + i * 55, easing: EASE });
    });
  };
  // Position relative to the headline, from layout boxes, so running transforms don't skew it.
  var boxOf = function (node) {
    var x = 0, y = 0, n = node;
    while (n && n !== h1) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x, y: y, w: node.offsetWidth, h: node.offsetHeight };
  };

  var variants = {};

  /* Ink: words rise out of a mask while the stroke thickens; letters swell under the pointer. */
  variants.ink = function (signal) {
    var parts = split();
    var letters = [];
    parts.words.forEach(function (w, i) {
      var word = w.textContent;
      w.textContent = "";
      var inner = el("span", "wi", w);
      // "end to end" (words 3 to 5) is set in italic; its comma stays upright.
      var slanted = i >= 3 && i <= 5 && /^(end|to),?$/.test(word);
      var tail = slanted && /,$/.test(word) ? "," : "";
      var host = slanted ? el("em", "", inner) : inner;
      (tail ? word.slice(0, -1) : word).split("").forEach(function (c) {
        var base = slanted ? 300 : 400;
        letters.push({ node: el("span", "", host, c), base: base, now: base });
      });
      if (tail) letters.push({ node: el("span", "", inner, tail), base: 400, now: 400 });
    });

    // Each word keeps its resting width, so a heavier stroke never re-wraps the lines.
    var lock = function () {
      parts.words.forEach(function (w) { w.style.width = ""; });
      parts.words.forEach(function (w) { w.style.width = w.getBoundingClientRect().width + "px"; });
    };
    lock();

    parts.words.forEach(function (w, i) {
      play(w.firstChild, [{ transform: "translateY(112%) rotate(3deg)" }, { transform: "none" }],
        { duration: 1000, delay: 80 + i * 60, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    });
    play(parts.root, [{ fontWeight: 200 }, { fontWeight: 400 }], { duration: 1500, easing: "ease-out" });

    // One loop drives both the entrance wave (it runs end to end) and the pointer swell.
    var pointer = null, start = performance.now(), raf = 0;
    var frame = function (t) {
      var wave = (t - start - 650) / 1300; // 0..1 as the crest crosses the sentence
      var busy = false;
      var size = parseFloat(getComputedStyle(h1).fontSize);
      var centres = pointer && letters.map(function (l) {
        var r = l.node.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      });
      letters.forEach(function (l, i) {
        var add = 0;
        if (!still.matches && wave < 1.2) {
          var d = (i / letters.length - (wave * 1.3 - 0.15)) / 0.07;
          add = 220 * Math.exp(-d * d);
          busy = true;
        }
        if (centres) {
          var dx = (centres[i][0] - pointer[0]) / (size * 0.95);
          var dy = (centres[i][1] - pointer[1]) / (size * 0.75);
          add = Math.max(add, 185 * Math.exp(-(dx * dx + dy * dy)));
        }
        var target = l.base + add;
        l.now += (target - l.now) * 0.22;
        if (Math.abs(target - l.now) > 0.6) busy = true; else l.now = target;
        l.node.style.fontWeight = l.now === l.base ? "" : l.now.toFixed(0);
      });
      raf = busy ? requestAnimationFrame(frame) : 0;
    };
    var wake = function () { if (!raf) raf = requestAnimationFrame(frame); };
    var leave = function () { pointer = null; wake(); };
    wake();

    var on = { signal: signal };
    h1.addEventListener("pointermove", function (e) {
      if (still.matches) return;
      pointer = [e.clientX, e.clientY];
      wake();
    }, on);
    h1.addEventListener("pointerleave", leave, on);
    h1.addEventListener("pointercancel", leave, on);
    h1.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") leave(); }, on);

    return { relayout: lock, stop: function () { cancelAnimationFrame(raf); } };
  };

  /* Trace: a hairline from "interface" to "API", with a request going and its response back. */
  variants.trace = function (signal) {
    var parts = split("interface");
    var from = keyWord(parts.words, "interface");
    var to = keyWord(parts.words, "API");
    softRise(parts.words);
    if (!from || !to) return {};

    var svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("class", "thread");
    svg.setAttribute("aria-hidden", "true");
    h1.appendChild(svg);
    var shape = function (tag, cls, attrs) {
      var node = document.createElementNS(SVG, tag);
      node.setAttribute("class", cls);
      for (var k in attrs) node.setAttribute(k, attrs[k]);
      svg.appendChild(node);
      return node;
    };
    var base = shape("path", "base");
    // Three stacked dashes, longer and fainter, make the pulse's tail.
    var tails = [[110, 1, 0.18], [56, 1.75, 0.4], [20, 2.5, 0.9]].map(function (t) {
      return { node: shape("path", "tail", { "stroke-width": t[1], opacity: 0 }), len: t[0], alpha: t[2] };
    });
    var a = shape("circle", "node", { r: 3 });
    var b = shape("circle", "node", { r: 3 });
    var head = shape("circle", "head", { r: 2.75, opacity: 0 });
    var length = 0;

    // Underline "interface", dip under "to the", underline "API".
    var draw = function () {
      var f = boxOf(from), t = boxOf(to);
      var size = parseFloat(getComputedStyle(h1).fontSize);
      var y = f.y + f.h * 0.9, dip = size * 0.2;
      var x1 = f.x + 2, x2 = f.x + f.w, x3 = t.x + 2, x4 = t.x + t.w - 2;
      var gap = x3 - x2;
      var d = "M" + x1 + " " + y + "H" + x2 + "C" + (x2 + gap * 0.3) + " " + (y + dip) + " " +
        (x3 - gap * 0.3) + " " + (y + dip) + " " + x3 + " " + y + "H" + x4;
      [base].concat(tails.map(function (x) { return x.node; })).forEach(function (p) { p.setAttribute("d", d); });
      length = base.getTotalLength();
      a.setAttribute("cx", x1); a.setAttribute("cy", y);
      b.setAttribute("cx", x4); b.setAttribute("cy", y);
    };
    draw();

    var born = 1150;
    var dashed = length + " " + length;
    play(base, [{ strokeDasharray: dashed, strokeDashoffset: length }, { strokeDasharray: dashed, strokeDashoffset: 0 }],
      { duration: 1000, delay: born, easing: "cubic-bezier(0.65, 0, 0.35, 1)" });
    [[a, born], [b, born + 920]].forEach(function (p) {
      p[0].style.transformBox = "fill-box";
      p[0].style.transformOrigin = "center";
      play(p[0], [{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 380, delay: p[1], easing: POP });
    });

    var raf = 0, timers = [], running = false;
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    var flash = function (node, cls) {
      node.classList.add(cls);
      later(function () { node.classList.remove(cls); }, 420);
    };
    // dir 1 is the request (amber, interface to API); -1 is the response coming back (accent).
    var travel = function (dir, done) {
      svg.style.setProperty("--pulse", dir > 0 ? "var(--dust)" : "var(--accent)");
      var t0 = performance.now();
      var step = function (t) {
        var k = Math.max(0, Math.min(1, (t - t0) / 850));
        var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        var at = dir > 0 ? e * length : (1 - e) * length;
        var fade = Math.min(1, k / 0.12, (1 - k) / 0.12);
        var point = base.getPointAtLength(at);
        head.setAttribute("cx", point.x);
        head.setAttribute("cy", point.y);
        head.setAttribute("opacity", fade);
        tails.forEach(function (x) {
          var seg = Math.min(x.len, dir > 0 ? at : length - at);
          x.node.setAttribute("stroke-dasharray", Math.max(0.01, seg) + " " + length * 2);
          x.node.setAttribute("stroke-dashoffset", -(dir > 0 ? at - seg : at));
          x.node.setAttribute("opacity", x.alpha * fade);
        });
        if (k < 1) raf = requestAnimationFrame(step); else done();
      };
      raf = requestAnimationFrame(step);
    };
    var roundTrip = function () {
      if (running || still.matches) return;
      running = true;
      flash(from, "hit-out");
      travel(1, function () {
        flash(to, "hit-out");
        later(function () {
          flash(to, "hit-back");
          travel(-1, function () { flash(from, "hit-back"); running = false; });
        }, 260);
      });
    };
    later(roundTrip, born + 1150);
    var beat = setInterval(function () { if (!document.hidden) roundTrip(); }, 8000);
    [from, to].forEach(function (key) {
      key.addEventListener("pointerenter", roundTrip, { signal: signal });
      key.addEventListener("click", roundTrip, { signal: signal });
    });

    return {
      relayout: draw,
      stop: function () { cancelAnimationFrame(raf); clearInterval(beat); timers.forEach(clearTimeout); }
    };
  };

  /* Layers: "interface" gets selected like in a design tool, "API" answers like a request. */
  variants.layers = function (signal) {
    var parts = split("interface"); // one line, so the two tags never land on other text
    var ui = keyWord(parts.words, "interface");
    var api = keyWord(parts.words, "API");
    softRise(parts.words);
    if (!ui || !api) return {};

    el("span", "guide guide-x", ui);
    el("span", "guide guide-y", ui);
    var frame = el("span", "frame", ui);
    for (var i = 0; i < 4; i++) el("b", "", frame);
    var size = el("span", "tag tag-size", ui);
    var cursor = el("span", "cursor", ui);
    cursor.innerHTML = '<svg viewBox="0 0 17 17" width="17" height="17"><path d="M1.5 1.2 15 7.4 8.9 8.9 7.4 15Z"/></svg>';

    var token = el("span", "token", api);
    var status = el("span", "tag tag-status", api);
    el("i", "", status);
    // Real numbers: how long this page took to arrive (left out if slow) and the selection's size.
    var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    var ms = nav ? Math.max(1, Math.round(nav.responseEnd - nav.requestStart)) : 0;
    status.appendChild(document.createTextNode("200 OK" + (ms && ms < 1000 ? " · " + ms + " ms" : "")));
    var reply = el("span", "reply", api);
    reply.innerHTML = '{\n  <b>"role"</b>: <s>"full-stack"</s>,\n  <b>"based"</b>: <s>"Argentina"</s>,\n  <b>"remote"</b>: <s>true</s>\n}';

    // The status tag and the reply hang from the right edge of "API"; on a narrow screen they are
    // nudged back inside it.
    var layout = function () {
      size.textContent = Math.round(frame.offsetWidth) + " × " + Math.round(frame.offsetHeight);
      var anchor = api.getBoundingClientRect().right;
      [status, reply].forEach(function (node) {
        var over = 12 - (anchor - node.offsetWidth);
        node.style.marginRight = over > 0 ? -over + "px" : "";
      });
    };
    layout();

    // The cursor drags the selection open, lets go, and then the API answers.
    var dragEase = "cubic-bezier(0.65, 0, 0.35, 1)";
    var x = frame.offsetLeft, y = frame.offsetTop, w = frame.offsetWidth, h = frame.offsetHeight;
    var at = function (px, py) { return "translate(" + px + "px," + py + "px)"; };
    play(frame, [{ clipPath: "inset(-6px 100% 100% -6px)" }, { clipPath: "inset(-6px -6px -6px -6px)" }],
      { duration: 700, delay: 1200, easing: dragEase });
    frame.querySelectorAll("b").forEach(function (handle) {
      play(handle, [{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 320, delay: 1880, easing: POP });
    });
    play(cursor, [
      { opacity: 0, transform: at(x - 22, y - 16), offset: 0 },
      { opacity: 1, transform: at(x, y), offset: 0.28, easing: dragEase },
      { opacity: 1, transform: at(x + w, y + h), offset: 0.67 },
      { opacity: 1, transform: at(x + w + 4, y + h + 4), offset: 0.82 },
      { opacity: 0, transform: at(x + w + 22, y + h + 16), offset: 1 }
    ], { duration: 1800, delay: 700, fill: "both" });
    var drop = [{ opacity: 0, transform: "translateY(-5px)" }, { opacity: 1, transform: "none" }];
    play(size, drop, { duration: 420, delay: 1950, easing: EASE });
    play(token, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 650, delay: 2250, easing: EASE });
    play(status, drop, { duration: 420, delay: 2650, easing: EASE });

    // Guides on "interface", the JSON reply under "API": a mouse opens them by hovering; on touch
    // screens a tap toggles them and a tap anywhere else closes them.
    [ui, api].forEach(function (key) {
      var open = function (value) { key.classList.toggle("is-open", value); };
      key.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") open(true); }, { signal: signal });
      key.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") open(false); }, { signal: signal });
      document.addEventListener("pointerup", function (e) {
        if (e.pointerType !== "mouse") open(key.contains(e.target) && !key.classList.contains("is-open"));
      }, { signal: signal });
    });

    return { relayout: layout };
  };

  /* Switching ------------------------------------------------------------- */
  var current = DEPLOYED, running = null, abort = null, turn = 0;
  var teardown = function () {
    if (abort) abort.abort();
    if (running && running.stop) running.stop();
    running = abort = null;
    h1.className = "lede";
    h1.removeAttribute("aria-label");
    h1.innerHTML = ORIGINAL;
  };
  // Waits for both cuts of the font, so words are measured on the real letters, but never for long.
  var whenFontsReady = function (fn) {
    var done = false;
    var once = function () { if (!done) { done = true; fn(); } };
    if (!document.fonts) return once();
    Promise.all([
      document.fonts.load('400 1em "Source Serif"'),
      document.fonts.load('italic 300 1em "Source Serif"')
    ]).then(once, once);
    setTimeout(once, 800);
  };
  var set = function (name) {
    var mine = ++turn;
    teardown();
    current = variants[name] ? name : "classic";
    // The attribute drives per-treatment CSS; the root one tells the greeting how long to wait.
    h1.setAttribute("data-headline", current);
    document.documentElement.setAttribute("data-headline", current);
    if (current === "classic") return h1.classList.add("is-ready");
    whenFontsReady(function () {
      if (mine !== turn) return;
      abort = new AbortController();
      h1.classList.add("lede-" + current, "is-ready");
      running = variants[current](abort.signal);
      document.fonts && document.fonts.ready.then(relayout);
    });
  };

  var resizeTimer;
  var relayout = function () { if (running && running.relayout) running.relayout(); };
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 80);
  });

  window.siteLede = {
    deployed: variants[DEPLOYED] ? DEPLOYED : "classic",
    set: set,
    replay: function () { set(current); },
    current: function () { return current; }
  };
  set(DEPLOYED);
})();
