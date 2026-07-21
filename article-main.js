(function renderArticlePage() {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildTargetAttributes(openNewTab) {
    return openNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
  }

function renderBlock(block) {

if (!block || !block.type) {
return "";
}

switch (block.type) {

case "paragraph":

var paragraphs = Array.isArray(block.text)
? block.text
: [block.text];

return paragraphs
.map(function(text) {
return "<p>" + escapeHtml(text) + "</p>";
})
.join("\n");

case "subHeading":
    return (
        '<h3 class="article-sub-heading">' +
        escapeHtml(block.text) +
        "</h3>"
    );

case "image":

return (
'<figure class="article-section-image">' +
'<img src="' +
escapeHtml(block.src) +
'" alt="' +
escapeHtml(block.alt) +
'" loading="lazy" onerror="this.style.display=\'none\'" />' +
"</figure>"
);

case "bullets":

return [
'<ul class="article-list">',
(block.items || [])
.map(function(item) {
return "<li>" + escapeHtml(item) + "</li>";
})
.join("\n"),
"</ul>"
].join("\n");

case "infoBox":

var defaultTitles = {
tip: "Quick Tip",
warning: "Common Mistake",
note: "Good to Know",
expert: "Daily Glam Store Insight"
};

var boxType = block.boxType || "note";

var boxTitle =
block.title && block.title.trim()
? block.title
: (defaultTitles[boxType] || "Good to Know");

return (
'<div class="article-info-box info-' +
escapeHtml(boxType) +
'">' +
'<div class="info-box-title">' +
escapeHtml(boxTitle) +
'</div>' +
'<p class="info-box-text">' +
escapeHtml(block.text) +
'</p>' +
'</div>'
);

case "recommendationBox":

return (
'<div class="recommendation-box">' +
(block.productName
? '<p class="recommendation-product">' +
escapeHtml(block.productName) +
"</p>"
: "") +
'<a class="recommendation-btn" href="' +
escapeHtml(block.href) +
'"' +
buildTargetAttributes(block.newTab) +
">" +
escapeHtml(block.text || "Check Price & Offers") +
"</a>" +
"</div>"
);

case "relatedLink":

return (
'<p class="guide-line">Learn more in our <a class="guide-link" href="' +
escapeHtml(block.href) +
'"' +
buildTargetAttributes(block.newTab) +
">" +
escapeHtml(block.text) +
"</a>.</p>"
);

default:

return "";

}

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

  var heroNode = document.getElementById("articleHeroContent");
  var articleNode = document.getElementById("articleContent");
  var contentContainer = document.getElementById("articleContentWrapper");

  if (!heroNode || !articleNode) {
    return;
  }

  if (contentContainer && config.ariaLabel) {
    contentContainer.setAttribute("aria-label", config.ariaLabel);
  }

  heroNode.innerHTML = [
    '<p class="article-label">' + escapeHtml(article.category) + "</p>",
    "<h1>" + escapeHtml(article.title) + "</h1>",
    '<p class="article-intro">' + escapeHtml(article.intro) + "</p>",
    
    (function () {
  function formatDate(dateString) {
    if (!dateString) return "";

    var date = new Date(dateString);

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  var publishedDate = formatDate(article.date);
  var modifiedDate = formatDate(article.dateModified || article.date);
  
  var displayAuthor = "";

if (article.author && article.author.length) {
  var personAuthor = article.author.find(function(author) {
    return author.enabled && author.type === "Person";
  });

  var orgAuthor = article.author.find(function(author) {
    return author.enabled && author.type === "Organization";
  });

  if (personAuthor) {
    displayAuthor = personAuthor.name;
  } else if (orgAuthor) {
    displayAuthor = orgAuthor.name;
  }
}

  var dateMarkup =
  '<div class="article-dates">' +
    '<div>📅 <strong>Published:</strong> ' + publishedDate + '</div>' +

    (
      article.dateModified &&
      article.dateModified !== article.date
        ? '<div>✏️ <strong>Last Updated:</strong> ' + modifiedDate + '</div>'
        : ''
    ) +

    (
      displayAuthor
        ? '<div>✍️ <strong>By:</strong> ' + escapeHtml(displayAuthor) + '</div>'
        : ''
    ) +

  '</div>';

  return dateMarkup;
})(),

    '<p class="article-meta">' + escapeHtml(article.metaLine) + "</p>",
    '<figure class="featured-image">',
    ' <img src="' + escapeHtml(article.image.src) + '" alt="' + escapeHtml(article.image.alt) + '" onerror="this.style.display=\'none\'" />',
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
      "<h2>" + escapeHtml(article.comparisonTable.title || "Quick Comparison") + "</h2>",
      '<div class="comparison-table-wrapper">',
      '<table class="comparison-table">',
      "<thead>",
      "<tr>",
      article.comparisonTable.headers
        .map(function(header) {
          return "<th>" + escapeHtml(header) + "</th>";
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
              return "<td>" + escapeHtml(cell) + "</td>";
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

  var tocitems = [];
  var sectionMarkup = (article.sections || [])
    .map(function (section, index) {
      var sectionParts = [];
      var headingId = "section-" + index;
      
      tocitems.push(
        '<li><a href="#' + headingId + '">' + escapeHtml(section.heading) + "</a></li>"
      );

      sectionParts.push(
    '<h2 id="' + headingId + '">' + escapeHtml(section.heading) + "</h2>"
);

if (section.blocks && section.blocks.length) {

    section.blocks.forEach(function(block) {
        sectionParts.push(renderBlock(block));
    });

    return sectionParts.join("\n");

}

        sectionParts.push("<p>" + formattedParagraph + "</p>");
      });
      
      if (
  section.infoBox &&
  section.infoBox.text &&
  section.infoBox.text.trim()
) {

  var defaultTitles = {
    tip: "Quick Tip",
    warning: "Common Mistake",
    note: "Good to Know",
    expert: "Daily Glam Store Insight"
  };

  var boxType = section.infoBox.type || "note";

  var boxTitle =
    section.infoBox.title &&
    section.infoBox.title.trim()
      ? section.infoBox.title
      : (defaultTitles[boxType] || "Good to Know");

  sectionParts.push(
    '<div class="article-info-box info-' +
      escapeHtml(boxType) +
      '">' +

      '<div class="info-box-title">' +
      escapeHtml(boxTitle) +
      '</div>' +

      '<p class="info-box-text">' +
      escapeHtml(section.infoBox.text) +
      '</p>' +

    '</div>'
  );
}

      if (section.relatedLinkText && section.relatedLinkHref) {
  sectionParts.push(
    '<p class="guide-line">Learn more in our <a class="guide-link" href="' +
    escapeHtml(section.relatedLinkHref) +
    '"' +
    buildTargetAttributes(section.relatedLinkNewTab) +
    ">" +
    escapeHtml(section.relatedLinkText) +
    "</a>.</p>"
  );
}

      return sectionParts.join("\n");
    })
    .join("\n\n");

  var shouldShowTOC =
  article.showTableOfContents === true ||
  (
    article.showTableOfContents !== false &&
    (
      !!article.comparisonTable ||
      tocitems.length >= 7
    )
  );

var tocMarkup = shouldShowTOC && tocitems.length
  ? [
      '<section class="table-of-contents">',
      "<h2>Quick Navigation</h2>",
      '<ul class="toc-list">',
      tocitems.join("\n"),
      "</ul>",
      "</section>"
    ].join("\n")
  : "";

  var productRecommendationsMarkup = article.productRecommendations && article.productRecommendations.items && article.productRecommendations.items.length
    ? [
        '<section class="final-product-recommendations">',
        '<h2>' + escapeHtml(article.productRecommendations.title || "Made Your Choice?") + '</h2>',
        '<div class="final-product-grid">',
        article.productRecommendations.items
          .map(function(product) {
            return (
              '<a class="final-product-btn" href="' + escapeHtml(product.href) + '"' + buildTargetAttributes(product.newTab) + ">" + escapeHtml(product.title) + "</a>"
            );
          })
          .join("\n"),
        "</div>",
        "</section>"
      ].join("\n")
    : "";

var alternativeProductsMarkup =
  article.alternativeProducts &&
  article.alternativeProducts.items &&
  article.alternativeProducts.items.length
    ? [
        '<section class="alternative-products">',
        '<h2>' +
          escapeHtml(
            article.alternativeProducts.title ||
              "Explore Similar Products"
          ) +
        "</h2>",

        '<div class="alternative-products-grid">',

        article.alternativeProducts.items
          .map(function(product) {
  return (
    '<a class="alternative-product-btn" href="' +
    escapeHtml(product.href) +
    '"' +
    buildTargetAttributes(product.newTab) +
    ">" +

    escapeHtml(product.title) +

    (
      product.type === "affiliateProduct"
        ? ' <span class="product-arrow">➜</span>'
        : ""
    ) +

    "</a>"
  );
})
          .join("\n"),

        "</div>",
        "</section>"
      ].join("\n")
    : "";

  var relatedArticlesMarkup = article.relatedArticles && article.relatedArticles.length
    ? [
        '<section class="related-articles">',
        " <h2>Related Articles</h2>",
        ' <ul class="related-articles-list">',
        article.relatedArticles
          .map(function (related) {
            return (
              '<li><a href="' + escapeHtml(related.href) + '">' + escapeHtml(related.title) + "</a></li>"
            );
          })
          .join("\n"),
        "</ul>",
        "</section>"
      ].join("\n")
    : "";

  var faqMarkup = article.faq && article.faq.length
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
        "     </div>",
        "   </div>",
        " </div>",
        "</section>"
      ].join("\n")
    : "";

  var ctaButtons = (article.ctaButtons || [])
    .map(function (button) {
      return (
        '<a class="cta-btn" href="' + escapeHtml(button.href) + '"' + buildTargetAttributes(button.newTab) + ">" + escapeHtml(button.text) + "</a>"
      );
    })
    .join("\n");

  articleNode.innerHTML = [

    tocMarkup,
    comparisonTableMarkup,
    sectionMarkup,
    productRecommendationsMarkup,
    alternativeProductsMarkup,
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

  // YOUR FAVORITE SMOOTH STEADY PACING ENGINE RESTORED
  if (article.faq && article.faq.length) {
    var tocList = document.querySelector(".toc-list");
    if (tocList) {
      var faqLi = document.createElement("li");
      faqLi.innerHTML = '<span id="toc-faq-trigger" style="color:var(--brand); cursor:pointer; text-decoration:none; display:block; width:100%; -webkit-tap-highlight-color:transparent;">Frequently Asked Questions</span>';
      tocList.appendChild(faqLi);
      
      var faqTrigger = document.getElementById("toc-faq-trigger");
      if (faqTrigger) {
        faqTrigger.addEventListener("mouseenter", function() { faqTrigger.style.textDecoration = "underline"; });
        faqTrigger.addEventListener("mouseleave", function() { faqTrigger.style.textDecoration = "none"; });

        faqTrigger.addEventListener("click", function(e) {
          e.preventDefault();
          
          var targetSection = document.getElementById("article-faq-section");
          if (targetSection) {
            var headerOffset = window.innerWidth <= 768 ? 115 : 135;
            
            // Clean, beautifully paced smooth descent initial launch
            var targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: targetPosition,
              behavior: "smooth"
            });

            // Smooth rhythmic pacing clock - tracks and updates heights to secure perfect destination arrival
            var checkCount = 0;
            var adjustInterval = setInterval(function() {
              var currentTop = targetSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;
              
              if (Math.abs(window.pageYOffset - currentTop) > 3) {
                window.scrollTo({
                  top: currentTop,
                  behavior: "smooth"
                });
              }
              
              checkCount++;
              if (checkCount > 25) { 
                clearInterval(adjustInterval);
              }
            }, 60); // Restored to the perfect 60ms cadence for that beautiful slow scrolling rhythm
          }
        });
      }
    }
  }

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
