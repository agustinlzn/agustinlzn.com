// Vercel build step (see vercel.json): stamps the deploy month and year into index.html, so the
// footer's "Updated Nov 2026" follows the last deploy. Locally the committed date is shown.
var fs = require("fs");
var parts = {};
new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Cordoba", year: "numeric", month: "short" })
  .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
var monthNumber = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Cordoba", month: "2-digit" })
  .format(new Date());
var stamp = '<time id="updated" datetime="' + parts.year + "-" + monthNumber + '">' + parts.month + " " + parts.year + "</time>";

var html = fs.readFileSync("index.html", "utf8");
var pattern = /<time id="updated" datetime="[^"]*">[^<]*<\/time>/;
if (!pattern.test(html)) throw new Error("build.js: <time id=\"updated\"> not found in index.html");
fs.writeFileSync("index.html", html.replace(pattern, stamp));
console.log("Stamped " + stamp);
