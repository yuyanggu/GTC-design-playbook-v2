/* ============================================================================
   Clean-URL route table for the continuous reader (playbook.html).

   Maps the reader's in-page anchor ids ↔ shareable path URLs:
     #ch2   ⇄  /chapter-2
     #s-21  ⇄  /chapter-2/designing-for-everyone   (section level)

   Subsections (#s-XY-Z) deliberately have NO path — the URL stays at the
   section while you read through its subsections (granularity = section).

   Runs FIRST, synchronously, in <head> (a classic script, like gate.js) so
   window.GTCRoutes exists before the inline anti-flash script and the deferred
   modules (main.js / chapter.js) read it.

   Paths are SERVER-REWRITTEN to /playbook.html (see vercel.json + _redirects);
   that's why playbook.html carries <base href="/"> so its relative assets still
   resolve under a two-segment path like /chapter-2/designing-for-everyone.

   This is the single source of truth: to add/rename a section, edit SECTION_SLUGS.
   ========================================================================== */
(function () {
  // section id → URL slug. Chapters derive as /chapter-{N} from their ch{N} id.
  var SECTION_SLUGS = {
    "s-11": "why-govtech",
    "s-12": "the-modernisation-opportunity",
    "s-13": "the-ai-reality",
    "s-21": "designing-for-everyone",
    "s-22": "what-we-believe",
    "s-23": "what-success-looks-like",
    "s-31": "how-we-engage",
    "s-32": "qualifying",
    "s-33": "discovery",
    "s-34": "building-and-delivering",
    "s-35": "support-and-maintenance",
    "s-36": "capability-building",
  };

  var byId = {};   // id → path
  var byPath = {}; // path → id

  ["ch1", "ch2", "ch3"].forEach(function (cid) {
    var path = "/chapter-" + cid.slice(2);
    byId[cid] = path;
    byPath[path] = cid;
  });
  Object.keys(SECTION_SLUGS).forEach(function (sid) {
    var path = "/chapter-" + sid.charAt(2) + "/" + SECTION_SLUGS[sid]; // s-[3]1 → chapter-3
    byId[sid] = path;
    byPath[path] = sid;
  });

  function norm(p) {
    p = (p || "").replace(/\/+$/, ""); // drop trailing slash(es)
    return p === "" ? "/" : p;
  }

  window.GTCRoutes = {
    idToPath: function (id) { return byId[id] || null; },
    pathToId: function (path) { return byPath[norm(path)] || null; },
    // True for any reader path (/chapter-2, /chapter-2/anything). Used by the
    // anti-flash inline script, which can't query the DOM yet.
    isReaderPath: function (path) { return /^\/chapter-\d+(\/|$)/.test(norm(path)); },
  };
})();
