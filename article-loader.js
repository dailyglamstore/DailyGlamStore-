(function () {
  // Extract slug from URL (e.g., "skincare-routine")
  var slug = window.location.pathname
    .replace(/^\/+/, "")
    .replace(/\.html$/, "")
    .toLowerCase();

  if (!slug) return;

  // Determine category folder
  var folder = "skincare-articles";
  if (slug.startsWith("hair") || slug.indexOf("haircare") !== -1) {
    folder = "haircare-articles";
  }

  // Inject article data script
  var script = document.createElement("script");
  script.src = "/" + folder + "/" + slug + ".js";
  
  // When the article data finishes loading, load SEO & Main rendering scripts
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
