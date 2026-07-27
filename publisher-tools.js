(function () {
  var BASE_URL = "https://dailyglamstore.in";
  var allArticles = [];
  var skincareArticlesList = [];
  var haircareArticlesList = [];
  var comparisonArticlesCount = 0;
  var articleUrlsMap = {};
  var uniqueArticleKeys = {};

  // SEO Diagnostic Categories
  var seoCategories = {
    seoTitle: { label: "SEO Title", items: [], status: "pass" },
    seoDescription: { label: "SEO Description", items: [], status: "pass" },
    intro: { label: "Intro Placement", items: [], status: "pass" },
    image: { label: "Featured Image", items: [], status: "pass" },
    faq: { label: "FAQ Block", items: [], status: "pass" },
    author: { label: "Author Details", items: [], status: "pass" },
    dateModified: { label: "dateModified Timestamp", items: [], status: "pass" },
    emptySections: { label: "Empty Sections / Blocks", items: [], status: "pass" },
    minLength: { label: "Minimum Content Length", items: [], status: "pass" },
    brokenLinks: { label: "Broken Internal Links", items: [], status: "pass" },
    duplicateUrls: { label: "Duplicate URLs Across Manifests", items: [], status: "pass" },
    duplicateKeys: { label: "Duplicate Keys Across Inventories", items: [], status: "pass" }
  };

  // Architecture Diagnostic Categories
  var archCategories = {
    relatedArticles: { label: "Related Articles", items: [], status: "pass" },
    linkPlan: { label: "Internal Link Coverage", items: [], status: "pass" },
    productRecommendations: { label: "Product Recommendations", items: [], status: "pass" },
    alternativeProducts: { label: "Alternative Products Matrix", items: [], status: "pass" },
    comparisonTable: { label: "Comparison Table", items: [], status: "pass" },
    minAffiliate: { label: "Minimum two affiliate:true links", items: [], status: "pass" },
    invalidAffiliateProps: { label: "Invalid Affiliate Link Settings", items: [], status: "pass" }
  };

  // Standards Tracking counters
  var stdCovered = {
    seoTitle: 0, seoDescription: 0, intro: 0, image: 0, faq: 0, dateModified: 0,
    author: 0, emptySections: 0, relatedArticles: 0, linkPlan: 0, productRecommendations: 0
  };
  var compCovered = {
    seoTitle: 0, seoDescription: 0, intro: 0, image: 0, faq: 0, dateModified: 0,
    author: 0, emptySections: 0, relatedArticles: 0, linkPlan: 0, productRecommendations: 0,
    alternativeProducts: 0, comparisonTable: 0, minAffiliate: 0
  };

  var failedSeoNamesList = [];
  var failedArchNamesList = [];

  var totalTechnicalDeductionPoints = 0;
  var duplicateUrlCount = 0;
  var duplicateKeyCount = 0;
  var brokenInternalLinksCount = 0;
  var totalArticlesAffectedBySeoWarnings = 0;

  var statTotals = {
    affiliateLinks: 0,
    nonAffiliateProducts: 0,
    internalLinks: 0,
    pageLinks: 0,
    externalReferences: 0,
    altProductLinks: 0,
    recButtons: 0
  };

  // Timestamp Handler
  function initLiveTimestamp() {
    var scanDateNode = document.getElementById("scanDate");
    if (scanDateNode) {
      var historicalScanValue = localStorage.getItem("publisherLastScan");
      scanDateNode.textContent = historicalScanValue ? historicalScanValue : "First Scan";
    }
  }

  function commitCurrentScanTimestamp() {
    try {
      var currentDate = new Date();
      var formattedDate = currentDate.toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
      });
      var formattedTime = currentDate.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true
      });
      localStorage.setItem("publisherLastScan", formattedDate + " " + formattedTime);
    } catch (e) {}
  }

  function getFormattedToday() {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var dd = String(today.getDate()).padStart(2, "0");
    return yyyy + "_" + mm + "_" + dd;
  }

  // Inventory Aggregation
  function gatherSourceObjects() {
    allArticles = [];
    skincareArticlesList = [];
    haircareArticlesList = [];
    uniqueArticleKeys = {};

    var skincareSource = window.SKINCARE_ARTICLES || {};
    var haircareSource = window.HAIRCARE_ARTICLES || {};

    Object.keys(skincareSource).forEach(function (key) {
      var item = skincareSource[key];
      if (item && typeof item === "object") {
        item.key = key;
        skincareArticlesList.push(item);
        allArticles.push(item);
        if (!uniqueArticleKeys[key]) uniqueArticleKeys[key] = [];
        uniqueArticleKeys[key].push(item.title || key);
      }
    });

    Object.keys(haircareSource).forEach(function (key) {
      var item = haircareSource[key];
      if (item && typeof item === "object") {
        item.key = key;
        haircareArticlesList.push(item);
        allArticles.push(item);
        if (!uniqueArticleKeys[key]) uniqueArticleKeys[key] = [];
        uniqueArticleKeys[key].push(item.title || key);
      }
    });
  }

  // Robust universal extractor for word counts, embedded links, and structural flags
  function extractArticleContentAndLinks(article) {
    var contentText = [];
    var links = [];
    var hasFaqBlock = false;
    var hasCompTable = false;
    var hasAltProducts = false;
    var hasRecs = false;

    if (article.title) contentText.push(article.title);
    if (article.seoTitle) contentText.push(article.seoTitle);
    if (article.seoDescription) contentText.push(article.seoDescription);
    if (article.intro) contentText.push(article.intro);

    // Extract links from top-level linkPlan array
    if (article.linkPlan && Array.isArray(article.linkPlan)) {
      links = links.concat(article.linkPlan);
    }

    // Extract recommendations from top-level productRecommendations object
    if (article.productRecommendations && article.productRecommendations.items) {
      hasRecs = true;
      links = links.concat(article.productRecommendations.items);
    }

    // Extract alternative products from top-level alternativeProducts object
    if (article.alternativeProducts && article.alternativeProducts.items) {
      hasAltProducts = true;
      links = links.concat(article.alternativeProducts.items);
    }

    if (article.comparisonTable) {
      hasCompTable = true;
    }

    // Process block streams across top-level blocks or sections
    var blocksToProcess = [];
    if (Array.isArray(article.blocks)) {
      blocksToProcess = blocksToProcess.concat(article.blocks);
    }
    if (Array.isArray(article.sections)) {
      article.sections.forEach(function (sec) {
        if (sec.heading) contentText.push(sec.heading);
        if (Array.isArray(sec.blocks)) {
          blocksToProcess = blocksToProcess.concat(sec.blocks);
        }
      });
    }

    blocksToProcess.forEach(function (b) {
      if (!b || typeof b !== "object") return;

      if (b.heading) contentText.push(b.heading);
      if (b.content) contentText.push(b.content);
      if (b.text) contentText.push(b.text);

      if (Array.isArray(b.paragraphs)) {
        contentText.push(b.paragraphs.join(" "));
      }
      if (Array.isArray(b.items)) {
        b.items.forEach(function (it) {
          if (typeof it === "string") contentText.push(it);
          else if (it && typeof it === "object") {
            if (it.title) contentText.push(it.title);
            if (it.description) contentText.push(it.description);
            if (it.href || it.url) links.push(it);
          }
        });
      }

      if (b.type === "faq" || b.faq || b.type === "accordion") hasFaqBlock = true;
      if (b.type === "comparisonTable" || b.comparisonTable) hasCompTable = true;
      if (b.type === "alternativeProducts" || b.type === "productGrid") hasAltProducts = true;
      if (b.type === "productRecommendation" || b.type === "productCard") hasRecs = true;

      if (b.href || b.url) links.push(b);
    });

    // Handle traditional FAQ array
    if (article.faq && Array.isArray(article.faq) && article.faq.length > 0) {
      hasFaqBlock = true;
      article.faq.forEach(function (f) {
        if (f.question) contentText.push(f.question);
        if (f.answer) contentText.push(f.answer);
      });
    }

    var fullText = contentText.join(" ").trim();
    var words = fullText === "" ? [] : fullText.split(/\s+/);

    return {
      wordCount: words.length,
      links: links,
      hasFaq: hasFaqBlock,
      hasComparisonTable: hasCompTable,
      hasAltProducts: hasAltProducts,
      hasRecommendations: hasRecs
    };
  }

  function countWordsInContent(article) {
    return extractArticleContentAndLinks(article).wordCount;
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
        longestTitle = art.title || art.key || "Unnamed";
      }
      if (art.date) {
        var dObj = new Date(art.date);
        if (!isNaN(dObj.getTime())) {
          validDatedArticles.push({ title: art.title || art.key || "Unnamed", date: dObj });
          if (dObj.getFullYear() === currentYear && dObj.getMonth() === currentMonth) {
            itemsPublishedThisMonth++;
          }
        }
      }
    });

    var avgWordsNode = document.getElementById("avgWordCount");
    if (avgWordsNode) avgWordsNode.textContent = Math.round(totalWords / allArticles.length);

    var pubMonthNode = document.getElementById("publishedThisMonthCount");
    if (pubMonthNode) pubMonthNode.textContent = itemsPublishedThisMonth;

    var longestNode = document.getElementById("longestArticleInfo");
    if (longestNode) longestNode.textContent = longestTitle + " (" + maxWords + " words)";

    if (validDatedArticles.length > 0) {
      validDatedArticles.sort(function (a, b) { return b.date - a.date; });
      var options = { day: "numeric", month: "short", year: "numeric" };
      
      var newestNode = document.getElementById("newestArticleInfo");
      if (newestNode) {
        newestNode.textContent = validDatedArticles[0].title + " - " + validDatedArticles[0].date.toLocaleDateString("en-GB", options);
      }

      var oldestNode = document.getElementById("oldestArticleInfo");
      if (oldestNode) {
        oldestNode.textContent = validDatedArticles[validDatedArticles.length - 1].title + " - " + validDatedArticles[validDatedArticles.length - 1].date.toLocaleDateString("en-GB", options);
      }
    }
  }

  function validateAffiliateProperty(item, locationContext, displayTitle) {
    if (!item.hasOwnProperty("affiliate")) {
      archCategories.invalidAffiliateProps.items.push(displayTitle + " -> " + locationContext + " is missing 'affiliate' property");
      return false;
    } else if (typeof item.affiliate !== "boolean") {
      archCategories.invalidAffiliateProps.items.push(displayTitle + " -> " + locationContext + " has a non-boolean affiliate value");
      return false;
    }
    return true;
  }

  function runCategorizedAudit() {
    statTotals.affiliateLinks = 0;
    statTotals.nonAffiliateProducts = 0;
    statTotals.internalLinks = 0;
    statTotals.pageLinks = 0;
    statTotals.externalReferences = 0;
    statTotals.altProductLinks = 0;
    statTotals.recButtons = 0;
    comparisonArticlesCount = 0;
    duplicateUrlCount = 0;
    duplicateKeyCount = 0;
    brokenInternalLinksCount = 0;
    totalArticlesAffectedBySeoWarnings = 0;
    articleUrlsMap = {};
    failedSeoNamesList = [];
    failedArchNamesList = [];

    Object.keys(stdCovered).forEach(function(k) { stdCovered[k] = 0; });
    Object.keys(compCovered).forEach(function(k) { compCovered[k] = 0; });
    Object.keys(seoCategories).forEach(function(k){ seoCategories[k].items = []; seoCategories[k].status = "pass"; });
    Object.keys(archCategories).forEach(function(k){ archCategories[k].items = []; archCategories[k].status = "pass"; });

    // Technical Check 1: Duplicate Keys
    Object.keys(uniqueArticleKeys).forEach(function (key) {
      if (uniqueArticleKeys[key].length > 1) {
        duplicateKeyCount += (uniqueArticleKeys[key].length - 1);
        seoCategories.duplicateKeys.items.push("Inventory Key '" + key + "' repeated across definitions");
      }
    });

    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";
      article._missingSeo = [];
      article._missingArch = [];
      if (article.url) {
        var cleanPath = String(article.url).trim().toLowerCase();
        if (!articleUrlsMap[cleanPath]) articleUrlsMap[cleanPath] = [];
        articleUrlsMap[cleanPath].push(displayTitle);
      }
    });

    // Technical Check 2: Duplicate Target URLs
    Object.keys(articleUrlsMap).forEach(function (urlPath) {
      if (articleUrlsMap[urlPath].length > 1) {
        duplicateUrlCount += (articleUrlsMap[urlPath].length - 1);
        seoCategories.duplicateUrls.items.push("Path Target '" + urlPath + "' repeated inside: " + articleUrlsMap[urlPath].join(" & "));
      }
    });

    // Primary validation loop
    allArticles.forEach(function (article) {
      var displayTitle = article.title || article.key || "Unnamed Article";
      var extracted = extractArticleContentAndLinks(article);
      var isComp = !!(article.comparisonTable || extracted.hasComparisonTable);
      var wordCount = extracted.wordCount;

      var hasSeoTitle = !!(article.seoTitle && String(article.seoTitle).trim() !== "");
      var hasSeoDesc = !!(article.seoDescription && String(article.seoDescription).trim() !== "");
      var hasIntro = !!(article.intro && String(article.intro).trim() !== "");
      var trackingImageSource = (article.image && article.image.src) || article.src || article.featuredImage;
      var hasImage = !!(trackingImageSource && String(trackingImageSource).trim() !== "");
      var hasFaq = extracted.hasFaq;
      var hasDateModified = !!(article.dateModified || article.updatedAt);

      var hasValidAuthor = false;
      if (article.author) {
        if (typeof article.author === "string" && article.author.trim() !== "") {
          hasValidAuthor = true;
        } else if (typeof article.author === "object") {
          if (Array.isArray(article.author)) {
            hasValidAuthor = article.author.some(function (auth) {
              return auth && (auth.enabled === true || auth.name || auth.type);
            });
          } else {
            hasValidAuthor = !!(article.author.name || article.author.enabled);
          }
        }
      }

      var hasNoEmptySections = wordCount > 100;
      var hasRelated = !!(article.relatedArticles && Array.isArray(article.relatedArticles) && article.relatedArticles.length > 0);
      var hasLinkPlan = extracted.links.length > 0;
      var hasRecommendations = extracted.hasRecommendations;

      // --- LAYER 1: SEO AUDIT ---
      var seoEarnedPoints = 0;
      var seoTotalPossible = 9;

      if (hasSeoTitle) seoEarnedPoints++; else { seoCategories.seoTitle.items.push(displayTitle); article._missingSeo.push("SEO Title"); }
      if (hasSeoDesc) seoEarnedPoints++; else { seoCategories.seoDescription.items.push(displayTitle); article._missingSeo.push("SEO Description"); }
      if (hasIntro) seoEarnedPoints++; else { seoCategories.intro.items.push(displayTitle); article._missingSeo.push("Intro Placement"); }
      if (hasImage) seoEarnedPoints++; else { seoCategories.image.items.push(displayTitle); article._missingSeo.push("Featured Image"); }
      if (hasFaq) seoEarnedPoints++; else { seoCategories.faq.items.push(displayTitle); article._missingSeo.push("FAQ Block"); }
      if (hasDateModified) seoEarnedPoints++; else { seoCategories.dateModified.items.push(displayTitle); article._missingSeo.push("dateModified"); }
      if (hasValidAuthor) seoEarnedPoints++; else { seoCategories.author.items.push(displayTitle); article._missingSeo.push("Author Details"); }
      if (hasNoEmptySections) seoEarnedPoints++; else { seoCategories.emptySections.items.push(displayTitle); article._missingSeo.push("Empty Sections"); }

      var requiredLength = isComp ? 1000 : 600;
      if (wordCount >= requiredLength) {
        seoEarnedPoints++;
      } else {
        seoCategories.minLength.items.push(displayTitle + " (" + wordCount + "/" + requiredLength + " words)");
        article._missingSeo.push("Minimum Content Length");
      }

      var hasBrokenLinks = false;
      extracted.links.forEach(function (lnk) {
        if (lnk && (lnk.type === "internalArticle" || lnk.type === "internal") && (lnk.href || lnk.url)) {
          var targetHref = String(lnk.href || lnk.url).trim().toLowerCase();
          if (!articleUrlsMap[targetHref]) {
            brokenInternalLinksCount++;
            hasBrokenLinks = true;
            seoCategories.brokenLinks.items.push("Broken link target: " + displayTitle + " -> " + targetHref);
          }
        }
      });

      if (hasBrokenLinks) {
        article._missingSeo.push("Broken Internal Links");
      }

      article._seoScore = Math.round((seoEarnedPoints / seoTotalPossible) * 100);
      if (article._missingSeo.length > 0) totalArticlesAffectedBySeoWarnings++;

      // --- LAYER 2: ARCHITECTURE AUDIT ---
      var archEarnedPoints = 0;
      var archTotalPossible = isComp ? 14 : 11;
      var trueAffiliateCountForThisArticle = 0;

      if (hasSeoTitle) archEarnedPoints++; else article._missingArch.push("SEO Title");
      if (hasSeoDesc) archEarnedPoints++; else article._missingArch.push("SEO Description");
      if (hasIntro) archEarnedPoints++; else article._missingArch.push("Intro Placement");
      if (hasImage) archEarnedPoints++; else article._missingArch.push("Featured Image");
      if (hasFaq) archEarnedPoints++; else article._missingArch.push("FAQ Block");
      if (hasDateModified) archEarnedPoints++; else article._missingArch.push("dateModified");
      if (hasValidAuthor) archEarnedPoints++; else article._missingArch.push("Author Details");
      if (hasNoEmptySections) archEarnedPoints++; else article._missingArch.push("No Empty Sections");

      if (hasRelated) archEarnedPoints++; else { article._missingArch.push("Related Articles"); archCategories.relatedArticles.items.push(displayTitle); }
      if (hasLinkPlan) archEarnedPoints++; else { article._missingArch.push("Internal Link Coverage"); archCategories.linkPlan.items.push(displayTitle); }
      if (hasRecommendations) archEarnedPoints++; else { article._missingArch.push("Product Recommendations"); archCategories.productRecommendations.items.push(displayTitle); }

      extracted.links.forEach(function (linkItem) {
        if (!linkItem || typeof linkItem !== "object") return;

        var typeStr = String(linkItem.type || "").trim();
        if (typeStr === "affiliateProduct" || linkItem.affiliate !== undefined) {
          validateAffiliateProperty(linkItem, "product block", displayTitle);
          if (linkItem.affiliate === true) {
            trueAffiliateCountForThisArticle++;
            statTotals.affiliateLinks++;
          } else {
            statTotals.nonAffiliateProducts++;
          }
        } else if (typeStr === "internalArticle" || typeStr === "internal") {
          statTotals.internalLinks++;
        } else if (typeStr === "page") {
          statTotals.pageLinks++;
        } else if (typeStr === "externalReference" || typeStr === "external") {
          statTotals.externalReferences++;
        }
      });

      if (!isComp) {
        if (hasSeoTitle) stdCovered.seoTitle++;
        if (hasSeoDesc) stdCovered.seoDescription++;
        if (hasIntro) stdCovered.intro++;
        if (hasImage) stdCovered.image++;
        if (hasFaq) stdCovered.faq++;
        if (hasDateModified) stdCovered.dateModified++;
        if (hasValidAuthor) stdCovered.author++;
        if (hasNoEmptySections) stdCovered.emptySections++;
        if (hasRelated) stdCovered.relatedArticles++;
        if (hasLinkPlan) stdCovered.linkPlan++;
        if (hasRecommendations) stdCovered.productRecommendations++;
      } else {
        comparisonArticlesCount++;
        if (hasSeoTitle) compCovered.seoTitle++;
        if (hasSeoDesc) compCovered.seoDescription++;
        if (hasIntro) compCovered.intro++;
        if (hasImage) compCovered.image++;
        if (hasFaq) compCovered.faq++;
        if (hasDateModified) compCovered.dateModified++;
        if (hasValidAuthor) compCovered.author++;
        if (hasNoEmptySections) compCovered.emptySections++;
        if (hasRelated) compCovered.relatedArticles++;
        if (hasLinkPlan) compCovered.linkPlan++;
        if (hasRecommendations) compCovered.productRecommendations++;

        if (extracted.hasComparisonTable) {
          archEarnedPoints++;
          compCovered.comparisonTable++;
        } else {
          article._missingArch.push("Comparison Table");
          archCategories.comparisonTable.items.push(displayTitle);
        }

        if (extracted.hasAltProducts) {
          archEarnedPoints++;
          compCovered.alternativeProducts++;
        } else {
          article._missingArch.push("Alternative Products Matrix");
          archCategories.alternativeProducts.items.push(displayTitle);
        }

        var meetsMinAffiliate = trueAffiliateCountForThisArticle >= 2;
        if (meetsMinAffiliate) {
          archEarnedPoints++;
          compCovered.minAffiliate++;
        } else {
          article._missingArch.push("Minimum two affiliate:true links");
          archCategories.minAffiliate.items.push(displayTitle + " (" + trueAffiliateCountForThisArticle + " verified)");
        }
      }

      article._completenessScore = Math.min(Math.round((archEarnedPoints / archTotalPossible) * 100), 100);
    });

    Object.keys(seoCategories).forEach(function (k) {
      if (seoCategories[k].items.length > 0) {
        seoCategories[k].status = "warn";
        failedSeoNamesList.push(seoCategories[k].label);
      }
    });

    Object.keys(archCategories).forEach(function (k) {
      if (archCategories[k].items.length > 0) {
        archCategories[k].status = "warn";
        if (failedArchNamesList.indexOf(archCategories[k].label) === -1) {
          failedArchNamesList.push(archCategories[k].label);
        }
      }
    });

    var totalRawDeductions = (duplicateUrlCount * 2) + (duplicateKeyCount * 2) + (brokenInternalLinksCount * 1);
    totalTechnicalDeductionPoints = Math.min(totalRawDeductions, 10);
  }

  // Paint UI Elements and Sync All Dashboard Indicators
  function paintInterfaceOutputs() {
    var totalArticleCount = allArticles.length;
    var totalSeoSum = 0;
    var totalCompletionSum = 0;
    var fullyOptimizedCount = 0;

    allArticles.forEach(function (art) {
      totalSeoSum += (art._seoScore || 0);
      totalCompletionSum += (art._completenessScore || 0);
      if ((art._completenessScore || 0) >= 85) fullyOptimizedCount++;
    });

    var averageArticleSeoScore = totalArticleCount > 0 ? Math.round(totalSeoSum / totalArticleCount) : 100;
    var websiteSeoScore = Math.max(0, averageArticleSeoScore - totalTechnicalDeductionPoints);
    var globalAvgCompletion = totalArticleCount > 0 ? Math.round(totalCompletionSum / totalArticleCount) : 0;

    // Website Health Card
    document.getElementById("seoScoreValue").textContent = websiteSeoScore + " / 100";
    document.getElementById("fullyOptimizedCount").textContent = fullyOptimizedCount + " / " + totalArticleCount;
    document.getElementById("avgArticleCompletion").textContent = globalAvgCompletion + "%";
    document.getElementById("totalCount").textContent = totalArticleCount;

    // Today's Scan Summary Card
    var setEl = function (id, val) {
      var node = document.getElementById(id);
      if (node) node.textContent = val;
    };

    setEl("summaryArticles", totalArticleCount);
    setEl("summaryAffiliate", statTotals.affiliateLinks);
    setEl("summaryInternal", statTotals.internalLinks);
    setEl("summarySeoScore", websiteSeoScore + "/100");
    setEl("summaryBrokenLinks", brokenInternalLinksCount);
    setEl("summarySeoWarningCategories", failedSeoNamesList.length);
    setEl("summaryAffectedArticles", totalArticlesAffectedBySeoWarnings);
    setEl("summaryArchWarningCategories", failedArchNamesList.length);
    setEl("summaryHealthy", fullyOptimizedCount);

    var attentionNode = document.getElementById("summaryNeedsAttentionCategories");
    if (attentionNode) {
      attentionNode.innerHTML = "";
      failedArchNamesList.forEach(function (catName) {
        var div = document.createElement("div");
        div.textContent = catName;
        attentionNode.appendChild(div);
      });
    }

    // Article Statistics Card
    setEl("skincareCount", skincareArticlesList.length);
    setEl("haircareCount", haircareArticlesList.length);
    setEl("comparisonCount", comparisonArticlesCount);
    setEl("avgSeoScore", averageArticleSeoScore + " / 100");
    setEl("techDeductionsValue", totalTechnicalDeductionPoints === 0 ? "0" : "−" + totalTechnicalDeductionPoints);

    // Extended Link Metrics Card
    setEl("totalAffiliateLinks", statTotals.affiliateLinks);
    setEl("totalNonAffiliateProducts", statTotals.nonAffiliateProducts);
    setEl("totalInternalLinks", statTotals.internalLinks);
    setEl("totalPageLinks", statTotals.pageLinks);
    setEl("totalExternalReferences", statTotals.externalReferences);
    setEl("totalAlternativeProducts", statTotals.altProductLinks);
    setEl("totalRecButtons", statTotals.recButtons);
    setEl("avgInternalLinks", totalArticleCount > 0 ? (statTotals.internalLinks / totalArticleCount).toFixed(2) : "0");
    setEl("avgAffiliateLinksPerArticle", totalArticleCount > 0 ? (statTotals.affiliateLinks / totalArticleCount).toFixed(1) : "0.0");

    // Link Distributions
    var grandTotalLinks = statTotals.affiliateLinks + statTotals.nonAffiliateProducts + statTotals.internalLinks + statTotals.externalReferences + statTotals.pageLinks;
    if (grandTotalLinks > 0) {
      setEl("pctAffiliateLinks", Math.round((statTotals.affiliateLinks / grandTotalLinks) * 100) + "%");
      setEl("pctNonAffiliateLinks", Math.round((statTotals.nonAffiliateProducts / grandTotalLinks) * 100) + "%");
      setEl("pctInternalLinks", Math.round((statTotals.internalLinks / grandTotalLinks) * 100) + "%");
      setEl("pctExternalReferences", Math.round((statTotals.externalReferences / grandTotalLinks) * 100) + "%");
      setEl("pctPageLinks", Math.round((statTotals.pageLinks / grandTotalLinks) * 100) + "%");
    }

    // Website Health Overall Status
    var healthStatusNode = document.getElementById("healthStatus");
    if (healthStatusNode) {
      healthStatusNode.textContent = websiteSeoScore >= 85 ? "Excellent" : websiteSeoScore >= 70 ? "Good" : "Needs Attention";
      healthStatusNode.className = "status-value " + (websiteSeoScore >= 85 ? "health-excellent" : websiteSeoScore >= 70 ? "health-good" : "health-attention");
    }

    // Health Status Explanations Box
    var explanationContainer = document.getElementById("statusExplanation");
    var explanationList = document.getElementById("statusExplanationList");
    if (explanationContainer && explanationList) {
      explanationList.innerHTML = "";
      var reasons = [];
      if (duplicateKeyCount > 0) reasons.push("Duplicate Inventory Keys (" + duplicateKeyCount + ")");
      if (duplicateUrlCount > 0) reasons.push("Duplicate Target URLs (" + duplicateUrlCount + ")");
      if (brokenInternalLinksCount > 0) reasons.push("Broken Internal Links (" + brokenInternalLinksCount + ")");
      if (failedSeoNamesList.length > 0) reasons.push("SEO Audit Warnings (" + failedSeoNamesList.length + " categories)");
      if (failedArchNamesList.length > 0) reasons.push("Structural Architecture Warnings (" + failedArchNamesList.length + " categories)");

      if (reasons.length > 0) {
        explanationContainer.style.display = "block";
        reasons.forEach(function (r) {
          var li = document.createElement("li");
          li.textContent = "• " + r;
          explanationList.appendChild(li);
        });
      } else {
        explanationContainer.style.display = "none";
      }
    }

    // SEO Health Audit Log Panel
    var seoWarningsLogContainer = document.getElementById("seoWarningsLog");
    var seoSummaryBadge = document.getElementById("seoLogSummary");
    if (seoWarningsLogContainer) {
      seoWarningsLogContainer.innerHTML = "";
      var passedSeoCount = 0;
      var totalSeoCategoriesCount = Object.keys(seoCategories).length;

      Object.keys(seoCategories).forEach(function (catKey) {
        var cat = seoCategories[catKey];
        if (cat.status === "pass") passedSeoCount++;

        var listRowItem = document.createElement("li");
        listRowItem.className = cat.status === "pass" ? "log-pass" : "log-warn";

        var headerTitle = document.createElement("div");
        headerTitle.style.fontWeight = "600";
        headerTitle.textContent = (cat.status === "pass" ? "✔ " : "⚠ ") + cat.label + (cat.items.length ? " (" + cat.items.length + " issues)" : "");
        listRowItem.appendChild(headerTitle);

        if (cat.items.length > 0) {
          var nestedList = document.createElement("ul");
          nestedList.className = "warning-nested-list";
          cat.items.forEach(function (itemDetail) {
            var nestedItem = document.createElement("li");
            nestedItem.textContent = itemDetail;
            nestedList.appendChild(nestedItem);
          });
          listRowItem.appendChild(nestedList);
        }

        seoWarningsLogContainer.appendChild(listRowItem);
      });

      if (seoSummaryBadge) {
        seoSummaryBadge.textContent = "Passed: " + passedSeoCount + "/" + totalSeoCategoriesCount + " | Needs Attention: " + (totalSeoCategoriesCount - passedSeoCount);
      }
    }

    // Article Architecture Audit Log Panel
    var archWarningsLogContainer = document.getElementById("archWarningsLog");
    var archSummaryBadge = document.getElementById("archLogSummary");
    if (archWarningsLogContainer) {
      archWarningsLogContainer.innerHTML = "";
      var passedArchCount = 0;
      var totalArchCategoriesCount = Object.keys(archCategories).length;

      Object.keys(archCategories).forEach(function (catKey) {
        var cat = archCategories[catKey];
        if (cat.status === "pass") passedArchCount++;

        var listRowItem = document.createElement("li");
        listRowItem.className = cat.status === "pass" ? "log-pass" : "log-warn";

        var headerTitle = document.createElement("div");
        headerTitle.style.fontWeight = "600";
        headerTitle.textContent = (cat.status === "pass" ? "✔ " : "⚠ ") + cat.label + (cat.items.length ? " (" + cat.items.length + " issues)" : "");
        listRowItem.appendChild(headerTitle);

        if (cat.items.length > 0) {
          var nestedList = document.createElement("ul");
          nestedList.className = "warning-nested-list";
          cat.items.forEach(function (itemDetail) {
            var nestedItem = document.createElement("li");
            nestedItem.textContent = itemDetail;
            nestedList.appendChild(nestedItem);
          });
          listRowItem.appendChild(nestedList);
        }

        archWarningsLogContainer.appendChild(listRowItem);
      });

      if (archSummaryBadge) {
        archSummaryBadge.textContent = "Passed: " + passedArchCount + "/" + totalArchCategoriesCount + " | Needs Attention: " + (totalArchCategoriesCount - passedArchCount);
      }
    }
  }

  // Sitemap Generation Engine
  function manufactureSitemapContent() {
    var xmlOutputRows = [];
    xmlOutputRows.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlOutputRows.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    var currentFormattedToday = getFormattedToday();
    var baselineStaticPages = [
      { route: "/", priority: "1.0", frequency: "daily" },
      { route: "/beauty-blog.html", priority: "0.9", frequency: "weekly" },
      { route: "/shop.html", priority: "0.8", frequency: "monthly" }
    ];

    var totalUrlCount = baselineStaticPages.length;

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
        totalUrlCount++;
        var formattedUrlSegment = String(article.url).trim();
        if (formattedUrlSegment.charAt(0) !== "/") formattedUrlSegment = "/" + formattedUrlSegment;
        xmlOutputRows.push("  <url>");
        xmlOutputRows.push("    <loc>" + BASE_URL + formattedUrlSegment + "</loc>");
        xmlOutputRows.push("    <lastmod>" + currentFormattedToday + "</lastmod>");
        xmlOutputRows.push("    <changefreq>monthly</changefreq>");
        xmlOutputRows.push("    <priority>0.8</priority>");
        xmlOutputRows.push("  </url>");
      }
    });

    xmlOutputRows.push("</urlset>");
    var outputTextarea = document.getElementById("sitemapContainer");
    if (outputTextarea) outputTextarea.value = xmlOutputRows.join("\n");

    var summaryBox = document.getElementById("sitemapSummary");
    if (summaryBox) summaryBox.style.display = "block";

    var urlCountNode = document.getElementById("sitemapUrlCount");
    if (urlCountNode) urlCountNode.textContent = totalUrlCount + " URLs";

    var genDateNode = document.getElementById("sitemapGenDate");
    if (genDateNode) {
      var d = new Date();
      genDateNode.textContent = d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
  }

  // Copy Sitemap Content
  function copySitemapToClipboard() {
    var outputTextarea = document.getElementById("sitemapContainer");
    if (!outputTextarea || !outputTextarea.value) return;

    outputTextarea.select();
    navigator.clipboard.writeText(outputTextarea.value).then(function () {
      var toast = document.getElementById("copyToast");
      if (toast) {
        toast.style.display = "inline";
        setTimeout(function () { toast.style.display = "none"; }, 3000);
      }
    });
  }

  // Export Articles CSV Engine
  function exportArticlesToCsv() {
    if (allArticles.length === 0) return;

    var csvHeaders = ["Key", "Title", "URL", "Word Count", "SEO Score", "Completeness Score", "Missing SEO Params", "Missing Arch Params"];
    var csvRows = [csvHeaders.join(",")];

    allArticles.forEach(function (art) {
      var key = '"' + (art.key || "").replace(/"/g, '""') + '"';
      var title = '"' + (art.title || "").replace(/"/g, '""') + '"';
      var url = '"' + (art.url || "").replace(/"/g, '""') + '"';
      var wordCount = countWordsInContent(art);
      var seoScore = art._seoScore || 0;
      var completeness = art._completenessScore || 0;
      var missingSeo = '"' + (art._missingSeo || []).join("; ").replace(/"/g, '""') + '"';
      var missingArch = '"' + (art._missingArch || []).join("; ").replace(/"/g, '""') + '"';

      csvRows.push([key, title, url, wordCount, seoScore, completeness, missingSeo, missingArch].join(","));
    });

    var csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    var csvUrl = URL.createObjectURL(csvBlob);
    var downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", csvUrl);
    downloadLink.setAttribute("download", "daily_glam_articles_export_" + getFormattedToday() + ".csv");
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  function attachControlListeners() {
    var generateBtn = document.getElementById("btnGenerateSitemap");
    if (generateBtn) generateBtn.addEventListener("click", manufactureSitemapContent);

    var copyBtn = document.getElementById("btnCopySitemap");
    if (copyBtn) copyBtn.addEventListener("click", copySitemapToClipboard);

    var exportBtn = document.getElementById("btnExportCsv");
    if (exportBtn) exportBtn.addEventListener("click", exportArticlesToCsv);
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
