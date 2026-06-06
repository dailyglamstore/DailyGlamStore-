(function renderArticlePage() {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildTargetAttributes(openNewTab) {
    return openNewTab
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
  }

  var config = window.ARTICLE_PAGE_CONFIG || {};
  var source = window[config.source];
  var article = source && source[config.key];

  if (!article) {
    return;
  }

  var heroNode =
    document.getElementById("articleHeroContent");

  var articleNode =
    document.getElementById("articleContent");

  var contentContainer =
    document.getElementById(
      "articleContentWrapper"
    );

  if (!heroNode || !articleNode) {
    return;
  }

  if (
    contentContainer &&
    config.ariaLabel
  ) {
    contentContainer.setAttribute(
      "aria-label",
      config.ariaLabel
    );
  }

  heroNode.innerHTML = [
    '<p class="article-label">' +
      escapeHtml(article.category) +
      "</p>",

    "<h1>" +
      escapeHtml(article.title) +
      "</h1>",

    '<p class="article-intro">' +
      escapeHtml(article.intro) +
      "</p>",

    '<p class="article-meta">' +
      escapeHtml(article.metaLine) +
      "</p>",

    '<figure class="featured-image">',

    '  <img src="' +
      escapeHtml(article.image.src) +
      '" alt="' +
      escapeHtml(article.image.alt) +
      '" loading="lazy" onerror="this.style.display=\'none\'" />',

    "</figure>"
  ].join("\n");

  var sectionMarkup =
    (article.sections || [])
      .map(function (section) {
        var sectionParts = [];

        sectionParts.push(
          "<h2>" +
            escapeHtml(
              section.heading
            ) +
            "</h2>"
        );

        (
          section.paragraphs || []
        ).forEach(function (
          paragraph
        ) {
          sectionParts.push(
            "<p>" +
              escapeHtml(
                paragraph
              ) +
              "</p>"
          );
        });

        if (
          section.bullets &&
          section.bullets.length
        ) {
          sectionParts.push(
            '<ul class="article-list">'
          );

          section.bullets.forEach(
            function (bullet) {
              sectionParts.push(
                "<li>" +
                  escapeHtml(
                    bullet
                  ) +
                  "</li>"
              );
            }
          );

          sectionParts.push(
            "</ul>"
          );
        }

        if (
          section.guideLinkText &&
          section.guideLinkHref
        ) {
          sectionParts.push(
            '<p class="guide-line">👉 Explore our <a class="guide-link" href="' +
              escapeHtml(
                section.guideLinkHref
              ) +
              '"' +
              buildTargetAttributes(
                section.guideLinkNewTab
              ) +
              ">" +
              escapeHtml(
                section.guideLinkText
              ) +
              "</a></p>"
          );
        }

        return sectionParts.join(
          "\n"
        );
      })
      .join("\n\n");

  var relatedArticlesMarkup =
    article.relatedArticles &&
    article.relatedArticles.length
      ? [
          '<section class="related-articles">',
          "  <h2>Related Articles</h2>",
          '  <ul class="related-articles-list">',

          article.relatedArticles
            .map(function (
              related
            ) {
              return (
                '<li><a href="' +
                escapeHtml(
                  related.href
                ) +
                '">' +
                escapeHtml(
                  related.title
                ) +
                "</a></li>"
              );
            })
            .join("\n"),

          "  </ul>",
          "</section>"
        ].join("\n")
      : "";

  var ctaButtons =
    (article.ctaButtons || [])
      .map(function (
        button
      ) {
        return (
          '<a class="cta-btn" href="' +
          escapeHtml(
            button.href
          ) +
          '"' +
          buildTargetAttributes(
            button.newTab
          ) +
          ">" +
          escapeHtml(
            button.text
          ) +
          "</a>"
        );
      })
      .join("\n");

  articleNode.innerHTML = [
    sectionMarkup,

    relatedArticlesMarkup,

    '<section class="routine-cta" id="article-next-step">',

    "  <h2>" +
      escapeHtml(
        article.ctaTitle
      ) +
      "</h2>",

    "  <p>" +
      escapeHtml(
        article.ctaText
      ) +
      "</p>",

    '  <div class="cta-actions">',

    ctaButtons,

    "  </div>",

    "</section>"
  ].join("\n");
})();