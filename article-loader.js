(function () {
  var body = document.body;
  
  // 1. First choice: Get slug and folder directly from body attributes (for new subfolder setup)
  var slug = body ? body.getAttribute("data-slug") : null;
  var folder = body ? body.getAttribute("data-category") : null;

  // 2. Fallback choice: Extract filename from URL (for old root-level setup)
  if (!slug) {
    var pathSegments = window.location.pathname.replace(/\.html$/, "").split("/");
    slug = pathSegments[pathSegments.length - 1].toLowerCase();
  }

  if (!folder) {
    folder = "skincare-articles";
    if (slug.startsWith("hair") || slug.indexOf("haircare") !== -1) {
      folder = "haircare-articles";
    }
  }

  if (!slug) return;

  // 3. Inject article data script
  var script = document.createElement("script");
  script.src = "/" + folder + "/" + slug + ".js";

  script.onload = function () {
    loadScript("/article-seo.js");
    loadScript("/article-main.js");
  };

  script.onerror = function () {
    console.error("Could not load article JS file from: " + script.src);
  };

  document.head.appendChild(script);

  function loadScript(src) {
    var s = document.createElement("script");
    s.src = src;
    document.head.appendChild(s);
  }
})();
