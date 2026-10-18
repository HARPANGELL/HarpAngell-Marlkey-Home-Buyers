/* MarKey lead form: a 2-step form that opens from any button with data-lead-open.
   Optional attributes on the button: data-situation, data-card, data-role.
   Posts to the same FormSubmit endpoint and field names as the site's existing forms,
   plus situation, urgency, deadline_date, role, lead_source_card and landing_page.
   Also adds a sticky Call / Get My Cash Offer bar on phones. Without JavaScript the
   buttons fall back to their href (the existing cash offer page). */
(function () {
  "use strict";
  var PHONE = "(678) 926-9776", TEL = "6789269776";
  var SITUATIONS = ["Facing foreclosure", "Behind on payments", "House in probate", "Inherited a house",
    "Title problems", "Tax liens / property debt", "Can't sell my house", "Going through divorce",
    "Tired landlord", "House needs major repairs", "Code violations", "Realtor or investor referral", "Other"];
  var PAGE_SITUATION = {
    "stop-foreclosure": "Facing foreclosure", "behind-on-payments": "Behind on payments",
    "sell-house-in-probate": "House in probate", "sell-inherited-house": "Inherited a house",
    "sell-house-with-title-problems": "Title problems", "sell-house-with-tax-liens": "Tax liens / property debt",
    "cant-sell-my-house": "Can't sell my house", "selling-during-divorce": "Going through divorce",
    "tired-landlord": "Tired landlord", "sell-house-needing-repairs": "House needs major repairs",
    "sell-house-with-code-violations": "Code violations"
  };
  var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  /* ---- Lead source tracking (all forms) + analytics events ----
     Adds hidden fields to every FormSubmit form at submit time: UTM tags, Google/Microsoft/Meta
     click IDs, first-touch source and landing page (kept 90 days in this browser), the page the
     form was sent from, and a timestamp. Pushes events to window.dataLayer for Tag Manager / GA4:
     form_start, lead_form_open, lead_form_step2, generate_lead, phone_click. */
  var ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "msclkid", "fbclid"];
  window.dataLayer = window.dataLayer || [];
  function track(obj) { try { window.dataLayer.push(obj); } catch (e) {} }
  function readStore(store, key) { try { return JSON.parse(store.getItem(key) || "null"); } catch (e) { return null; } }
  function writeStore(store, key, val) { try { store.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function extRef() {
    var r = document.referrer || "";
    try { if (r && new URL(r).hostname === location.hostname) return ""; } catch (e) { return ""; }
    return r;
  }
  function touches() {
    var params = new URLSearchParams(location.search), now = {}, has = false;
    ATTR_KEYS.forEach(function (k) { var v = params.get(k); if (v) { now[k] = v.slice(0, 200); has = true; } });
    var first = readStore(localStorage, "mk_first");
    if (!first || Date.now() - first.t > 90 * 864e5) {
      first = { t: Date.now(), landing: location.pathname, referrer: extRef(), p: now };
      writeStore(localStorage, "mk_first", first);
    }
    var last = readStore(sessionStorage, "mk_last");
    if (has || !last) {
      last = { landing: location.pathname, referrer: extRef(), p: now };
      writeStore(sessionStorage, "mk_last", last);
    }
    return { first: first, last: last };
  }
  function sourceOf(t) {
    var p = (t && t.p) || {};
    if (p.gclid || p.gbraid || p.wbraid) return "Google Ads";
    if (p.msclkid) return "Microsoft Ads";
    if (p.fbclid) return "Facebook / Instagram";
    if (p.utm_source) return p.utm_source + (p.utm_medium ? " / " + p.utm_medium : "");
    if (t && t.referrer) { try { var h = new URL(t.referrer).hostname.replace(/^www\./, ""); return /google\.|bing\.|yahoo\.|duckduckgo\./.test(h) ? h + " (organic)" : h; } catch (e) {} }
    return "Direct";
  }
  function stamp(form) {
    var a = touches(), f = {};
    ATTR_KEYS.forEach(function (k) { var v = (a.last.p || {})[k] || (a.first.p || {})[k]; if (v) f[k] = v; });
    f.lead_source = sourceOf(a.last.p && Object.keys(a.last.p).length ? a.last : a.first);
    f.first_touch_source = sourceOf(a.first);
    f.first_landing_page = a.first.landing;
    f.form_page = location.pathname;
    f.submitted_at = new Date().toISOString();
    Object.keys(f).forEach(function (k) {
      var i = form.querySelector('input[name="' + k + '"]');
      if (!i) { i = document.createElement("input"); i.type = "hidden"; i.name = k; form.appendChild(i); }
      i.value = f[k];
    });
  }
  function isLeadForm(f) { return f && f.tagName === "FORM" && /formsubmit\.co/.test(f.getAttribute("action") || ""); }

  /* ---- CRM: copy each lead to Zapier ("MarKey Website Leads to REISift" Zap), which creates the
     property in REISift with list "Website Leads" and tags "Website Lead" + situation. The email
     from FormSubmit still goes out as before; this is an extra copy, sent in the background. */
  var CRM_HOOK = "https://hooks.zapier.com/hooks/catch/5793977/41a62sh/";
  var STATES = { alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY", "district of columbia": "DC" };
  var SUFFIX = /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|blvd|boulevard|way|pl|place|cir|circle|pkwy|parkway|hwy|highway|trl|trail|ter|terrace|loop|run|pass|xing|crossing|sq|square|pt|point|row|walk|path|aly|alley)\b\.?(\s+\d+[a-z]?\b)?(\s+(ne|nw|se|sw|n|s|e|w)\b\.?)?(\s+(apt|unit|ste|suite|#)\s*[\w-]+)?/gi;
  function splitAddress(raw) {
    var out = { street: "", city: "", state: "", zip: "" };
    var s = String(raw || "").replace(/\s+/g, " ").trim().replace(/[,\s]*(usa|united states)\.?$/i, "");
    var m = s.match(/[,\s]+(\d{5})(-\d{4})?$/);
    if (m) { out.zip = m[1]; s = s.slice(0, m.index); }
    var names = Object.keys(STATES).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < names.length; i++) {
      var r = new RegExp("[,\\s]+" + names[i].replace(/ /g, "\\s+") + "\\.?$", "i");
      if (r.test(s)) { out.state = STATES[names[i]]; s = s.replace(r, ""); break; }
    }
    if (!out.state) {
      m = s.match(/[,\s]+([A-Za-z]{2})\.?$/);
      var codes = Object.keys(STATES).map(function (k) { return STATES[k]; });
      if (m && codes.indexOf(m[1].toUpperCase()) > -1) { out.state = m[1].toUpperCase(); s = s.slice(0, m.index); }
    }
    s = s.replace(/[,\s]+$/, "");
    if (s.indexOf(",") > -1) {
      out.street = s.slice(0, s.lastIndexOf(",")).trim();
      out.city = s.slice(s.lastIndexOf(",") + 1).trim();
    } else {
      /* street ends at the first street-type word (St, Ave, Rd...), extended over any that follow
         right after it ("Court St"); the rest is the city ("22 Main St East Point" -> East Point) */
      var end = -1, x;
      SUFFIX.lastIndex = 0;
      while ((x = SUFFIX.exec(s))) {
        if (end > -1 && !/^\s*$/.test(s.slice(end, x.index))) break;
        end = x.index + x[0].length;
      }
      if (end > -1 && end < s.length) {
        out.street = s.slice(0, end).trim();
        out.city = s.slice(end).trim();
      } else out.street = s;
    }
    return out;
  }
  function sendToCrm(form) {
    try {
      var hp = form.querySelector('[name="_honey"]');
      if (hp && hp.value) return;
      var d = {}, els = form.elements;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el.name || el.name.charAt(0) === "_" || el.disabled) continue;
        if ((el.type === "checkbox" || el.type === "radio") && !el.checked) continue;
        d[el.name] = String(el.value || "").slice(0, 2000);
      }
      if (!d.sms_consent) d.sms_consent = "no";
      if (!d.situation) d.situation = "Situation not given";
      var a = splitAddress(d.property_address);
      d.property_street = a.street; d.property_city = a.city; d.property_state = a.state; d.property_zip = a.zip;
      d.website = location.hostname;
      var lines = ["Website lead (" + location.hostname + ")"];
      [["Situation", "situation"], ["Timeline", "urgency"], ["Deadline", "deadline_date"], ["Who", "role"], ["Details", "details"],
       ["Email", "email"], ["Phone", "phone"], ["SMS consent", "sms_consent"], ["Address as typed", "property_address"],
       ["Lead source", "lead_source"], ["First touch", "first_touch_source"], ["First page", "first_landing_page"],
       ["Form page", "form_page"], ["Button", "lead_source_card"], ["Campaign", "utm_campaign"], ["Keyword", "utm_term"],
       ["Google click ID", "gclid"], ["Sent", "submitted_at"]].forEach(function (p) { if (d[p[1]]) lines.push(p[0] + ": " + d[p[1]]); });
      d.crm_notes = lines.join("\n");
      var body = new URLSearchParams(d);
      if (!(navigator.sendBeacon && navigator.sendBeacon(CRM_HOOK, body))) {
        fetch(CRM_HOOK, { method: "POST", mode: "no-cors", keepalive: true, body: body });
      }
    } catch (e) {}
  }

  var opener = null, modal, form, step1, step2;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function build() {
    var opts = SITUATIONS.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join("");
    var wrap = document.createElement("div");
    wrap.className = "mk-lead";
    wrap.hidden = true;
    wrap.innerHTML =
      '<div class="mk-lead-backdrop" data-lead-close></div>' +
      '<div class="mk-lead-dialog form-card" role="dialog" aria-modal="true" aria-labelledby="mk-lead-title">' +
        '<button type="button" class="mk-lead-x" data-lead-close aria-label="Close">&times;</button>' +
        '<p class="mk-lead-step" aria-live="polite">Step 1 of 2</p>' +
        '<h3 id="mk-lead-title">Tell us about the property</h3>' +
        '<p class="sub">Confidential. No obligation. No fees.</p>' +
        '<form action="https://formsubmit.co/contact@markeyhomebuyers.com" method="POST" novalidate>' +
          '<input type="hidden" name="_subject" value="NEW SELLER LEAD - markeyhomebuyers.com">' +
          '<input type="hidden" name="_next" value="https://markeyhomebuyers.com/thank-you.html">' +
          '<input type="hidden" name="_template" value="table">' +
          '<input type="hidden" name="lead_source_card" value="">' +
          '<input type="hidden" name="landing_page" value="">' +
          '<div class="mk-lead-s1">' +
            '<label for="mk-lead-address">Property address*</label>' +
            '<input id="mk-lead-address" type="text" name="property_address" autocomplete="street-address" placeholder="Street, City, State, Zip" required>' +
            '<label for="mk-lead-situation">What\'s going on?*</label>' +
            '<select id="mk-lead-situation" name="situation" required><option value="">Choose one</option>' + opts + '</select>' +
            '<label for="mk-lead-urgency">Is there a deadline?</label>' +
            '<select id="mk-lead-urgency" name="urgency">' +
              '<option>No deadline</option><option>Foreclosure or auction date is set</option>' +
              '<option>Closing deadline coming up</option><option>Other urgent situation</option><option>Not sure</option>' +
            '</select>' +
            '<div class="mk-lead-date" hidden><label for="mk-lead-date">Date, if you know it</label>' +
            '<input id="mk-lead-date" type="date" name="deadline_date"></div>' +
            '<button type="button" class="btn mk-lead-next">Next &rarr;</button>' +
          '</div>' +
          '<div class="mk-lead-s2" hidden>' +
            '<div class="row">' +
              '<div><label for="mk-lead-first">First name*</label><input id="mk-lead-first" type="text" name="first_name" autocomplete="given-name" required></div>' +
              '<div><label for="mk-lead-last">Last name*</label><input id="mk-lead-last" type="text" name="last_name" autocomplete="family-name" required></div>' +
            '</div>' +
            '<div class="row">' +
              '<div><label for="mk-lead-phone">Phone*</label><input id="mk-lead-phone" type="tel" name="phone" autocomplete="tel" minlength="7" required></div>' +
              '<div><label for="mk-lead-email">Email*</label><input id="mk-lead-email" type="email" name="email" autocomplete="email" required></div>' +
            '</div>' +
            '<label for="mk-lead-role">I am</label>' +
            '<select id="mk-lead-role" name="role"><option>The owner or a family member</option><option>A Realtor or agent</option><option>An investor</option><option>Other</option></select>' +
            '<label for="mk-lead-details">Briefly, what\'s happening? (optional)</label>' +
            '<textarea id="mk-lead-details" name="details" rows="3" placeholder="Anything that helps us understand the situation"></textarea>' +
            '<div class="consent"><input id="mk-lead-sms" type="checkbox" name="sms_consent" value="yes">' +
              '<label for="mk-lead-sms" class="mk-lead-consent">By checking this box, I consent to receive conversational and informational text messages from MarKey Home Buyers regarding my inquiry, property evaluation, appointment scheduling, and account-related updates. Message frequency may vary. Message &amp; data rates may apply. Reply STOP to opt out at any time and HELP for assistance. Consent is not a condition of purchase. View our <a href="privacy.html">Privacy Policy</a>, <a href="terms.html">Terms &amp; Conditions</a> &amp; <a href="sms-policy.html">SMS Policy</a>.</label></div>' +
            '<button type="submit" class="btn">See If We Can Help &rarr;</button>' +
            '<p class="mk-lead-fine">By submitting, you agree MarKey Home Buyers may contact you by phone or email about this property. You can opt out at any time.</p>' +
            '<button type="button" class="mk-lead-back">&larr; Back</button>' +
          '</div>' +
        '</form>' +
        '<p class="mk-lead-call">Prefer to talk? Call or text <a href="tel:' + TEL + '">' + PHONE + '</a></p>' +
      '</div>';
    document.body.appendChild(wrap);
    modal = wrap; form = wrap.querySelector("form");
    step1 = wrap.querySelector(".mk-lead-s1"); step2 = wrap.querySelector(".mk-lead-s2");

    wrap.addEventListener("click", function (e) { if (e.target.closest("[data-lead-close]")) close(); });
    wrap.querySelector(".mk-lead-next").addEventListener("click", next);
    wrap.querySelector(".mk-lead-back").addEventListener("click", function () { show(1); });
    wrap.querySelector("#mk-lead-urgency").addEventListener("change", function () {
      var v = this.value;
      wrap.querySelector(".mk-lead-date").hidden = !(v === "Foreclosure or auction date is set" || v === "Closing deadline coming up");
    });
    step1.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); next(); } });
    form.addEventListener("submit", function (e) {
      if (!valid(step2)) { e.preventDefault(); return; }
      form.querySelector("[name=landing_page]").value = location.pathname;
    });
    document.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") trap(e);
    });
  }

  function valid(scope) {
    var fields = scope.querySelectorAll("input[required], select[required]");
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].checkValidity()) { fields[i].reportValidity(); fields[i].focus(); return false; }
    }
    return true;
  }
  function next() { if (valid(step1)) { show(2); track({ event: "lead_form_step2", lead_situation: modal.querySelector("#mk-lead-situation").value }); } }
  function show(n) {
    step1.hidden = n !== 1; step2.hidden = n !== 2;
    modal.querySelector(".mk-lead-step").textContent = "Step " + n + " of 2";
    modal.querySelector("#mk-lead-title").textContent = n === 1 ? "Tell us about the property" : "Where should we reach you?";
    var first = (n === 1 ? step1 : step2).querySelector("input, select");
    if (first) first.focus();
  }
  function trap(e) {
    var f = modal.querySelectorAll('button:not([hidden]), [href], input:not([type=hidden]), select, textarea');
    f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
  function open(btn) {
    if (!modal) build();
    opener = btn || null;
    var sit = (btn && btn.getAttribute("data-situation")) || PAGE_SITUATION[page] || "";
    var role = btn && btn.getAttribute("data-role");
    var sel = modal.querySelector("#mk-lead-situation");
    sel.value = SITUATIONS.indexOf(sit) > -1 ? sit : "";
    if (role) modal.querySelector("#mk-lead-role").value = role;
    modal.querySelector("[name=lead_source_card]").value = (btn && btn.getAttribute("data-card")) || ("Page: " + page);
    modal.hidden = false;
    document.documentElement.classList.add("mk-lead-open");
    show(1);
    track({ event: "lead_form_open", lead_situation: sel.value, lead_source_card: modal.querySelector("[name=lead_source_card]").value });
  }
  function close() {
    modal.hidden = true;
    document.documentElement.classList.remove("mk-lead-open");
    if (opener && opener.focus) opener.focus();
  }

  function stickyBar() {
    if (page === "thank-you" || document.querySelector(".mobile-cta")) return;
    var bar = document.createElement("div");
    bar.className = "mobile-cta";
    bar.innerHTML = '<a href="tel:' + TEL + '">Call ' + PHONE + '</a>' +
      '<a class="go" href="get-a-cash-offer.html" data-lead-open data-card="Sticky mobile bar">Get My Cash Offer</a>';
    document.body.appendChild(bar);
    document.documentElement.classList.add("has-mobile-cta");
  }

  function start() {
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lead-open]");
      if (!b) return;
      e.preventDefault();
      open(b);
    });
    stickyBar();
    touches();
    document.addEventListener("submit", function (e) {
      var f = e.target;
      if (!isLeadForm(f) || e.defaultPrevented) return;
      stamp(f);
      sendToCrm(f);
      var sit = f.querySelector("[name=situation]"), card = f.querySelector("[name=lead_source_card]");
      track({ event: "generate_lead", form_type: f.closest(".mk-lead") ? "two_step_popup" : "page_form",
              lead_situation: sit ? sit.value : "", lead_source_card: card ? card.value : "", form_page: location.pathname });
    });
    document.addEventListener("focusin", function (e) {
      var f = e.target.form;
      if (!isLeadForm(f) || f.getAttribute("data-started")) return;
      f.setAttribute("data-started", "1");
      track({ event: "form_start", form_type: f.closest(".mk-lead") ? "two_step_popup" : "page_form", form_page: location.pathname });
    });
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="tel:"]');
      if (a) track({ event: "phone_click", link_location: a.closest(".mobile-cta") ? "mobile_bar" : a.closest("footer") ? "footer" : a.closest(".topbar") ? "top_bar" : "page" });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
