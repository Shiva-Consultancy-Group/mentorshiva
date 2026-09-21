/* ============================================================================
   Shiva Consultancy Group — "Book a Consultation" floating call-to-action
   ----------------------------------------------------------------------------
   One file, dropped into every SCG website, that shows a brand-consistent
   floating button linking to https://shivacsg.com/book. Every click carries
   UTM attribution so the booking form can record which site produced the lead.

   USAGE (one line before </body>):
     <script src="scg-book-cta.js" defer
             data-source="shivagroup.org.in"   optional  utm_source (default: hostname)
             data-side="right"                 optional  right | left  (use left when a
                                                          WhatsApp button already sits right)
             data-bottom="24"                  optional  distance from bottom, px
             data-target="_self"               optional  _self | _blank
             data-sublabel="Free on Saturdays" optional  small gold line under the label
             data-hide-below="899"             optional  hide the button on screens narrower
                                                          than N px (e.g. pages with their own
                                                          mobile tab bar that already has "Book")
     ></script>

   Zero dependencies. Styles live inside a Shadow DOM so the host page's CSS
   cannot alter the button and the button cannot alter the page.
   Canonical copy: rksjha/scg-booking/cta/scg-book-cta.js
   ========================================================================== */
(function () {
  "use strict";
  if (window.__SCG_BOOK_CTA__) return;          // never inject twice
  window.__SCG_BOOK_CTA__ = true;

  var BOOK_URL = "https://shivacsg.com/book";
  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script"); return s[s.length - 1];
  })();
  function attr(name, fallback) {
    var v = script && script.getAttribute("data-" + name);
    return (v === null || v === undefined || v === "") ? fallback : v;
  }

  /* --- attribution: which site, which placement ------------------------- */
  var host = (location.hostname || "").replace(/^www\./, "");
  var source = attr("source", host && host !== "localhost" ? host : "scg-site");
  function buildUrl(content) {
    var q = "utm_source=" + encodeURIComponent(source) +
            "&utm_medium=cta&utm_campaign=book-consultation" +
            "&utm_content=" + encodeURIComponent(content || "float");
    return BOOK_URL + "?" + q;
  }
  window.scgBookUrl = buildUrl;                  // reusable by page scripts

  /* --- do not show on the booking page itself --------------------------- */
  if (/(^|\.)shivacsg\.com$/.test(location.hostname) && /^\/book\/?/.test(location.pathname)) return;

  var side = attr("side", "right") === "left" ? "left" : "right";
  var bottom = parseInt(attr("bottom", "24"), 10) || 24;
  var target = attr("target", "_self") === "_blank" ? "_blank" : "_self";
  var label = attr("label", "Book a Consultation");
  var sublabel = attr("sublabel", "Free on Saturdays");
  var hideBelow = parseInt(attr("hide-below", "0"), 10) || 0;
  var KEY = "scgBookCtaDismissed";

  function dismissed() { try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function remember()  { try { sessionStorage.setItem(KEY, "1"); } catch (e) { /* private mode */ } }

  function mount() {
    if (dismissed() || document.getElementById("scg-book-cta")) return;
    var hostEl = document.createElement("div");
    hostEl.id = "scg-book-cta";
    hostEl.setAttribute("data-scg-cta", "");
    var root = hostEl.attachShadow ? hostEl.attachShadow({ mode: "open" }) : hostEl;

    var css =
      ":host{all:initial;position:fixed;bottom:" + bottom + "px;" + side + ":20px;z-index:2147483000;" +
        "font-family:Inter,'DM Sans','Segoe UI',system-ui,-apple-system,sans-serif;}" +
      "@media print{:host{display:none}}" +
      (hideBelow > 0 ? "@media(max-width:" + hideBelow + "px){:host{display:none}}" : "") +
      ".wrap{display:flex;align-items:center;gap:8px;" + (side === "left" ? "flex-direction:row-reverse;" : "") + "}" +
      ".btn{display:flex;align-items:center;gap:12px;padding:10px 18px 10px 10px;border-radius:999px;" +
        "background:#0B1F3A;color:#fff;text-decoration:none;border:1px solid rgba(201,168,76,.55);" +
        "box-shadow:0 10px 30px rgba(7,18,32,.35),0 0 0 4px rgba(201,168,76,.10);" +
        "transform:translateY(24px);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s,box-shadow .25s;}" +
      ".btn.in{transform:none;opacity:1}" +
      ".btn:hover{box-shadow:0 14px 36px rgba(7,18,32,.45),0 0 0 6px rgba(201,168,76,.18);transform:translateY(-2px)}" +
      ".btn:focus-visible{outline:3px solid #C9A84C;outline-offset:3px}" +
      ".ic{flex:none;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#E8C96A,#C9A84C);" +
        "display:flex;align-items:center;justify-content:center;color:#0B1F3A}" +
      ".ic svg{width:22px;height:22px;display:block}" +
      ".txt{display:flex;flex-direction:column;line-height:1.15;white-space:nowrap}" +
      ".l1{font-size:14px;font-weight:700;letter-spacing:.01em}" +
      ".l2{font-size:11px;font-weight:600;color:#E8C96A;letter-spacing:.06em;text-transform:uppercase;margin-top:3px}" +
      ".x{flex:none;width:26px;height:26px;border-radius:50%;border:0;cursor:pointer;background:rgba(11,31,58,.85);" +
        "color:#fff;font-size:15px;line-height:26px;text-align:center;opacity:0;transition:opacity .2s;padding:0}" +
      ".wrap:hover .x,.x:focus-visible{opacity:.9}" +
      "@media(max-width:480px){:host{bottom:" + Math.max(12, bottom - 8) + "px;" + side + ":12px}" +
        ".btn{padding:8px 14px 8px 8px;gap:9px}.ic{width:34px;height:34px}.ic svg{width:19px;height:19px}" +
        ".l1{font-size:13px}.l2{display:none}.x{opacity:.9}}" +
      "@media(prefers-reduced-motion:reduce){.btn{transition:none;transform:none;opacity:1}}";

    var svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>' +
      '<path d="M9 15l2 2 4-4"/></svg>';

    var wrap = document.createElement("div");
    wrap.className = "wrap";
    wrap.innerHTML =
      '<a class="btn" href="' + buildUrl("float") + '" target="' + target + '"' +
        (target === "_blank" ? ' rel="noopener"' : "") +
        ' aria-label="' + label + (sublabel ? " — " + sublabel : "") + '">' +
        '<span class="ic">' + svg + "</span>" +
        '<span class="txt"><span class="l1">' + label + "</span>" +
        (sublabel ? '<span class="l2">' + sublabel + "</span>" : "") + "</span>" +
      "</a>" +
      '<button class="x" type="button" aria-label="Hide booking button" title="Hide">&times;</button>';

    var style = document.createElement("style");
    style.textContent = css;
    root.appendChild(style);
    root.appendChild(wrap);
    document.body.appendChild(hostEl);

    wrap.querySelector(".x").addEventListener("click", function () { remember(); hostEl.remove(); });
    var a = wrap.querySelector(".btn");
    setTimeout(function () { a.classList.add("in"); }, 700);   // gentle entrance after the page settles
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
