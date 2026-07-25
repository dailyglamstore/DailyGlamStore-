(function () {

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async function loadArticles() {

    window.SKINCARE_ARTICLES = {};
    window.HAIRCARE_ARTICLES = {};

    // Load skincare articles
    for (const article of window.ARTICLE_REGISTRY.skincare) {

      await loadScript("/skincare-articles/" + article + ".js");

      window.SKINCARE_ARTICLES[window.CURRENT_ARTICLE.key] =
        window.CURRENT_ARTICLE;
    }

    // Load haircare articles
    for (const article of window.ARTICLE_REGISTRY.haircare) {

      await loadScript("/haircare-articles/" + article + ".js");

      window.HAIRCARE_ARTICLES[window.CURRENT_ARTICLE.key] =
        window.CURRENT_ARTICLE;
    }

    document.dispatchEvent(new Event("articlesLoaded"));

  }

  loadArticles();

})();