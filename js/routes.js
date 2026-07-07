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
  // All five chapters (01–05) plus the Foreword are live.
  var SECTION_SLUGS = {
    "s-11": "who-we-are",
    "s-21": "foundations-that-guide-us",
    "s-22": "our-principles-of-execution",
    "s-23": "through-a-discovery-lens",
    "s-24": "success-in-our-eyes",
    "s-31": "the-shape-of-engagement",
    "s-32": "the-work-we-build-on",
    "s-33": "building-lasting-capability",
    "s-41": "qualifying",
    "s-42": "discovery",
    "s-43": "building-and-delivery",
    "s-44": "support-and-maintenance",
    "s-51": "our-operating-principles",
    "s-52": "rituals-and-cadences",
    "s-53": "how-we-show-up",
    "s-54": "the-practice-in-practice",
  };

  var byId = {};   // id → path
  var byPath = {}; // path → id

  // ch0 is the Foreword — it opts out of the /chapter-N scheme and lives at /foreword.
  byId["ch0"] = "/foreword";
  byPath["/foreword"] = "ch0";

  // Live reader chapters (all five are built).
  ["ch1", "ch2", "ch3", "ch4", "ch5"].forEach(function (cid) {
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
    isReaderPath: function (path) {
      var p = norm(path);
      return p === "/foreword" || /^\/chapter-\d+(\/|$)/.test(p);
    },
  };
})();
