(function () {
  var BASE_URL = "https://dailyglamstore.in";
  var DEDUCTION_PER_WARNING = 2;

  var allArticles = [];
  var skincareArticlesList = [];
  var haircareArticlesList = [];
  var comparisonArticlesCount = 0;
  var articleUrlsMap = {};
  var uniqueArticleKeys = {};
  
  // Diagnostic configurations mapping
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
    brokenLinks: { label: "Broken Internal Links (Audited Arrays Only)", items: [], status: "pass", isFailType: false },
    comparisonValidation: { label: "Comparison Article Validation", items: [], status: "pass", isFailType: false },
    missingLinkPlan: { label: "Missing linkPlan Array", items: [], status: "pass", isFailType: false },
    missingRecommendations: { label: "Missing productRecommendations", items: [], status: "pass", isFailType: false },
    missingAlternativeProducts: { label: "Missing alternativeProducts", items: [], status: "pass", isFailType: false },
    missingLinkTypes: { label: "Missing Link Types", items: [], status: "pass", isFailType: false },
    invalidAffiliateProps: { label: "Invalid Affiliate Link Settings", items: [], status: "pass", isFailType: false },
    invalidTargetTabs: { label: "Invalid Target Tab (_blank / same-tab) Directives", items: [], status: "pass", isFailType: false }
  };

  var totalIssueDeductions = 0;

  // Trackers for exact metrics mapping pipelines
  var statTotals = {
    affiliateLinks: 0,
    nonAffiliateProducts: 0,
    internalLinks: 0,
    pageLinks: 0,
    externalReferences: 0,
    altProductLinks: 0,
    recButtons: 0
  };

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
        if (!uniqueArticleKeys[key]) uniqueArticleKeys[key] = [];
        uniqueArticleKeys[key].push(item.title || key);
      }
    });

    Object.keys(haircareSource).forEach(function (key) {
      var item = haircareSource[key];
      if (item && typeof item === "object") {
        haircareArticlesList.push(item);
        allArticles.push(item);
        if (!uniqueArticleKeys[key]) uniqueArticleKeys[key] = [];
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
        if (sec.paragraphs && Array.isArray(sec.paragraphs)) contentString += " " + sec.paragraphs.join(" ");
        if (sec.bullets && Array.isArray(sec.bullets)) contentString += " " + sec.bullets.join(" ");
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
        if (row.features && Array.isArray(row.features)) contentString += " " + row.features.join(" ");
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
      document.getElementById("newestArticleInfo").textContent = validDatedArticles[0].title + " — " + validDatedArticles[0].date.toLocaleDateString("en-GB", options);
      document.getElementById("oldestArticleInfo").textContent = validDatedArticles[validDatedArticles.length - 1].title + " — " + validDatedArticles[validDatedArticles.length - 1].date.toLocaleDateString("en-GB", options);
    }
  }

  // Verification checking helper for affiliate properties configuration settings
  function validateAffiliateProperty(item, locationContext, displayTitle) {
    if (!item.hasOwnProperty("affiliate")) {
      totalIssueDeductions++;
      diagnosticCategories.invalidAffiliateProps.items.push(displayTitle + " → " + locationContext + " is missing the 'affiliate' property");
    } else if (typeof item.affiliate !== "boolean") {
      totalIssueDeductions++;
      diagnosticCategories.invalidAffiliateProps.items.push(displayTitle + " → " + locationContext + " has a non-boolean affiliate property value");
    }
  }

  // Check if an article uses the new architecture layout structures
  function isUsingNewArchitecture(article) {
    return !!(article.linkPlan || article.productRecommendations || article.alternativeProducts);
  }

  function runCategorizedAudit() {
    statTotals.affiliateLinks = 0;
    statTotals.nonAffiliateProducts = 0;
    statTotals.internalLinks = 0;
    statTotals.pageLinks = 0;
    statTotals.externalReferences = 0;
    statTotals.altProductLinks = 0;
    statTotals.recButtons = 0;

    Object.keys(uniqueArticleKeys).forEach(function (key) {
      if (uniqueArticleKeys[key].length > 1) {
        totalIssueDeductions++;
        diagnosticCategories.duplicateKeys.items.push("Key '" + key + "' is repeated across multiple definitions");
      }
    });

    // Step 1: Map all valid production URLs
    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";
      if (article.url) {
        var cleanPath = String(article.url).trim().toLowerCase();
        if (!articleUrlsMap[cleanPath]) articleUrlsMap[cleanPath] = [];
        articleUrlsMap[cleanPath].push(displayTitle);
      }
    });

    // Step 2: Main metrics processing loop
    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";
      var completenessPoints = 0;
      var completenessTotalPossible = 12;
      var isNewArch = isUsingNewArchitecture(article);

      // Base Metadata Validations
      if (article.seoTitle && String(article.seoTitle).trim() !== "") { completenessPoints++; } else {
        totalIssueDeductions++;
        diagnosticCategories.seoTitle.items.push(displayTitle);
      }
      if (article.seoDescription && String(article.seoDescription).trim() !== "") { completenessPoints++; } else {
        totalIssueDeductions++;
        diagnosticCategories.seoDescription.items.push(displayTitle);
      }
      if (article.intro && String(article.intro).trim() !== "") { completenessPoints++; } else {
        totalIssueDeductions++;
        diagnosticCategories.intro.items.push(displayTitle);
      }
      
      var trackingImageSource = (article.image && article.image.src) || article.src;
      if (trackingImageSource && String(trackingImageSource).trim() !== "") { completenessPoints++; } else {
        totalIssueDeductions++;
        diagnosticCategories.image.items.push(displayTitle);
      }

      if (article.faq && Array.isArray(article.faq) && article.faq.length > 0) { completenessPoints++; } else {
        totalIssueDeductions++;
        diagnosticCategories.faq.items.push(displayTitle);
      }
      if (article.relatedArticles && Array.isArray(article.relatedArticles) && article.relatedArticles.length > 0) { completenessPoints++; } else {
        totalIssueDeductions++;
        diagnosticCategories.relatedArticles.items.push(displayTitle);
      }

      var hasValidAuthor = false;
      if (article.author && Array.isArray(article.author)) {
        hasValidAuthor = article.author.some(function (auth) {
          return auth && auth.enabled === true && (auth.type === "Person" || auth.type === "Organization");
        });
      }
      if (hasValidAuthor) { completenessPoints++; } else {
        totalIssueDeductions++;
        diagnosticCategories.author.items.push(displayTitle);
      }

      if (article.dateModified) { completenessPoints++; } else {
        totalIssueDeductions++;
        diagnosticCategories.dateModified.items.push(displayTitle);
      }

      if (article.sections && Array.isArray(article.sections)) {
        var emptyFound = article.sections.some(function (sec) {
          return !(sec.heading && String(sec.heading).trim() !== "") && 
                 !(sec.paragraphs && sec.paragraphs.length > 0 && String(sec.paragraphs[0]).trim() !== "") && 
                 !(sec.bullets && sec.bullets.length > 0 && String(sec.bullets[0]).trim() !== "");
        });
        if (!emptyFound && article.sections.length > 0) { completenessPoints++; }
        if (emptyFound) {
          totalIssueDeductions++;
          diagnosticCategories.emptySections.items.push(displayTitle);
        }
      } else {
        totalIssueDeductions++;
        diagnosticCategories.emptySections.items.push(displayTitle);
      }

      if (article.comparisonTable) completenessPoints++;

      var extractedLinks = [];
      var trueAffiliateCountForThisArticle = 0;

      // A. linkPlan processing block
      if (article.linkPlan && Array.isArray(article.linkPlan)) {
        completenessPoints++;
        article.linkPlan.forEach(function (linkItem) {
          if (linkItem && typeof linkItem === "object") {
            extractedLinks.push(linkItem);
            
            if (!linkItem.type || String(linkItem.type).trim() === "") {
              totalIssueDeductions++;
              diagnosticCategories.missingLinkTypes.items.push(displayTitle + " → " + (linkItem.anchorText || "Unknown text link") + " missing type");
            } else {
              var typeStr = String(linkItem.type).trim();
              if (typeStr === "affiliateProduct") {
                validateAffiliateProperty(linkItem, "linkPlan item", displayTitle);
                if (linkItem.affiliate === true) trueAffiliateCountForThisArticle++;
              }
              if (typeStr === "externalReference" && linkItem.newTab !== true) {
                totalIssueDeductions++;
                diagnosticCategories.invalidTargetTabs.items.push(displayTitle + " (External reference must open in a new tab)");
              }
              if (typeStr === "page" && linkItem.newTab === true) {
                totalIssueDeductions++;
                diagnosticCategories.invalidTargetTabs.items.push(displayTitle + " (Page item link must NOT open in a new tab)");
              }
              if (typeStr === "internalArticle" && linkItem.newTab === true) {
                totalIssueDeductions++;
                diagnosticCategories.invalidTargetTabs.items.push(displayTitle + " (Internal article link must NOT open in a new tab)");
              }
            }
          }
        });
      } else if (isNewArch) {
        totalIssueDeductions++;
        diagnosticCategories.missingLinkPlan.items.push(displayTitle);
      }

      // B. productRecommendations processing block
      if (article.productRecommendations && article.productRecommendations.items && Array.isArray(article.productRecommendations.items)) {
        completenessPoints++;
        article.productRecommendations.items.forEach(function (recItem) {
          if (recItem && typeof recItem === "object") {
            statTotals.recButtons++;
            extractedLinks.push(recItem);
            if (recItem.type === "affiliateProduct") {
              validateAffiliateProperty(recItem, "productRecommendations item", displayTitle);
              if (recItem.affiliate === true) trueAffiliateCountForThisArticle++;
            }
          }
        });
      } else if (isNewArch) {
        totalIssueDeductions++;
        diagnosticCategories.missingRecommendations.items.push(displayTitle);
      }

      // C. alternativeProducts processing block
      if (article.alternativeProducts && article.alternativeProducts.items && Array.isArray(article.alternativeProducts.items)) {
        completenessPoints++;
        statTotals.altProductLinks += article.alternativeProducts.items.length;

        article.alternativeProducts.items.forEach(function (altItem) {
          if (altItem && typeof altItem === "object") {
            extractedLinks.push(altItem);
            if (altItem.type === "affiliateProduct") {
              validateAffiliateProperty(altItem, "alternativeProducts item", displayTitle);
              if (altItem.affiliate === true) trueAffiliateCountForThisArticle++;
            }
          }
        });
      } else if (isNewArch) {
        if (article.comparisonTable) {
          totalIssueDeductions++;
          diagnosticCategories.missingAlternativeProducts.items.push(displayTitle + " (Comparison missing alternativeProducts)");
        } else {
          diagnosticCategories.missingAlternativeProducts.items.push(displayTitle);
        }
      }

      // Aggregate global statistics metrics from verified target arrays only
      extractedLinks.forEach(function (lnk) {
        if (lnk.type === "affiliateProduct") {
          if (lnk.affiliate === true) statTotals.affiliateLinks++;
          if (lnk.affiliate === false) statTotals.nonAffiliateProducts++;
        }
        if (lnk.type === "internalArticle") statTotals.internalLinks++;
        if (lnk.type === "page") statTotals.pageLinks++;
        if (lnk.type === "externalReference") statTotals.externalReferences++;
      });

      // D. Deep Comparison Article Logic Override
      if (article.comparisonTable) {
        comparisonArticlesCount++;
        var hasFaq = article.faq && Array.isArray(article.faq) && article.faq.length > 0;
        var hasCompRows = article.comparisonTable.rows && Array.isArray(article.comparisonTable.rows) && article.comparisonTable.rows.length > 0;
        var hasRecommendations = article.productRecommendations && article.productRecommendations.items && Array.isArray(article.productRecommendations.items) && article.productRecommendations.items.length > 0;
        var hasAltProducts = article.alternativeProducts && article.alternativeProducts.items && Array.isArray(article.alternativeProducts.items) && article.alternativeProducts.items.length > 0;
        var hasLPlan = article.linkPlan && Array.isArray(article.linkPlan) && article.linkPlan.length > 0;
        var meetsMinAffiliate = trueAffiliateCountForThisArticle >= 2;
        
        if (!hasFaq || !hasCompRows || !hasRecommendations || !hasAltProducts || !hasLPlan || !meetsMinAffiliate) {
          totalIssueDeductions++;
          var detailsMissing = [];
          if (!hasFaq) detailsMissing.push("FAQ missing");
          if (!hasCompRows) detailsMissing.push("comparisonTable empty");
          if (!hasRecommendations) detailsMissing.push("productRecommendations missing");
          if (!hasAltProducts) detailsMissing.push("alternativeProducts missing");
          if (!hasLPlan) detailsMissing.push("linkPlan missing");
          if (!meetsMinAffiliate) detailsMissing.push("less than two true affiliate product links");
          diagnosticCategories.comparisonValidation.items.push(displayTitle + " (Missing: " + detailsMissing.join(", ") + ")");
        }
      }

      article._completenessScore = Math.round((completenessPoints / completenessTotalPossible) * 100);
    });

    // Step 3: Handle Duplicate URL collisions
    Object.keys(articleUrlsMap).forEach(function (urlPath) {
      if (articleUrlsMap[urlPath].length > 1) {
        totalIssueDeductions += (articleUrlsMap[urlPath].length - 1);
        diagnosticCategories.duplicateUrls.items.push("Path '" + urlPath + "' linked in: " + articleUrlsMap[urlPath].join(" & "));
      }
    });

    // Step 4: Run Link Health Engine Checker on verified targets arrays only (Excludes relatedArticles)
    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";
      if (article.linkPlan && Array.isArray(article.linkPlan)) {
        article.linkPlan.forEach(function (lnk) {
          if (lnk && lnk.type === "internalArticle" && lnk.href) {
            var targetInternalHref = String(lnk.href).trim().toLowerCase();
            if (!articleUrlsMap[targetInternalHref]) {
              totalIssueDeductions++;
              diagnosticCategories.brokenLinks.items.push("Broken Internal Link: " + displayTitle + " → " + lnk.href);
            }
          }
        });
      }
    });

    // Step 5: Assign execution status results matrix
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
    var totalArticleCount = allArticles.length;
    document.getElementById("totalCount").textContent = totalArticleCount;
    document.getElementById("skincareCount").textContent = skincareArticlesList.length;
    document.getElementById("haircareCount").textContent = haircareArticlesList.length;
    document.getElementById("comparisonCount").textContent = comparisonArticlesCount;

    var computedScore = 100 - (totalIssueDeductions * DEDUCTION_PER_WARNING);
    if (computedScore < 0) computedScore = 0;
    document.getElementById("seoScoreValue").textContent = computedScore + "/100";

    // Set metrics dashboard UI outputs safely 
    document.getElementById("totalAffiliateLinks").textContent = statTotals.affiliateLinks;
    document.getElementById("totalNonAffiliateProducts").textContent = statTotals.nonAffiliateProducts;
    document.getElementById("totalInternalLinks").textContent = statTotals.internalLinks;
    document.getElementById("totalPageLinks").textContent = statTotals.pageLinks;
    document.getElementById("totalExternalReferences").textContent = statTotals.externalReferences;
    
    var altTargetNode = document.getElementById("totalAlternativeProducts") || document.getElementById("totalAlternativeBoxes");
    if (altTargetNode) altTargetNode.textContent = statTotals.altProductLinks;

    document.getElementById("totalRecButtons").textContent = statTotals.recButtons;
    document.getElementById("avgInternalLinks").textContent = totalArticleCount > 0 ? (statTotals.internalLinks / totalArticleCount).toFixed(2) : "0";

    // Build Exact Product Link Distribution Percentage outputs
    var sumOfAllLinks = statTotals.affiliateLinks + statTotals.nonAffiliateProducts + statTotals.internalLinks + statTotals.externalReferences + statTotals.pageLinks;
    if (sumOfAllLinks > 0) {
      document.getElementById("pctAffiliateLinks").textContent = Math.round((statTotals.affiliateLinks / sumOfAllLinks) * 100) + "%";
      document.getElementById("pctNonAffiliateLinks").textContent = Math.round((statTotals.nonAffiliateProducts / sumOfAllLinks) * 100) + "%";
      document.getElementById("pctInternalLinks").textContent = Math.round((statTotals.internalLinks / sumOfAllLinks) * 100) + "%";
      document.getElementById("pctExternalReferences").textContent = Math.round((statTotals.externalReferences / sumOfAllLinks) * 100) + "%";
      document.getElementById("pctPageLinks").textContent = Math.round((statTotals.pageLinks / sumOfAllLinks) * 100) + "%";
    } else {
      document.getElementById("pctAffiliateLinks").textContent = "0%";
      document.getElementById("pctNonAffiliateLinks").textContent = "0%";
      document.getElementById("pctInternalLinks").textContent = "0%";
      document.getElementById("pctExternalReferences").textContent = "0%";
      document.getElementById("pctPageLinks").textContent = "0%";
    }

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

    // Render diagnostic log lists
    var warningsLogContainer = document.getElementById("seoWarningsLog");
    warningsLogContainer.innerHTML = "";

    var calculatedWarningsCount = 0;
    var calculatedBrokenCount = 0;

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
          
          if (catKey === "brokenLinks") {
            calculatedBrokenCount++;
          } else {
            calculatedWarningsCount++;
          }
        });
        listRowItem.appendChild(nestedUl);
      }
      warningsLogContainer.appendChild(listRowItem);
    });

    var healthyArticlesCount = 0;
    var needsAttentionArticlesCount = 0;
    allArticles.forEach(function(art) {
      if ((art._completenessScore || 0) >= 85) {
        healthyArticlesCount++;
      } else {
        needsAttentionArticlesCount++;
      }
    });

    // Populate Top level Summary card metrics slots
    document.getElementById("summaryArticles").textContent = totalArticleCount;
    document.getElementById("summaryAffiliate").textContent = statTotals.affiliateLinks;
    document.getElementById("summaryInternal").textContent = statTotals.internalLinks;
    document.getElementById("summarySeoScore").textContent = computedScore + "/100";
    document.getElementById("summaryBrokenLinks").textContent = calculatedBrokenCount;
    document.getElementById("summaryWarnings").textContent = calculatedWarningsCount;
    document.getElementById("summaryHealthy").textContent = healthyArticlesCount;
    document.getElementById("summaryNeedsAttention").textContent = needsAttentionArticlesCount;
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
        if (formattedUrlSegment.charAt(0) !== "/") formattedUrlSegment = "/" + formattedUrlSegment;

        var determinedPriority = "0.8";
        if (article.comparisonTable) determinedPriority = "0.9";

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
    if (outputTextarea) outputTextarea.value = xmlOutputRows.join("\n");

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
    if (!sitemapTextarea || sitemapTextarea.value.trim() === "") return;

    sitemapTextarea.select();
    sitemapTextarea.setSelectionRange(0, 99999);

    try {
      var secureCopyActionStatus = document.execCommand("copy");
      if (secureCopyActionStatus) {
        var toastBox = document.getElementById("copyToast");
        if (toastBox) {
          toastBox.style.display = "inline";
          setTimeout(function () { toastBox.style.display = "none"; }, 2000);
        }
      }
    } catch (err) {}
  }

  function attachControlListeners() {
    var generateBtn = document.getElementById("btnGenerateSitemap");
    var copyBtn = document.getElementById("btnCopySitemap");
    if (generateBtn) generateBtn.addEventListener("click", manufactureSitemapContent);
    if (copyBtn) copyBtn.addEventListener("click", handleClipboardCopyAction);
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
