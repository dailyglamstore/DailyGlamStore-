(function () {
  // Extract slug from URL (e.g., "skincare-routine" or "haircare-routine")
  var slug = window.location.pathname
    .replace(/^\/+/, "")
    .replace(/\.html$/, "")
    .toLowerCase();

  if (!slug) return;

  // Determine category folder based on slug prefix or keyword
  var folder = "skincare-articles";
  if (slug.startsWith("hair") || slug.indexOf("haircare") !== -1) {
    folder = "haircare-articles";
  }

  // Create script tag dynamically
  var script = document.createElement("script");
  script.src = "/" + folder + "/" + slug + ".js";

  // Append to head
  document.head.appendChild(script);
})();
