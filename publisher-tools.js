(function () {
  var BASE_URL = "https://dailyglamstore.in";
  var DEDUCTION_PER_WARNING = 2;

  var allArticles = [];
  var skincareArticlesList = [];
  var haircareArticlesList = [];
  var comparisonArticlesCount = 0;
  var articleUrlsMap = {};
  var uniqueArticleKeys = {};
  
  var diagnosticCategories = {
    seoTitle: { label: "SEO Titles", items: [], status: "pass", isFailType: false },
    seoDescription: { label: "SEO Descriptions", items: [], status: "pass", isFailType: false },
    faq: { label: "Missing FAQ", items: [], status: "pass", isFailType: false },
    relatedArticles: { label: "Related Articles", items: [], status: "pass", isFailType: false },
    author: { label: "Authors", items: [], status: "pass", isFailType: false },
    dateModified: { label: "Missing dateModified", items: [], status: "pass", isFailType: false },
    duplicateUrls: { label: "Duplicate URLs", items: [], status: "pass", isFailType: true },
    duplicateKeys: { label: "Duplicate Keys", items: [], status: "pass", isFailType: true },
    image: { label: "Images", items: [], status: "pass", isFailType: false },
    intro: { label: "Intro", items: [], status: "pass", isFailType: false },
    emptySections: { label: "Empty Sections", items: [], status: "pass", isFailType: false },
    brokenLinks: { label: "Broken Internal Links", items: [], status: "pass", isFailType: false },
    comparisonValidation: { label: "Comparison Article Validation", items: [], status: "pass", isFailType: false }
  };

  var totalIssueDeductions = 0;

  function initLiveTimestamp() {
    var scanDateNode = document.getElementById("scanDate");
    if (scanDateNode) {
      var currentDate = new Date();
      scanDateNode.textContent = currentDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
  }

  function getFormattedToday() {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var dd = String(today.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  function gatherSourceObjects() {
    var skincareSource = window.SKINCARE_ARTICLES || {};
    var haircareSource = window.HAIRCARE_ARTICLES || {};

    Object.keys(skincareSource).forEach(function (key) {
      var item = skincareSource[key];
      if (item && typeof item === "object") {
        skincareArticlesList.push(item);
        allArticles.push(item);
        
        if (!uniqueArticleKeys[key]) {
          uniqueArticleKeys[key] = [];
        }
        uniqueArticleKeys[key].push(item.title || key);
      }
    });

    Object.keys(haircareSource).forEach(function (key) {
      var item = haircareSource[key];
      if (item && typeof item === "object") {
        haircareArticlesList.push(item);
        allArticles.push(item);
        
        if (!uniqueArticleKeys[key]) {
          uniqueArticleKeys[key] = [];
        }
        uniqueArticleKeys[key].push(item.title || key);
      }
    });
  }

  function countWordsInContent(article) {
    var contentString = "";
    
    if (article.intro) contentString += " " + article.intro;
    if (article.title) contentString += " " + article.title;
    
    if (article.sections && Array.isArray(article.sections)) {
      article.sections.forEach(function (sec) {
        if (sec.heading) contentString += " " + sec.heading;
        if (sec.paragraphs && Array.isArray(sec.paragraphs)) {
          contentString += " " + sec.paragraphs.join(" ");
        }
        if (sec.bullets && Array.isArray(sec.bullets)) {
          contentString += " " + sec.bullets.join(" ");
        }
      });
    }
    
    if (article.faq && Array.isArray(article.faq)) {
      article.faq.forEach(function (f) {
        if (f.question) contentString += " " + f.question;
        if (f.answer) contentString += " " + f.answer;
      });
    }
    
    if (article.comparisonTable && article.comparisonTable.rows && Array.isArray(article.comparisonTable.rows)) {
      article.comparisonTable.rows.forEach(function (row) {
        if (row.features && Array.isArray(row.features)) {
          contentString += " " + row.features.join(" ");
        }
      });
    }
    
    var cleanWords = contentString.trim().split(/\s+/);
    return contentString.trim() === "" ? 0 : cleanWords.length;
  }

  function processContentStatistics() {
    if (allArticles.length === 0) return;

    var totalWords = 0;
    var maxWords = -1;
    var longestTitle = "--";
    
    var baseDate = new Date();
    var currentYear = baseDate.getFullYear();
    var currentMonth = baseDate.getMonth();
    var itemsPublishedThisMonth = 0;

    var validDatedArticles = [];

    allArticles.forEach(function (art) {
      var wCount = countWordsInContent(art);
      totalWords += wCount;
      if (wCount > maxWords) {
        maxWords = wCount;
        longestTitle = art.title || art.key;
      }

      if (art.date) {
        var dObj = new Date(art.date);
        if (!isNaN(dObj.getTime())) {
          validDatedArticles.push({ title: art.title || art.key, date: dObj });
          if (dObj.getFullYear() === currentYear && dObj.getMonth() === currentMonth) {
            itemsPublishedThisMonth++;
          }
        }
      }
    });

    document.getElementById("avgWordCount").textContent = Math.round(totalWords / allArticles.length);
    document.getElementById("publishedThisMonthCount").textContent = itemsPublishedThisMonth;
    document.getElementById("longestArticleInfo").textContent = longestTitle + " (" + maxWords + " words)";

    if (validDatedArticles.length > 0) {
      validDatedArticles.sort(function (a, b) { return b.date - a.date; });
      
      var options = { day: "numeric", month: "short", year: "numeric" };
      var newest = validDatedArticles[0];
      var oldest = validDatedArticles[validDatedArticles.length - 1];

      document.getElementById("newestArticleInfo").textContent = newest.title + " — " + newest.date.toLocaleDateString("en-GB", options);
      document.getElementById("oldestArticleInfo").textContent = oldest.title + " — " + oldest.date.toLocaleDateString("en-GB", options);
    }
  }

  function runCategorizedAudit() {
    Object.keys(uniqueArticleKeys).forEach(function (key) {
      if (uniqueArticleKeys[key].length > 1) {
        totalIssueDeductions++;
        diagnosticCategories.duplicateKeys.items.push("Key '" + key + "' is repeated across multiple definitions");
      }
    });

    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";

      if (article.url) {
        var cleanPath = String(article.url).trim().toLowerCase();
        if (!articleUrlsMap[cleanPath]) {
          articleUrlsMap[cleanPath] = [];
        }
        articleUrlsMap[cleanPath].push(displayTitle);
      }

      if (!article.seoTitle || String(article.seoTitle).trim() === "") {
        totalIssueDeductions++;
        diagnosticCategories.seoTitle.items.push(displayTitle);
      }
      if (!article.seoDescription || String(article.seoDescription).trim() === "") {
        totalIssueDeductions++;
        diagnosticCategories.seoDescription.items.push(displayTitle);
      }
      if (!article.intro || String(article.intro).trim() === "") {
        totalIssueDeductions++;
        diagnosticCategories.intro.items.push(displayTitle);
      }
      
      var trackingImageSource = (article.image && article.image.src) || article.src;
      if (!trackingImageSource || String(trackingImageSource).trim() === "") {
        totalIssueDeductions++;
        diagnosticCategories.image.items.push(displayTitle);
      }

      if (!article.faq || !Array.isArray(article.faq) || article.faq.length === 0) {
        totalIssueDeductions++;
        diagnosticCategories.faq.items.push(displayTitle);
      }
      if (!article.relatedArticles || !Array.isArray(article.relatedArticles) || article.relatedArticles.length === 0) {
        totalIssueDeductions++;
        diagnosticCategories.relatedArticles.items.push(displayTitle);
      }

      var hasValidAuthor = false;
      if (article.author && Array.isArray(article.author)) {
        hasValidAuthor = article.author.some(function (auth) {
          return auth && auth.enabled === true && (auth.type === "Person" || auth.type === "Organization");
        });
      }
      if (!hasValidAuthor) {
        totalIssueDeductions++;
        diagnosticCategories.author.items.push(displayTitle);
      }

      if (!article.dateModified) {
        totalIssueDeductions++;
        diagnosticCategories.dateModified.items.push(displayTitle);
      }

      if (article.sections && Array.isArray(article.sections)) {
        var emptyFound = article.sections.some(function (sec) {
          var hasHeading = sec.heading && String(sec.heading).trim() !== "";
          var hasParagraphs = sec.paragraphs && sec.paragraphs.length > 0 && String(sec.paragraphs[0]).trim() !== "";
          var hasBullets = sec.bullets && sec.bullets.length > 0 && String(sec.bullets[0]).trim() !== "";
          return !hasHeading && !hasParagraphs && !hasBullets;
        });
        if (emptyFound) {
          totalIssueDeductions++;
          diagnosticCategories.emptySections.items.push(displayTitle);
        }
      } else {
        totalIssueDeductions++;
        diagnosticCategories.emptySections.items.push(displayTitle);
      }

      if (article.comparisonTable) {
        comparisonArticlesCount++;
        var hasFaq = article.faq && Array.isArray(article.faq) && article.faq.length > 0;
        var hasCompRows = article.comparisonTable.rows && Array.isArray(article.comparisonTable.rows) && article.comparisonTable.rows.length > 0;
        var hasRecommendations = article.productRecommendations && Array.isArray(article.productRecommendations) && article.productRecommendations.length > 0;
        
        if (!hasFaq || !hasCompRows || !hasRecommendations) {
          totalIssueDeductions++;
          var detailsMissing = [];
          if (!hasFaq) detailsMissing.push("FAQ missing");
          if (!hasCompRows) detailsMissing.push("comparisonTable empty");
          if (!hasRecommendations) detailsMissing.push("productRecommendations missing");
          diagnosticCategories.comparisonValidation.items.push(displayTitle + " (Missing: " + detailsMissing.join(", ") + ")");
        }
      }
    });

    Object.keys(articleUrlsMap).forEach(function (urlPath) {
      if (articleUrlsMap[urlPath].length > 1) {
        totalIssueDeductions += (articleUrlsMap[urlPath].length - 1);
        diagnosticCategories.duplicateUrls.items.push("Path '" + urlPath + "' linked in: " + articleUrlsMap[urlPath].join(" & "));
      }
    });

    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";
      if (article.relatedArticles && Array.isArray(article.relatedArticles)) {
        article.relatedArticles.forEach(function (rel) {
          if (rel && rel.href) {
            var targetHref = String(rel.href).trim().toLowerCase();
            if (!articleUrlsMap[targetHref]) {
              totalIssueDeductions++;
              diagnosticCategories.brokenLinks.items.push(displayTitle + " → " + rel.href + " (Target article not found)");
            }
          }
        });
      }
    });

    Object.keys(diagnosticCategories).forEach(function (catKey) {
      var cat = diagnosticCategories[catKey];
      if (cat.items.length > 0) {
        cat.status = cat.isFailType ? "fail" : "warn";
      } else {
        cat.status = "pass";
      }
    });
  }

  function paintInterfaceOutputs() {
    document.getElementById("totalCount").textContent = allArticles.length;
    document.getElementById("skincareCount").textContent = skincareArticlesList.length;
    document.getElementById("haircareCount").textContent = haircareArticlesList.length;
    document.getElementById("comparisonCount").textContent = comparisonArticlesCount;

    var computedScore = 100 - (totalIssueDeductions * DEDUCTION_PER_WARNING);
    if (computedScore < 0) computedScore = 0;
    document.getElementById("seoScoreValue").textContent = computedScore + "/100";

    var healthStatusNode = document.getElementById("healthStatus");
    healthStatusNode.className = "status-value"; 

    if (computedScore >= 90) {
      healthStatusNode.textContent = "🟢 Excellent";
      healthStatusNode.classList.add("health-excellent");
    } else if (computedScore >= 75) {
      healthStatusNode.textContent = "🔵 Good";
      healthStatusNode.classList.add("health-good");
    } else if (computedScore >= 50) {
      healthStatusNode.textContent = "🟡 Needs Attention";
      healthStatusNode.classList.add("health-attention");
    } else {
      healthStatusNode.textContent = "🔴 Errors Found";
      healthStatusNode.classList.add("health-error");
    }

    var warningsLogContainer = document.getElementById("seoWarningsLog");
    warningsLogContainer.innerHTML = "";

    Object.keys(diagnosticCategories).forEach(function (catKey) {
      var cat = diagnosticCategories[catKey];
      var listRowItem = document.createElement("li");
      
      if (cat.status === "pass") {
        listRowItem.className = "log-pass";
        listRowItem.textContent = "✅ " + cat.label;
      } else {
        listRowItem.className = cat.status === "warn" ? "log-warn" : "log-fail";
        var prefixSign = cat.status === "warn" ? "⚠ " : "❌ ";
        var itemsCounterText = cat.isFailType ? "" : " (" + cat.items.length + ")";
        listRowItem.textContent = prefixSign + cat.label + itemsCounterText;
        
        var nestedUl = document.createElement("ul");
        nestedUl.className = "warning-nested-list";
        cat.items.forEach(function (nestedText) {
          var nestedLi = document.createElement("li");
          nestedLi.textContent = "• " + nestedText;
          nestedUl.appendChild(nestedLi);
        });
        listRowItem.appendChild(nestedUl);
      }
      
      warningsLogContainer.appendChild(listRowItem);
    });
  }

  function manufactureSitemapContent() {
    var xmlOutputRows = [];
    xmlOutputRows.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlOutputRows.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    var currentFormattedToday = getFormattedToday();

    var baselineStaticPages = [
      { route: "/", priority: "1.0", frequency: "daily" },
      { route: "/beauty-blog.html", priority: "0.9", frequency: "weekly" },
      { route: "/beauty-guides.html", priority: "0.8", frequency: "weekly" },
      { route: "/shop.html", priority: "0.8", frequency: "monthly" }
    ];

    baselineStaticPages.forEach(function (page) {
      xmlOutputRows.push("  <url>");
      xmlOutputRows.push("    <loc>" + BASE_URL + page.route + "</loc>");
      xmlOutputRows.push("    <lastmod>" + currentFormattedToday + "</lastmod>");
      xmlOutputRows.push("    <changefreq>" + page.frequency + "</changefreq>");
      xmlOutputRows.push("    <priority>" + page.priority + "</priority>");
      xmlOutputRows.push("  </url>");
    });

    allArticles.forEach(function (article) {
      if (article.url) {
        var formattedUrlSegment = String(article.url).trim();
        if (formattedUrlSegment.charAt(0) !== "/") {
          formattedUrlSegment = "/" + formattedUrlSegment;
        }

        var determinedPriority = "0.8";
        if (article.comparisonTable) {
          determinedPriority = "0.9";
        }

        xmlOutputRows.push("  <url>");
        xmlOutputRows.push("    <loc>" + BASE_URL + formattedUrlSegment + "</loc>");
        xmlOutputRows.push("    <lastmod>" + currentFormattedToday + "</lastmod>");
        xmlOutputRows.push("    <changefreq>monthly</changefreq>");
        xmlOutputRows.push("    <priority>" + determinedPriority + "</priority>");
        xmlOutputRows.push("  </url>");
      }
    });

    xmlOutputRows.push("</urlset>");
    
    var totalUrlElementsCalculated = baselineStaticPages.length + allArticles.filter(function(a){return a.url;}).length;
    
    var outputTextarea = document.getElementById("sitemapContainer");
    if (outputTextarea) {
      outputTextarea.value = xmlOutputRows.join("\n");
    }

    var liveDateObject = new Date();
    document.getElementById("sitemapUrlCount").textContent = totalUrlElementsCalculated + " URLs";
    document.getElementById("sitemapGenDate").textContent = liveDateObject.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    document.getElementById("sitemapSummary").style.display = "block";
  }

  function handleClipboardCopyAction() {
    var sitemapTextarea = document.getElementById("sitemapContainer");
    if (!sitemapTextarea || sitemapTextarea.value.trim() === "") {
      return;
    }

    sitemapTextarea.select();
    sitemapTextarea.setSelectionRange(0, 99999);

    try {
      var secureCopyActionStatus = document.execCommand("copy");
      if (secureCopyActionStatus) {
        var toastBox = document.getElementById("copyToast");
        if (toastBox) {
          toastBox.style.display = "inline";
          setTimeout(function () {
            toastBox.style.display = "none";
          }, 2000);
        }
      }
    } catch (err) {
      // Graceful fallback for environments restrictions
    }
  }

  function attachControlListeners() {
    var generateBtn = document.getElementById("btnGenerateSitemap");
    var copyBtn = document.getElementById("btnCopySitemap");

    if (generateBtn) {
      generateBtn.addEventListener("click", manufactureSitemapContent);
    }
    if (copyBtn) {
      copyBtn.addEventListener("click", handleClipboardCopyAction);
    }
  }

  function runEnginePipeline() {
    initLiveTimestamp();
    gatherSourceObjects();
    processContentStatistics();
    runCategorizedAudit();
    paintInterfaceOutputs();
    attachControlListeners();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runEnginePipeline);
  } else {
    runEnginePipeline();
  }
})();
