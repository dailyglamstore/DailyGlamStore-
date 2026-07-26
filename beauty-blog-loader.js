(function () {

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;

      script.onload = function () {
        resolve();
      };

      script.onerror = function () {
        console.error("Failed to load:", src);
        reject(new Error(src));
      };

      document.body.appendChild(script);
    });
  }

  async function loadCategory(articleList, folder, targetObject) {

    if (!Array.isArray(articleList)) return;

    for (const slug of articleList) {

      try {

        await loadScript("/" + folder + "/" + slug + ".js");

        if (window.CURRENT_ARTICLE && window.CURRENT_ARTICLE.key) {

          // Store a copy instead of the global reference
          targetObject[window.CURRENT_ARTICLE.key] = {
            ...window.CURRENT_ARTICLE
          };

          console.log("Loaded:", window.CURRENT_ARTICLE.key);

        } else {

          console.warn("CURRENT_ARTICLE missing after loading:", slug);

        }

      } catch (err) {

        console.error("Error loading article:", slug, err);

      }

    }

  }

  async function loadArticles() {

    window.SKINCARE_ARTICLES = {};
    window.HAIRCARE_ARTICLES = {};

    await loadCategory(
      window.ARTICLE_REGISTRY.skincare,
      "skincare-articles",
      window.SKINCARE_ARTICLES
    );

    await loadCategory(
      window.ARTICLE_REGISTRY.haircare,
      "haircare-articles",
      window.HAIRCARE_ARTICLES
    );

    console.log("Skincare Articles:", window.SKINCARE_ARTICLES);
    console.log("Haircare Articles:", window.HAIRCARE_ARTICLES);

    document.dispatchEvent(new Event("articlesLoaded"));

  }

  if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", loadArticles);

  } else {

    loadArticles();

  }

})();