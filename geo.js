/* MarKey geo targeting + lead source tracking.
   1. Picks the visitor's state: ?state=ga|fl|tx|tn in the URL, then a saved choice (7 days),
      then an approximate IP lookup. Only GA, FL, TX and TN change the page.
   2. Swaps marked elements:
        data-geo-name            -> state name ("Texas")
        data-geo-text="...{state}..." -> text with {state} filled in
        data-geo-href="hub|foreclosure|behind|taxliens|code|title|inherited|auction" -> link to that state's page
        data-geo-show            -> shown only once a state is known (hidden attribute removed)
        data-geo-card="GA"       -> gets class "geo-match" when it is the visitor's state
   3. Adds hidden fields to every lead form: page, visitor state, UTM tags, gclid. */
(function () {
  var STATES = {
    GA: { name: "Georgia", slug: "georgia" },
    FL: { name: "Florida", slug: "florida" },
    TX: { name: "Texas", slug: "texas" },
    TN: { name: "Tennessee", slug: "tennessee" }
  };
  var PAGES = {
    hub: "we-buy-houses-", foreclosure: "stop-foreclosure-", behind: "behind-on-mortgage-payments-",
    taxliens: "sell-house-with-tax-liens-", code: "sell-house-with-code-violations-",
    title: "sell-house-with-title-problems-", inherited: "sell-inherited-house-", auction: "house-going-to-auction-"
  };
  var KEY = "mk_state", DAYS = 7;
  var params = new URLSearchParams(location.search);

  function save(code) {
    try { localStorage.setItem(KEY, JSON.stringify({ c: code, t: Date.now() })); } catch (e) {}
  }
  function saved() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && STATES[v.c] && Date.now() - v.t < DAYS * 864e5) return v.c;
    } catch (e) {}
    return null;
  }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  function apply(code) {
    var s = STATES[code]; if (!s) return;
    document.documentElement.setAttribute("data-state", code);
    each("[data-geo-name]", function (el) { el.textContent = s.name; });
    each("[data-geo-text]", function (el) { el.textContent = el.getAttribute("data-geo-text").replace(/\{state\}/g, s.name); });
    each("[data-geo-href]", function (el) {
      var p = PAGES[el.getAttribute("data-geo-href")]; if (p) el.setAttribute("href", p + s.slug + ".html");
    });
    each("[data-geo-show]", function (el) { el.removeAttribute("hidden"); });
    each("[data-geo-card]", function (el) {
      if (el.getAttribute("data-geo-card") === code) el.classList.add("geo-match");
    });
    each("input[name=visitor_state]", function (el) { el.value = code; });
  }

  function lookup() {
    var NAMES = { "Georgia": "GA", "Florida": "FL", "Texas": "TX", "Tennessee": "TN" };
    function fromGeoJS() {
      return fetch("https://get.geojs.io/v1/ip/geo.json").then(function (r) { return r.json(); })
        .then(function (d) { return d && d.country_code === "US" ? (NAMES[d.region] || "OTHER") : "OTHER"; });
    }
    function fromIpapi() {
      return fetch("https://ipapi.co/json/").then(function (r) { return r.json(); })
        .then(function (d) { return d && d.country_code === "US" ? (STATES[d.region_code] ? d.region_code : "OTHER") : "OTHER"; });
    }
    fromGeoJS().catch(fromIpapi).then(function (code) {
      if (STATES[code]) { save(code); apply(code); }
    }).catch(function () {});
  }

  function trackForms() {
    var fields = { landing_page: location.pathname, visitor_state: "" };
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"].forEach(function (k) {
      var v = params.get(k);
      try { if (v) sessionStorage.setItem("mk_" + k, v); else v = sessionStorage.getItem("mk_" + k); } catch (e) {}
      if (v) fields[k] = v;
    });
    each("form", function (f) {
      Object.keys(fields).forEach(function (k) {
        if (f.querySelector("input[name=" + k + "]")) return;
        var i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = fields[k]; f.appendChild(i);
      });
    });
  }

  function start() {
    trackForms();
    var forced = (params.get("state") || "").toUpperCase();
    if (STATES[forced]) { save(forced); apply(forced); return; }
    var c = saved();
    if (c) { apply(c); return; }
    lookup();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
