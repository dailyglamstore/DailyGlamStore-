(function () {
  var BASE_URL = "https://dailyglamstore.in";
  var DEDUCTION_PER_WARNING = 2;

  var allArticles = [];
  var skincareArticlesList = [];
  var haircareArticlesList = [];
  var comparisonArticlesCount = 0;
  var articleUrlsMap = {};
  var uniqueArticleKeys = {};
  
  // Section 1: Distinct independent properties mapping configurations 
  var diagnosticCategories = {
    seoTitle: { label: "SEO Titles", items: [], status: "pass", isFailType: false, type: "seo" },
    seoDescription: { label: "SEO Descriptions", items: [], status: "pass", isFailType: false, type: "seo" },
    intro: { label: "Intro", items: [], status: "pass", isFailType: false, type: "seo" },
    image: { label: "Images", items: [], status: "pass", isFailType: false, type: "seo" },
    faq: { label: "Missing FAQ", items: [], status: "pass", isFailType: false, type: "seo" },
    author: { label: "Authors", items: [], status: "pass", isFailType: false, type: "seo" },
    dateModified: { label: "Missing dateModified", items: [], status: "pass", isFailType: false, type: "seo" },
    emptySections: { label: "Empty Sections", items: [], status: "pass", isFailType: false, type: "seo" },
    brokenLinks: { label: "Broken Internal Links (Audited Arrays Only)", items: [], status: "pass", isFailType: false, type: "seo" },
    duplicateUrls: { label: "Duplicate URLs", items: [], status: "pass", isFailType: true, type: "seo" },
    duplicateKeys: { label: "Duplicate Keys", items: [], status: "pass", isFailType: true, type: "seo" },
    
    missingLinkPlan: { label: "Missing linkPlan Array", items: [], status: "pass", isFailType: false, type: "architecture" },
    missingRecommendations: { label: "Missing productRecommendations", items: [], status: "pass", isFailType: false, type: "architecture" },
    missingAlternativeProducts: { label: "Missing alternativeProducts", items: [], status: "pass", isFailType: false, type: "architecture" },
    missingLinkTypes: { label: "Missing Link Types", items: [], status: "pass", isFailType: false, type: "architecture" },
    invalidAffiliateProps: { label: "Invalid Affiliate Link Settings", items: [], status: "pass", isFailType: false, type: "architecture" },
    invalidTargetTabs: { label: "Invalid Target Tab (_blank / same-tab) Directives", items: [], status: "pass", isFailType: false, type: "architecture" },
    comparisonValidation: { label: "Comparison Article Validation", items: [], status: "pass", isFailType: false, type: "architecture" }
  };

  // Section 2: Split score deduction totals
  var seoIssueDeductions = 0;

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
      var historicalScanValue = localStorage.getItem("publisherLastScan");
      if (historicalScanValue) {
        scanDateNode.textContent = historicalScanValue;
      } else {
        scanDateNode.textContent = "First Scan";
      }
    }
  }

  function commitCurrentScanTimestamp() {
    try {
      var currentDate = new Date();
      var formattedDate = currentDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      var formattedTime = currentDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      var fullTimestampString = formattedDate + " • " + formattedTime;
      localStorage.setItem("publisherLastScan", fullTimestampString);
    } catch (e) {}
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

  function validateAffiliateProperty(item, locationContext, displayTitle) {
    if (!item.hasOwnProperty("affiliate")) {
      diagnosticCategories.invalidAffiliateProps.items.push(displayTitle + " → " + locationContext + " is missing the 'affiliate' property");
    } else if (typeof item.affiliate !== "boolean") {
      diagnosticCategories.invalidAffiliateProps.items.push(displayTitle + " → " + locationContext + " has a non-boolean affiliate property value");
    }
  }

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
    seoIssueDeductions = 0;

    Object.keys(uniqueArticleKeys).forEach(function (key) {
      if (uniqueArticleKeys[key].length > 1) {
        seoIssueDeductions++; // Duplicate keys belong to SEO section
        diagnosticCategories.duplicateKeys.items.push("Key '" + key + "' is repeated across multiple definitions");
      }
    });

    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";
      if (article.url) {
        var cleanPath = String(article.url).trim().toLowerCase();
        if (!articleUrlsMap[cleanPath]) articleUrlsMap[cleanPath] = [];
        articleUrlsMap[cleanPath].push(displayTitle);
      }
    });

    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";
      
      // Section 3: Dynamic Article Completion Point Allocation
      var completenessPoints = 0;
      var completenessTotalPossible = article.comparisonTable ? 14 : 11;

      var isNewArch = isUsingNewArchitecture(article);

      // --- SEO HEALTH SYSTEM CRITERIA ---
      if (article.seoTitle && String(article.seoTitle).trim() !== "") { completenessPoints++; } else {
        seoIssueDeductions++;
        diagnosticCategories.seoTitle.items.push(displayTitle);
      }
      if (article.seoDescription && String(article.seoDescription).trim() !== "") { completenessPoints++; } else {
        seoIssueDeductions++;
        diagnosticCategories.seoDescription.items.push(displayTitle);
      }
      if (article.intro && String(article.intro).trim() !== "") { completenessPoints++; } else {
        seoIssueDeductions++;
        diagnosticCategories.intro.items.push(displayTitle);
      }
      
      var trackingImageSource = (article.image && article.image.src) || article.src;
      if (trackingImageSource && String(trackingImageSource).trim() !== "") { completenessPoints++; } else {
        seoIssueDeductions++;
        diagnosticCategories.image.items.push(displayTitle);
      }

      if (article.faq && Array.isArray(article.faq) && article.faq.length > 0) { completenessPoints++; } else {
        seoIssueDeductions++;
        diagnosticCategories.faq.items.push(displayTitle);
      }
      if (article.relatedArticles && Array.isArray(article.relatedArticles) && article.relatedArticles.length > 0) { completenessPoints++; } else {
        seoIssueDeductions++;
        diagnosticCategories.relatedArticles.items.push(displayTitle);
      }

      var hasValidAuthor = false;
      if (article.author && Array.isArray(article.author)) {
        hasValidAuthor = article.author.some(function (auth) {
          return auth && auth.enabled === true && (auth.type === "Person" || auth.type === "Organization");
        });
      }
      if (hasValidAuthor) { completenessPoints++; } else {
        seoIssueDeductions++;
        diagnosticCategories.author.items.push(displayTitle);
      }

      if (article.dateModified) { completenessPoints++; } else {
        seoIssueDeductions++;
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
          seoIssueDeductions++;
          diagnosticCategories.emptySections.items.push(displayTitle);
        }
      } else {
        seoIssueDeductions++;
        diagnosticCategories.emptySections.items.push(displayTitle);
      }

      // --- PUBLISHING STANDARDS ARCHITECTURE CRITERIA ---
      var extractedLinks = [];
      var trueAffiliateCountForThisArticle = 0;

      if (article.linkPlan && Array.isArray(article.linkPlan)) {
        completenessPoints++;
        article.linkPlan.forEach(function (linkItem) {
          if (linkItem && typeof linkItem === "object") {
            extractedLinks.push(linkItem);
            
            if (!linkItem.type || String(linkItem.type).trim() === "") {
              diagnosticCategories.missingLinkTypes.items.push(displayTitle + " → " + (linkItem.anchorText || "Unknown text link") + " missing type");
            } else {
              var typeStr = String(linkItem.type).trim();
              if (typeStr === "affiliateProduct") {
                validateAffiliateProperty(linkItem, "linkPlan item", displayTitle);
                if (linkItem.affiliate === true) trueAffiliateCountForThisArticle++;
              }
              if (typeStr === "externalReference" && linkItem.newTab !== true) {
                diagnosticCategories.invalidTargetTabs.items.push(displayTitle + " (External reference must open in a new tab)");
              }
              if (typeStr === "page" && linkItem.newTab === true) {
                diagnosticCategories.invalidTargetTabs.items.push(displayTitle + " (Page item link must NOT open in a new tab)");
              }
              if (typeStr === "internalArticle" && linkItem.newTab === true) {
                diagnosticCategories.invalidTargetTabs.items.push(displayTitle + " (Internal article link must NOT open in a new tab)");
              }
            }
          }
        });
      } else {
        if (isNewArch || article.comparisonTable) {
          diagnosticCategories.missingLinkPlan.items.push(displayTitle);
        }
      }

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
      } else {
        if (isNewArch || article.comparisonTable) {
          diagnosticCategories.missingRecommendations.items.push(displayTitle);
        }
      }

      if (article.alternativeProducts && article.alternativeProducts.items && Array.isArray(article.alternativeProducts.items)) {
        if (article.comparisonTable) completenessPoints++;
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
      } else {
        if (article.comparisonTable) {
          diagnosticCategories.missingAlternativeProducts.items.push(displayTitle + " (Comparison missing alternativeProducts)");
        }
      }

      extractedLinks.forEach(function (lnk) {
        if (lnk.type === "affiliateProduct") {
          if (lnk.affiliate === true) statTotals.affiliateLinks++;
          if (lnk.affiliate === false) statTotals.nonAffiliateProducts++;
        }
        if (lnk.type === "internalArticle") statTotals.internalLinks++;
        if (lnk.type === "page") statTotals.pageLinks++;
        if (lnk.type === "externalReference") statTotals.externalReferences++;
      });

      if (article.comparisonTable) {
        comparisonArticlesCount++;
        if (article.comparisonTable.rows && Array.isArray(article.comparisonTable.rows) && article.comparisonTable.rows.length > 0) {
          completenessPoints++; 
        }

        var hasFaq = article.faq && Array.isArray(article.faq) && article.faq.length > 0;
        var hasCompRows = article.comparisonTable.rows && Array.isArray(article.comparisonTable.rows) && article.comparisonTable.rows.length > 0;
        var hasRecommendations = article.productRecommendations && article.productRecommendations.items && Array.isArray(article.productRecommendations.items) && article.productRecommendations.items.length > 0;
        var hasAltProducts = article.alternativeProducts && article.alternativeProducts.items && Array.isArray(article.alternativeProducts.items) && article.alternativeProducts.items.length > 0;
        var hasLPlan = article.linkPlan && Array.isArray(article.linkPlan) && article.linkPlan.length > 0;
        
        var meetsMinAffiliate = trueAffiliateCountForThisArticle >= 2;
        if (meetsMinAffiliate) {
          completenessPoints++;
        }
        
        if (!hasFaq || !hasCompRows || !hasRecommendations || !hasAltProducts || !hasLPlan || !meetsMinAffiliate) {
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

      // Feature 3 Formula Integration
      article._completenessScore = Math.min(Math.round((completenessPoints / completenessTotalPossible) * 100), 100);
    });

    Object.keys(articleUrlsMap).forEach(function (urlPath) {
      if (articleUrlsMap[urlPath].length > 1) {
        seoIssueDeductions += (articleUrlsMap[urlPath].length - 1);
        diagnosticCategories.duplicateUrls.items.push("Path '" + urlPath + "' linked in: " + articleUrlsMap[urlPath].join(" & "));
      }
    });

    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";
      if (article.linkPlan && Array.isArray(article.linkPlan)) {
        article.linkPlan.forEach(function (lnk) {
          if (lnk && lnk.type === "internalArticle" && lnk.href) {
            var targetInternalHref = String(lnk.href).trim().toLowerCase();
            if (!articleUrlsMap[targetInternalHref]) {
              seoIssueDeductions++;
              diagnosticCategories.brokenLinks.items.push("Broken Internal Link: " + displayTitle + " → " + lnk.href);
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
    var totalArticleCount = allArticles.length;
    document.getElementById("skincareCount").textContent = skincareArticlesList.length;
    document.getElementById("haircareCount").textContent = haircareArticlesList.length;
    document.getElementById("comparisonCount").textContent = comparisonArticlesCount;

    // Section 2: Calculate explicit SEO Score independently
    var computedSeoScore = 100 - (seoIssueDeductions * DEDUCTION_PER_WARNING);
    if (computedSeoScore < 0) computedSeoScore = 0;
    document.getElementById("seoScoreValue").textContent = computedSeoScore + "/100";

    // Section 4 & 7: Optimized Volume Aggregator & System Completion Average calculation logic
    var fullyOptimizedCount = 0;
    var aggregateCompletionSum = 0;
    allArticles.forEach(function (art) {
      var score = art._completenessScore || 0;
      aggregateCompletionSum += score;
      if (score >= 85) {
        fullyOptimizedCount++;
      }
    });
    
    document.getElementById("fullyOptimizedValue").textContent = fullyOptimizedCount + " / " + totalArticleCount;
    var calculatedAvgCompletion = totalArticleCount > 0 ? Math.round(aggregateCompletionSum / totalArticleCount) : 0;
    document.getElementById("avgCompletionValue").textContent = calculatedAvgCompletion + "%";

    // Keep matching data points across identical nodes inside standard card slots
    document.getElementById("totalAffiliateLinks").textContent = statTotals.affiliateLinks;
    document.getElementById("totalNonAffiliateProducts").textContent = statTotals.nonAffiliateProducts;
    document.getElementById("totalInternalLinks").textContent = statTotals.internalLinks;
    document.getElementById("totalPageLinks").textContent = statTotals.pageLinks;
    document.getElementById("totalExternalReferences").textContent = statTotals.externalReferences;
    
    var altTargetNode = document.getElementById("totalAlternativeProducts") || document.getElementById("totalAlternativeBoxes");
    if (altTargetNode) altTargetNode.textContent = statTotals.altProductLinks;

    document.getElementById("totalRecButtons").textContent = statTotals.recButtons;
    document.getElementById("avgInternalLinks").textContent = totalArticleCount > 0 ? (statTotals.internalLinks / totalArticleCount).toFixed(2) : "0";

    var sumOfAllLinks = statTotals.affiliateLinks + statTotals.nonAffiliateProducts + statTotals.internalLinks + statTotals.externalReferences + statTotals.pageLinks;
    if (sumOfAllLinks > 0) {
      document.getElementById("pctAffiliateLinks").textContent = Math.round((statTotals.affiliateLinks / sumOfAllLinks) * 100) + "%";
      document.getElementById("pctNonAffiliateLinks").textContent = Math.round((statTotals.nonAffiliateProducts / sumOfAllLinks) * 100) + "%";
      document.getElementById("pctInternalLinks").textContent = Math.round((statTotals.internalLinks / sumOfAllLinks) * 100) + "%";
      document.getElementById("pctExternalReferences").textContent = Math.round((statTotals.externalReferences / sumOfAllLinks) * 100) + "%";
      document.getElementById("pctPageLinks").textContent = Math.round((statTotals.pageLinks / sumOfAllLinks) * 100) + "%";
    }

    // Section 1 & 5: Populate Split Log Systems & Auto summaries
    var seoWarningsLogContainer = document.getElementById("seoWarningsLog");
    var archWarningsLogContainer = document.getElementById("archWarningsLog");
    
    seoWarningsLogContainer.innerHTML = "";
    archWarningsLogContainer.innerHTML = "";

    var seoPassedCount = 0, seoTotalCount = 0, seoAttentionCount = 0;
    var archPassedCount = 0, archTotalCount = 0, archAttentionCount = 0;

    var activeWarnCategoryNames = [];
    var calculatedBrokenCount = 0;
    var calculatedWarningsCount = 0;

    Object.keys(diagnosticCategories).forEach(function (catKey) {
      var cat = diagnosticCategories[catKey];
      var listRowItem = document.createElement("li");
      
      if (cat.status === "pass") {
        listRowItem.className = "log-pass";
        listRowItem.textContent = "✅ " + cat.label;
        if (cat.type === "seo") { seoPassedCount++; seoTotalCount++; } 
        else { archPassedCount++; archTotalCount++; }
      } else {
        listRowItem.className = cat.status === "warn" ? "log-warn" : "log-fail";
        var prefixSign = cat.status === "warn" ? "⚠ " : "❌ ";
        var itemsCounterText = cat.isFailType ? "" : " (" + cat.items.length + ")";
        listRowItem.textContent = prefixSign + cat.label + itemsCounterText;
        
        if (cat.status === "warn") activeWarnCategoryNames.push(catKey);

        if (cat.type === "seo") { seoTotalCount++; seoAttentionCount++; } 
        else { archTotalCount++; archAttentionCount++; }

        var nestedUl = document.createElement("ul");
        nestedUl.className = "warning-nested-list";
        cat.items.forEach(function (nestedText) {
          var nestedLi = document.createElement("li");
          nestedLi.textContent = "• " + nestedText;
          nestedUl.appendChild(nestedLi);
          if (catKey === "brokenLinks") calculatedBrokenCount++; else calculatedWarningsCount++;
        });
        listRowItem.appendChild(nestedUl);
      }

      if (cat.type === "seo") seoWarningsLogContainer.appendChild(listRowItem);
      else archWarningsLogContainer.appendChild(listRowItem);
    });

    // Output Section Summaries via Text nodes
    document.getElementById("seoWarningsSummaryMeta").textContent = "Passed: " + seoPassedCount + " / " + seoTotalCount + " • Needs Attention: " + seoAttentionCount;
    document.getElementById("archWarningsSummaryMeta").textContent = "Passed: " + archPassedCount + " / " + archTotalCount + " • Needs Attention: " + archAttentionCount;

    // Sync elements for Today's Scan Summary card
    document.getElementById("summaryArticles").textContent = totalArticleCount;
    document.getElementById("summaryAffiliate").textContent = statTotals.affiliateLinks;
    document.getElementById("summaryInternal").textContent = statTotals.internalLinks;
    document.getElementById("summarySeoScore").textContent = computedSeoScore + "/100";
    document.getElementById("summaryBrokenLinks").textContent = calculatedBrokenCount;
    document.getElementById("summaryWarnings").textContent = calculatedWarningsCount;
    document.getElementById("summaryHealthy").textContent = fullyOptimizedCount;
    document.getElementById("summaryNeedsAttention").textContent = activeWarnCategoryNames.length;

    var needsAttentionSubSlot = document.getElementById("summaryNeedsAttentionCategories");
    if (needsAttentionSubSlot) {
      needsAttentionSubSlot.innerHTML = "";
      activeWarnCategoryNames.forEach(function (keyName) {
        var badge = document.createElement("div");
        badge.textContent = keyName;
        needsAttentionSubSlot.appendChild(badge);
      });
    }
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
        var determinedPriority = article.comparisonTable ? "0.9" : "0.8";
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
    document.getElementById("sitemapContainer").value = xmlOutputRows.join("\n");
    document.getElementById("sitemapUrlCount").textContent = totalUrlElementsCalculated + " URLs";
    document.getElementById("sitemapGenDate").textContent = new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric"
    });
    document.getElementById("sitemapSummary").style.display = "block";
  }

  function handleClipboardCopyAction() {
    var sitemapTextarea = document.getElementById("sitemapContainer");
    if (!sitemapTextarea || sitemapTextarea.value.trim() === "") return;
    sitemapTextarea.select();
    try {
      if (document.execCommand("copy")) {
        var toastBox = document.getElementById("copyToast");
        toastBox.style.display = "inline";
        setTimeout(function () { toastBox.style.display = "none"; }, 2000);
      }
    } catch (err) {}
  }

  // Section 6: Overhauled Full Export CSV Generation Sequence Mapping
  function exportHealthyArticlesCsv() {
    var csvRows = [];
    
    function formatCsvDate(rawDateString) {
      if (!rawDateString || String(rawDateString).trim() === "") return "";
      var parsedDate = new Date(rawDateString);
      if (isNaN(parsedDate.getTime())) return rawDateString;
      var baseFormattedDate = parsedDate.toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
      });
      if (String(rawDateString).indexOf("T") !== -1 || String(rawDateString).indexOf(":") !== -1) {
        return baseFormattedDate + " • " + parsedDate.toLocaleTimeString("en-US", {
          hour: "numeric", minute: "2-digit", hour12: true
        });
      }
      return baseFormattedDate;
    }

    // Explicit re-ordered structured column headers configuration
    csvRows.push("Title,URL,Category,SEO Score,Article Completion,Published Date,Last Modified,Word Count,Status");

    allArticles.forEach(function (article) {
      var cleanTitle = (article.title || article.key || "").replace(/"/g, '""');
      if (cleanTitle.indexOf(",") !== -1 || cleanTitle.indexOf('"') !== -1 || cleanTitle.indexOf("\n") !== -1) {
        cleanTitle = '"' + cleanTitle + '"';
      }

      var relativeUrl = article.url || "";
      var category = article.comparisonTable ? "Comparison" : (haircareArticlesList.some(function(h){return h.key === article.key;}) ? "Haircare" : "Skincare");
      
      // Calculate individual article component deductions to map standalone SEO Score column
      var individualSeoDeductions = 0;
      var checkKeys = ["seoTitle", "seoDescription", "intro", "image", "faq", "author", "dateModified", "emptySections", "brokenLinks"];
      checkKeys.forEach(function(ck) {
        if (diagnosticCategories[ck].items.indexOf(article.title || article.key) !== -1) {
          individualSeoDeductions++;
        }
      });
      
      var individualSeoScore = 100 - (individualSeoDeductions * DEDUCTION_PER_WARNING);
      if (individualSeoScore < 0) individualSeoScore = 0;

      var articleCompletion = article._completenessScore || 0;
      var publishedDate = formatCsvDate(article.date || "");
      var lastModified = formatCsvDate(article.dateModified || "");
      var wordCount = countWordsInContent(article);
      
      // Section 7: Threshold assignment mapping status flags
      var statusFlag = (articleCompletion >= 85) ? "Fully Optimized" : "Needs Attention";

      if (publishedDate.indexOf(",") !== -1) publishedDate = '"' + publishedDate + '"';
      if (lastModified.indexOf(",") !== -1) lastModified = '"' + lastModified + '"';

      csvRows.push([cleanTitle, relativeUrl, category, individualSeoScore, articleCompletion + "%", publishedDate, lastModified, wordCount, statusFlag].join(","));
    });

    var csvStringContent = csvRows.join("\n");
    var blobObject = new Blob([csvStringContent], { type: "text/csv;charset=utf-8;" });
    var downloadLink = document.createElement("a");
    var todayStamp = getFormattedToday(); 
    
    // File named explicitly per criteria format definition rules
    downloadLink.download = "articles-audit-" + todayStamp + ".csv";
    downloadLink.href = URL.createObjectURL(blobObject);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  function attachControlListeners() {
    var generateBtn = document.getElementById("btnGenerateSitemap");
    var copyBtn = document.getElementById("btnCopySitemap");
    var exportCsvBtn = document.getElementById("btnExportCsv");
    
    if (generateBtn) generateBtn.addEventListener("click", manufactureSitemapContent);
    if (copyBtn) copyBtn.addEventListener("click", handleClipboardCopyAction);
    if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportHealthyArticlesCsv);
  }

  function runEnginePipeline() {
    initLiveTimestamp(); 
    gatherSourceObjects();
    processContentStatistics();
    runCategorizedAudit();
    paintInterfaceOutputs();
    attachControlListeners();
    commitCurrentScanTimestamp(); 
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runEnginePipeline);
  } else {
    runEnginePipeline();
  }
})();
