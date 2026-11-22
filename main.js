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

  // Colophon clock: local time in Argentina next to New York, so US teams see the overlap.
  var clock = document.getElementById("clock");
  if (clock && window.Intl) {
    var t = function (tz) {
      return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz })
        .format(new Date()).replace(" AM", " am").replace(" PM", " pm");
    };
    var render = function () {
      clock.textContent = "It’s " + t("America/Argentina/Cordoba") + " in Argentina and " +
        t("America/New_York") + " in New York. My working day overlaps US Eastern time.";
    };
    render();
    setInterval(render, 30000);
  }
})();
