(function () {
  // Email: assembled here so the address is not sitting in the HTML for scrapers.
  var link = document.querySelector(".email");
  if (link) {
    var address = link.getAttribute("data-user") + "@" + link.getAttribute("data-domain");
    link.textContent = address;
    link.href = "mailto:" + address;

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

  // Colophon clock: local time in Argentina next to the visitor's own time, plus how much our
  // working days (9 am to 6 pm on each side) overlap. The visitor's place comes from the browser's
  // time zone, so nothing is looked up or sent anywhere. Unknown zones fall back to New York.
  var clock = document.getElementById("clock");
  if (clock && window.Intl) {
    var AR = "America/Argentina/Cordoba";
    var NY = "America/New_York";
    var visitor;
    try { visitor = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    var guessed = !visitor || !/\//.test(visitor) || /^Etc\//.test(visitor);
    if (guessed) visitor = NY;
    var inArgentina = /^America\/(Argentina\/|Buenos_Aires$|Cordoba$)/.test(visitor);

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
    var hours = function (n) { return n === 1 ? "an hour" : n + " hours"; };

    var render = function () {
      var now = new Date();
      var ar = time(AR, now);
      if (inArgentina) {
        clock.textContent = "It’s " + ar + " in Argentina.";
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

      var line = "It’s " + ar + " in Argentina and " + time(visitor, now) + " ";
      if (guessed) {
        clock.textContent = line + "in New York. My working day overlaps US Eastern time by " + hours(overlap) + ".";
        return;
      }
      line += "where you are. ";
      if (diff === 0) line += "We’re on the same clock.";
      else if (overlap >= 7) line += "Our working days overlap almost entirely.";
      else if (overlap > 0) line += "Our working days overlap by " + hours(overlap) + ".";
      else line += "Our working days don’t overlap, but I can meet early or late in my day.";
      clock.textContent = line;
    };
    render();
    setInterval(render, 30000);
  }
})();
