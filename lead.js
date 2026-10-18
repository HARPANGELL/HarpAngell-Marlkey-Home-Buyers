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
    "Tired landlord", "Realtor or investor referral", "Other"];
  var PAGE_SITUATION = {
    "stop-foreclosure": "Facing foreclosure", "behind-on-payments": "Behind on payments",
    "sell-house-in-probate": "House in probate", "sell-inherited-house": "Inherited a house",
    "sell-house-with-title-problems": "Title problems", "sell-house-with-tax-liens": "Tax liens / property debt",
    "cant-sell-my-house": "Can't sell my house", "selling-during-divorce": "Going through divorce",
    "tired-landlord": "Tired landlord"
  };
  var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
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
  function next() { if (valid(step1)) show(2); }
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
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
