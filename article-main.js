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
  
  if (article.linkPlan) {
  article.linkPlan.forEach(function(link) {
    link._used = false;
  });
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
  '" onerror="this.style.display=\'none\'" />',

    "</figure>"
  ].join("\n");

var comparisonTableMarkup = "";

if (
  article.comparisonTable &&
  article.comparisonTable.headers &&
  article.comparisonTable.rows
) {
  comparisonTableMarkup = [
    '<section class="comparison-table-section">',

    "<h2>" +
      escapeHtml(
        article.comparisonTable.title ||
        "Quick Comparison"
      ) +
      "</h2>",

    '<div class="comparison-table-wrapper">',
    '<table class="comparison-table">',

    "<thead>",
    "<tr>",

    article.comparisonTable.headers
      .map(function(header) {
        return (
          "<th>" +
          escapeHtml(header) +
          "</th>"
        );
      })
      .join("\n"),

    "</tr>",
    "</thead>",

    "<tbody>",

    article.comparisonTable.rows
      .map(function(row) {
        return (
          "<tr>" +
          row.map(function(cell) {
            return (
              "<td>" +
              escapeHtml(cell) +
              "</td>"
            );
          }).join("") +
          "</tr>"
        );
      })
      .join("\n"),

    "</tbody>",
    "</table>",
    "</div>",
    "</section>"
  ].join("\n");
}

  var tocItems = [];

var sectionMarkup =
  (article.sections || [])
    .map(function (
      section,
      index
    ) {
      var sectionParts = [];

      var headingId =
        "section-" + index;

      tocItems.push(
        '<li><a href="#' +
          headingId +
          '">' +
          escapeHtml(
            section.heading
          ) +
          "</a></li>"
      );

      sectionParts.push(
  '<h2 id="' +
    headingId +
    '">' +
    escapeHtml(
      section.heading
    ) +
    "</h2>"
);

if (
  section.images &&
  section.images.length
) {
  section.images.forEach(
    function(image) {
      sectionParts.push(
        '<figure class="article-section-image">' +

        '<img src="' +
          escapeHtml(image.src) +
          '" alt="' +
          escapeHtml(image.alt) +
          '" loading="lazy" onerror="this.style.display=\'none\'" />' +

        "</figure>"
      );
    }
  );
}

      (
        section.paragraphs || []
      ).forEach(function (
        paragraph
      ) {
        var formattedParagraph =
  escapeHtml(paragraph);

if (
  article.linkPlan &&
  article.linkPlan.length
) {
  article.linkPlan.forEach(
    function(link) {

      if (
        link.anchorText &&
        link.href &&
        !link._used
      ) {

        var escapedAnchor =
          escapeHtml(
            link.anchorText
          );

        if (
          formattedParagraph.indexOf(
            escapedAnchor
          ) !== -1
        ) {

          formattedParagraph =
            formattedParagraph.replace(
              escapedAnchor,

              '<a class="inline-product-link" href="' +
                escapeHtml(
                  link.href
                ) +
                '"' +
                buildTargetAttributes(
                  link.newTab
                ) +
              ">" +

              escapedAnchor +

              "</a>"
            );

          link._used = true;
        }
      }
    }
  );
}

sectionParts.push(
  "<p>" +
    formattedParagraph +
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
  section.recommendationBox &&
  section.recommendationBox.href
) {
  sectionParts.push(
    '<div class="recommendation-box">' +

    (
      section.recommendationBox.productName
        ? '<p class="recommendation-product">' +
            escapeHtml(
              section.recommendationBox.productName
            ) +
          "</p>"
        : ""
    ) +

    '<a class="recommendation-btn" href="' +
      escapeHtml(
        section.recommendationBox.href
      ) +
      '"' +
      buildTargetAttributes(
        section.recommendationBox.newTab
      ) +
    ">" +

    escapeHtml(
      section.recommendationBox.text ||
      "Check Price & Offers"
    ) +

    "</a>" +

    "</div>"
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

  var tocMarkup =
  article.showTableOfContents &&
  tocitems.length
    ? [
        '<section class="table-of-contents">',
        "<h2>Quick Navigation</h2>",
        '<ul class="toc-list">',
        tocitems.join("\n"),
        article.faq && article.faq.length ? '<li><a href="#article-faq-section">Frequently Asked Questions</a></li>' : "",
        "</ul>",
        "</section>"
      ].join("\n")
    : "";

  var productRecommendationsMarkup =
  article.productRecommendations &&
  article.productRecommendations.items &&
  article.productRecommendations.items.length
    ? [
        '<section class="final-product-recommendations">',
        '<h2>' +
        escapeHtml(
          article.productRecommendations.title ||
          "Made Your Choice?"
        )+
        '</h2>',
        '<div class="final-product-grid">',
        article.productRecommendations.items
        .map(function(product) {
          return (
            '<a class="final-product-btn" href="' +
            escapeHtml(
              product.href
            )+
            '"' +
            buildTargetAttributes(
              product.newTab
            )+
            ">" +
            escapeHtml(
              product.title
            )+
            "</a>"
          );
        })
        .join("\n"),
        "</div>",
        "</section>"
      ].join("\n")
    : "";

  var relatedArticlesMarkup =
  article.relatedArticles &&
  article.relatedArticles.length
    ? [
        '<section class="related-articles">',
        " <h2>Related Articles</h2>",
        ' <ul class="related-articles-list">',
        article.relatedArticles
        .map(function (
          related
        ) {
          return (
            '<li><a href="' +
            escapeHtml(
              related.href
            )+
            '">' +
            escapeHtml(
              related.title
            )+
            "</a></li>"
          );
        })
        .join("\n"),
        "</ul>",
        "</section>"
      ].join("\n")
    :"";

  var faqMarkup =
  article.faq &&
  article.faq.length
    ? [
        '<section class="article-faq faq-section" id="article-faq-section">',
        ' <div class="section-heading-wrap">',
        '   <h2 class="section-title routine-heading-capsule"><span class="routine-heading-lines">Frequently Asked\nQuestions</span></h2>',
        ' </div>',
        ' <div class="faq-wrap">',
        '   <div class="faq-category">',
        '     <div class="faq-list" data-faq-group="article-faq">',
        article.faq
        .map(function(item) {
          return [
            '<div class="faq-item">',
            '  <button class="faq-question" type="button" aria-expanded="false">',
            '    <span>' + escapeHtml(item.question) + '</span>',
            '    <span class="faq-toggle">▼</span>',
            '  </button>',
            '  <div class="faq-answer">',
            '    <p class="faq-answer-inner">' + escapeHtml(item.answer) + '</p>',
            '  </div>',
            '</div>'
          ].join("\n");
        })
        .join("\n"),
        '     </div>',
        '   </div>',
        ' </div>',
        '</section>'
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
      )+
      '" ' +
      buildTargetAttributes(
        button.newTab
      )+
      ">" +
      escapeHtml(
        button.text
      )+
      "</a>"
    );
  })
  .join("\n");

  articleNode.innerHTML = [
    tocMarkup,
    comparisonTableMarkup,
    sectionMarkup,
    productRecommendationsMarkup,
    relatedArticlesMarkup,
    faqMarkup,
    '<section class="routine-cta" id="article-next-step">',
    " <h2>" + escapeHtml(article.ctaTitle) + "</h2>",
    " <p>" + escapeHtml(article.ctaText) + "</p>",
    ' <div class="cta-actions">',
    ctaButtons,
    " </div>",
    "</section>"
  ].join("\n");

  var faqQuestions = document.querySelectorAll(".faq-question");
  
  faqQuestions.forEach(function (button) {
    button.addEventListener("click", function () {
      var answerDiv = button.nextElementSibling;
      var isExpanded = button.getAttribute("aria-expanded") === "true";
      
      faqQuestions.forEach(function (otherButton) {
        if (otherButton !== button) {
          otherButton.setAttribute("aria-expanded", "false");
          otherButton.classList.remove("is-active");
          var otherAnswer = otherButton.nextElementSibling;
          if (otherAnswer) {
            otherAnswer.style.maxHeight = null;
          }
        }
      });
      
      if (isExpanded) {
        button.setAttribute("aria-expanded", "false");
        button.classList.remove("is-active");
        if (answerDiv) {
          answerDiv.style.maxHeight = null;
        }
      } else {
        button.setAttribute("aria-expanded", "true");
        button.classList.add("is-active");
        if (answerDiv) {
          answerDiv.style.maxHeight = answerDiv.scrollHeight + "px";
        }
      }
    });
  });

})();
          