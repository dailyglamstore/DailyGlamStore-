(function () {
var BASE_URL = "https://dailyglamstore.in";
var allArticles = [];
var skincareArticlesList = [];
var haircareArticlesList = [];
var comparisonArticlesCount = 0;
var articleUrlsMap = {};
var uniqueArticleKeys = {};

// Independent structural diagnostic schemas
var seoCategories = {
  seoTitle: { label: "SEO Title", items: [], status: "pass" },
  seoDescription: { label: "SEO Description", items: [], status: "pass" },
  intro: { label: "Intro Placement", items: [], status: "pass" },
  image: { label: "Featured Image", items: [], status: "pass" },
  faq: { label: "FAQ", items: [], status: "pass" },
  author: { label: "Author", items: [], status: "pass" },
  dateModified: { label: "dateModified", items: [], status: "pass" },
  emptySections: { label: "Empty Sections", items: [], status: "pass" },
  minLength: { label: "Minimum Content Length", items: [], status: "pass" },
  brokenLinks: { label: "Broken Internal Links", items: [], status: "pass" },
  duplicateUrls: { label: "Duplicate URLs Across Manifests", items: [], status: "pass" },
  duplicateKeys: { label: "Duplicate Keys Across Inventories", items: [], status: "pass" }
};

var archCategories = {
  relatedArticles: { label: "Related Articles", items: [], status: "pass" },
  linkPlan: { label: "LinkPlan Framework", items: [], status: "pass" },
  productRecommendations: { label: "productRecommendations", items: [], status: "pass" },
  alternativeProducts: { label: "alternativeProducts Layouts", items: [], status: "pass" },
  comparisonTable: { label: "comparisonTable", items: [], status: "pass" },
  minAffiliate: { label: "Minimum two affiliate:true links", items: [], status: "pass" },
  missingLinkTypes: { label: "Missing Link Types", items: [], status: "pass" },
  invalidAffiliateProps: { label: "Invalid Affiliate Link Settings", items: [], status: "pass" },
  invalidTargetTabs: { label: "Invalid Target Tab Directives", items: [], status: "pass" },
  comparisonValidation: { label: "Comparison Article Validation Errors", items: [], status: "pass" }
};

// Parameters mappings
var stdParams = [
  { key: "seoTitle", label: "SEO Title" },
  { key: "seoDescription", label: "SEO Description" },
  { key: "intro", label: "Intro Placement" },
  { key: "image", label: "Featured Image" },
  { key: "faq", label: "FAQ" },
  { key: "dateModified", label: "dateModified" },
  { key: "author", label: "Author" },
  { key: "emptySections", label: "No Empty Sections" },
  { key: "relatedArticles", label: "Related Articles" },
  { key: "linkPlan", label: "LinkPlan Framework" },
  { key: "productRecommendations", label: "productRecommendations" }
];

var compParams = stdParams.concat([
  { key: "alternativeProducts", label: "alternativeProducts Layouts" },
  { key: "comparisonTable", label: "comparisonTable" },
  { key: "minAffiliate", label: "Minimum two affiliate:true links" }
]);

var stdCovered = { seoTitle: 0, seoDescription: 0, intro: 0, image: 0, faq: 0, dateModified: 0, author: 0, emptySections: 0, relatedArticles: 0, linkPlan: 0, productRecommendations: 0 };
var compCovered = { seoTitle: 0, seoDescription: 0, intro: 0, image: 0, faq: 0, dateModified: 0, author: 0, emptySections: 0, relatedArticles: 0, linkPlan: 0, productRecommendations: 0, alternativeProducts: 0, comparisonTable: 0, minAffiliate: 0 };

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
    var formattedDate = currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    var formattedTime = currentDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    localStorage.setItem("publisherLastScan", formattedDate + " • " + formattedTime);
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

// Updated Block-Aware Word Count Parser
function countWordsInContent(article) {
  var contentString = "";
  if (article.title) contentString += " " + article.title;
  if (article.intro) contentString += " " + article.intro;
  if (article.cardDescription) contentString += " " + article.cardDescription;

  if (article.sections && Array.isArray(article.sections)) {
    article.sections.forEach(function (sec) {
      if (sec.heading) contentString += " " + sec.heading;
      if (sec.blocks && Array.isArray(sec.blocks)) {
        sec.blocks.forEach(function (block) {
          if (block.text) {
            if (Array.isArray(block.text)) {
              contentString += " " + block.text.join(" ");
            } else if (typeof block.text === "string") {
              contentString += " " + block.text;
            }
          }
          if (block.items && Array.isArray(block.items)) {
            contentString += " " + block.items.join(" ");
          }
          if (block.title) contentString += " " + block.title;
        });
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

  var words = contentString.trim().split(/\s+/);
  return contentString.trim() === "" ? 0 : words.length;
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

  document.getElementById("avgWordCount").textContent = Math.round(totalWords / allArticles.length);
  document.getElementById("publishedThisMonthCount").textContent = itemsPublishedThisMonth;
  document.getElementById("longestArticleInfo").textContent = longestTitle + " (" + maxWords + " words)";

  if (validDatedArticles.length > 0) {
    validDatedArticles.sort(function (a, b) { return b.date - a.date; });
    var options = { day: "numeric", month: "short", year: "numeric" };
    document.getElementById("newestArticleInfo").textContent = validDatedArticles[0].title + " - " + validDatedArticles[0].date.toLocaleDateString("en-GB", options);
    document.getElementById("oldestArticleInfo").textContent = validDatedArticles[validDatedArticles.length - 1].title + " - " + validDatedArticles[validDatedArticles.length - 1].date.toLocaleDateString("en-GB", options);
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
  Object.keys(seoCategories).forEach(function(k) { seoCategories[k].items = []; seoCategories[k].status = "pass"; });
  Object.keys(archCategories).forEach(function(k) { archCategories[k].items = []; archCategories[k].status = "pass"; });

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

  Object.keys(articleUrlsMap).forEach(function (urlPath) {
    if (articleUrlsMap[urlPath].length > 1) {
      duplicateUrlCount += (articleUrlsMap[urlPath].length - 1);
      seoCategories.duplicateUrls.items.push("Path Target '" + urlPath + "' repeated inside: " + articleUrlsMap[urlPath].join(" & "));
    }
  });

  allArticles.forEach(function (article) {
    var displayTitle = article.title || article.key || "Unnamed Article";
    var isComp = !!article.comparisonTable;
    var wordCount = countWordsInContent(article);
    var hasSeoTitle = !!(article.seoTitle && String(article.seoTitle).trim() !== "");
    var hasSeoDesc = !!(article.seoDescription && String(article.seoDescription).trim() !== "");
    var hasIntro = !!(article.intro && String(article.intro).trim() !== "");
    var trackingImageSource = (article.image && article.image.src) || article.src;
    var hasImage = !!(trackingImageSource && String(trackingImageSource).trim() !== "");
    var hasFaq = !!(article.faq && Array.isArray(article.faq) && article.faq.length > 0);
    var hasDateModified = !!article.dateModified;
    var hasValidAuthor = false;

    if (article.author && Array.isArray(article.author)) {
      hasValidAuthor = article.author.some(function (auth) {
        return auth && auth.enabled === true && (auth.type === "Person" || auth.type === "Organization");
      });
    }

    var emptySectionFound = false;
    if (article.sections && Array.isArray(article.sections) && article.sections.length > 0) {
      emptySectionFound = article.sections.some(function(sec){
        if (!sec.heading || String(sec.heading).trim() === "") return true;
        if (!sec.blocks || !Array.isArray(sec.blocks) || sec.blocks.length === 0) return true;
        return false;
      });
    } else {
      emptySectionFound = true;
    }
    var hasNoEmptySections = !emptySectionFound;

    var hasRelated = !!(article.relatedArticles && Array.isArray(article.relatedArticles) && article.relatedArticles.length > 0);
    var hasLinkPlan = !!(article.linkPlan && Array.isArray(article.linkPlan));
    var hasRecommendations = !!(article.productRecommendations && article.productRecommendations.items && Array.isArray(article.productRecommendations.items));

    // SEO ENGINE
    var seoEarnedPoints = 0;
    var seoTotalPossible = 9;
    if (hasSeoTitle) seoEarnedPoints++; else { seoCategories.seoTitle.items.push(displayTitle); article._missingSeo.push("SEO Title"); }
    if (hasSeoDesc) seoEarnedPoints++; else { seoCategories.seoDescription.items.push(displayTitle); article._missingSeo.push("SEO Description"); }
    if (hasIntro) seoEarnedPoints++; else { seoCategories.intro.items.push(displayTitle); article._missingSeo.push("Intro Placement"); }
    if (hasImage) seoEarnedPoints++; else { seoCategories.image.items.push(displayTitle); article._missingSeo.push("Featured Image"); }
    if (hasFaq) seoEarnedPoints++; else { seoCategories.faq.items.push(displayTitle); article._missingSeo.push("FAQ"); }
    if (hasDateModified) seoEarnedPoints++; else { seoCategories.dateModified.items.push(displayTitle); article._missingSeo.push("dateModified"); }
    if (hasValidAuthor) seoEarnedPoints++; else { seoCategories.author.items.push(displayTitle); article._missingSeo.push("Author"); }
    if (hasNoEmptySections) seoEarnedPoints++; else { seoCategories.emptySections.items.push(displayTitle); article._missingSeo.push("Empty Sections"); }

    var requiredLength = isComp ? 1200 : 700;
    if (wordCount >= requiredLength) {
      seoEarnedPoints++;
    } else {
      seoCategories.minLength.items.push(displayTitle + " (" + wordCount + " / " + requiredLength + " words)");
      article._missingSeo.push("Minimum Content Length");
    }

    var hasBrokenLinks = false;
    if (article.linkPlan && Array.isArray(article.linkPlan)) {
      article.linkPlan.forEach(function (lnk) {
        if (lnk && lnk.href) {
          var targetInternalHref = String(lnk.href).trim().toLowerCase();
          if (targetInternalHref.indexOf("http") !== 0 && !articleUrlsMap[targetInternalHref]) {
            brokenInternalLinksCount++;
            hasBrokenLinks = true;
            seoCategories.brokenLinks.items.push("Broken link target: " + displayTitle + " -> " + lnk.href);
          }
        }
      });
    }
    if (hasBrokenLinks) {
      article._missingSeo.push("Broken Internal Links");
    }

    article._seoScore = Math.round((seoEarnedPoints / seoTotalPossible) * 100);
    if (article._missingSeo.length > 0) {
      totalArticlesAffectedBySeoWarnings++;
    }

    // ARCHITECTURE ENGINE
    var archEarnedPoints = 0;
    var archTotalPossible = isComp ? 14 : 11;
    var trueAffiliateCountForThisArticle = 0;

    if (hasSeoTitle) archEarnedPoints++; else article._missingArch.push("SEO Title");
    if (hasSeoDesc) archEarnedPoints++; else article._missingArch.push("SEO Description");
    if (hasIntro) archEarnedPoints++; else article._missingArch.push("Intro Placement");
    if (hasImage) archEarnedPoints++; else article._missingArch.push("Featured Image");
    if (hasFaq) archEarnedPoints++; else article._missingArch.push("FAQ");
    if (hasDateModified) archEarnedPoints++; else article._missingArch.push("dateModified");
    if (hasValidAuthor) archEarnedPoints++; else article._missingArch.push("Author");
    if (hasNoEmptySections) archEarnedPoints++; else article._missingArch.push("No Empty Sections");

    if (hasRelated) {
      archEarnedPoints++;
    } else {
      article._missingArch.push("Related Articles");
      archCategories.relatedArticles.items.push(displayTitle);
    }

    var extractedLinks = [];
    if (article.linkPlan && Array.isArray(article.linkPlan)) {
      archEarnedPoints++;
      article.linkPlan.forEach(function (linkItem) {
        if (linkItem && typeof linkItem === "object") {
          extractedLinks.push(linkItem);
          if (linkItem.type === "affiliateProduct") {
            validateAffiliateProperty(linkItem, "linkPlan framework block", displayTitle);
            if (linkItem.affiliate === true) trueAffiliateCountForThisArticle++;
          }
        }
      });
    } else {
      article._missingArch.push("LinkPlan Framework");
      archCategories.linkPlan.items.push(displayTitle);
    }

    if (article.productRecommendations && article.productRecommendations.items && Array.isArray(article.productRecommendations.items)) {
      archEarnedPoints++;
      article.productRecommendations.items.forEach(function (recItem) {
        if (recItem && typeof recItem === "object") {
          statTotals.recButtons++;
          extractedLinks.push(recItem);
          if (recItem.type === "affiliateProduct") {
            validateAffiliateProperty(recItem, "productRecommendations node", displayTitle);
            if (recItem.affiliate === true) trueAffiliateCountForThisArticle++;
          }
        }
      });
    } else {
      article._missingArch.push("productRecommendations");
      archCategories.productRecommendations.items.push(displayTitle);
    }

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

      var hasAltProducts = article.alternativeProducts && article.alternativeProducts.items && Array.isArray(article.alternativeProducts.items);
      var hasCompRows = article.comparisonTable && article.comparisonTable.rows && Array.isArray(article.comparisonTable.rows) && article.comparisonTable.rows.length > 0;

      if (hasCompRows) {
        archEarnedPoints++;
        compCovered.comparisonTable++;
      } else {
        article._missingArch.push("comparisonTable");
        archCategories.comparisonTable.items.push(displayTitle);
      }

      if (hasAltProducts) {
        archEarnedPoints++;
        compCovered.alternativeProducts++;
        statTotals.altProductLinks += article.alternativeProducts.items.length;
        article.alternativeProducts.items.forEach(function (altItem) {
          if (altItem && typeof altItem === "object") {
            extractedLinks.push(altItem);
            if (altItem.type === "affiliateProduct") {
              validateAffiliateProperty(altItem, "alternativeProducts grid entry", displayTitle);
              if (altItem.affiliate === true) trueAffiliateCountForThisArticle++;
            }
          }
        });
      } else {
        article._missingArch.push("alternativeProducts Layouts");
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

    extractedLinks.forEach(function (lnk) {
      if (lnk.type === "affiliateProduct") {
        if (lnk.affiliate === true) statTotals.affiliateLinks++;
        if (lnk.affiliate === false) statTotals.nonAffiliateProducts++;
      }
      if (lnk.type === "internalArticle") statTotals.internalLinks++;
      if (lnk.type === "page") statTotals.pageLinks++;
      if (lnk.type === "externalReference") statTotals.externalReferences++;
    });

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
  var fullyOptimizedRatio = totalArticleCount > 0 ? (fullyOptimizedCount / totalArticleCount) : 0;

  document.getElementById("totalCount").textContent = totalArticleCount;
  document.getElementById("seoScoreValue").textContent = websiteSeoScore + " / 100";
  document.getElementById("fullyOptimizedCount").textContent = fullyOptimizedCount + " / " + totalArticleCount;
  document.getElementById("avgArticleCompletion").textContent = globalAvgCompletion + "%";
  document.getElementById("skincareCount").textContent = skincareArticlesList.length;
  document.getElementById("haircareCount").textContent = haircareArticlesList.length;
  document.getElementById("comparisonCount").textContent = comparisonArticlesCount;
  document.getElementById("avgSeoScore").textContent = averageArticleSeoScore + " / 100";

  var techDeductionsNode = document.getElementById("techDeductionsValue");
  if (techDeductionsNode) {
    techDeductionsNode.textContent = totalTechnicalDeductionPoints === 0 ? "0" : "−" + totalTechnicalDeductionPoints;
  }

  document.getElementById("totalAffiliateLinks").textContent = statTotals.affiliateLinks;
  document.getElementById("totalNonAffiliateProducts").textContent = statTotals.nonAffiliateProducts;
  document.getElementById("totalInternalLinks").textContent = statTotals.internalLinks;
  document.getElementById("totalPageLinks").textContent = statTotals.pageLinks;
  document.getElementById("totalExternalReferences").textContent = statTotals.externalReferences;
  document.getElementById("totalAlternativeProducts").textContent = statTotals.altProductLinks;
  document.getElementById("totalRecButtons").textContent = statTotals.recButtons;
  document.getElementById("avgInternalLinks").textContent = totalArticleCount > 0 ? (statTotals.internalLinks / totalArticleCount).toFixed(2) : "0";
  document.getElementById("avgAffiliateLinksPerArticle").textContent = totalArticleCount > 0 ? (statTotals.affiliateLinks / totalArticleCount).toFixed(1) : "0.0";

  var sumOfAllLinks = statTotals.affiliateLinks + statTotals.nonAffiliateProducts + statTotals.internalLinks + statTotals.externalReferences + statTotals.pageLinks;
  if (sumOfAllLinks > 0) {
    document.getElementById("pctAffiliateLinks").textContent = Math.round((statTotals.affiliateLinks / sumOfAllLinks) * 100) + "%";
    document.getElementById("pctNonAffiliateLinks").textContent = Math.round((statTotals.nonAffiliateProducts / sumOfAllLinks) * 100) + "%";
    document.getElementById("pctInternalLinks").textContent = Math.round((statTotals.internalLinks / sumOfAllLinks) * 100) + "%";
    document.getElementById("pctExternalReferences").textContent = Math.round((statTotals.externalReferences / sumOfAllLinks) * 100) + "%";
    document.getElementById("pctPageLinks").textContent = Math.round((statTotals.pageLinks / sumOfAllLinks) * 100) + "%";
  }

  var healthStatusNode = document.getElementById("healthStatus");
  var explanationArea = document.getElementById("statusExplanation");
  var explanationList = document.getElementById("statusExplanationList");
  healthStatusNode.className = "status-value";
  explanationList.innerHTML = "";

  var assignedReasons = [];
  var calculatedStatus = "Needs Attention";
  var statusColorClass = "health-attention";

  if (websiteSeoScore >= 90) {
    calculatedStatus = "Excellent";
    statusColorClass = "health-excellent";
  } else if (websiteSeoScore >= 75) {
    calculatedStatus = "Good";
    statusColorClass = "health-good";
  } else if (websiteSeoScore < 50) {
    calculatedStatus = "Critical";
    statusColorClass = "health-error";
  }

  if (fullyOptimizedRatio < 0.50 && calculatedStatus !== "Critical") {
    calculatedStatus = "Needs Attention";
    statusColorClass = "health-attention";
    assignedReasons.push("Less than 50% Fully Optimized Articles");
  } else {
    if (calculatedStatus === "Excellent") assignedReasons.push("High Website SEO Score");
    if (calculatedStatus === "Excellent") assignedReasons.push("More than 50% Fully Optimized Articles");
    if (calculatedStatus === "Critical") assignedReasons.push("Low Website SEO Score");
  }

  if (totalTechnicalDeductionPoints > 0 && calculatedStatus === "Needs Attention" && fullyOptimizedRatio >= 0.50) {
    assignedReasons.push("Technical SEO issues detected");
  }

  healthStatusNode.textContent = calculatedStatus;
  healthStatusNode.classList.add(statusColorClass);

  if (assignedReasons.length > 0) {
    assignedReasons.forEach(function(reasonText) {
      var li = document.createElement("li");
      li.textContent = "• " + reasonText;
      explanationList.appendChild(li);
    });
    explanationArea.style.display = "block";
  } else {
    explanationArea.style.display = "none";
  }

  // SEO Health Warnings
  var seoWarningsLogContainer = document.getElementById("seoWarningsLog");
  seoWarningsLogContainer.innerHTML = "";
  var passedSeoCount = 0;

  Object.keys(seoCategories).forEach(function (catKey) {
    var cat = seoCategories[catKey];
    var listRowItem = document.createElement("li");
    if (cat.status === "pass") {
      passedSeoCount++;
      listRowItem.className = "log-pass";
      listRowItem.textContent = "✔ " + cat.label;
    } else {
      listRowItem.className = "log-warn";
      listRowItem.textContent = "⚠ " + cat.label + " (" + cat.items.length + " articles)";
      var nestedUI = document.createElement("ul");
      nestedUI.className = "warning-nested-list";
      cat.items.forEach(function (nestedText) {
        var nestedLi = document.createElement("li");
        nestedLi.textContent = "• " + nestedText;
        nestedUI.appendChild(nestedLi);
      });
      listRowItem.appendChild(nestedUI);
    }
    seoWarningsLogContainer.appendChild(listRowItem);
  });

  var totalSeoCategoriesCount = Object.keys(seoCategories).length;
  var seoLogSummaryNode = document.getElementById("seoLogSummary");
  if (seoLogSummaryNode) {
    seoLogSummaryNode.innerHTML = "Passed: " + passedSeoCount + " / " + totalSeoCategoriesCount + " Requirements Covered<br>Needs Attention: " + failedSeoNamesList.length;
  }

  // Summary badging
  document.getElementById("summaryArticles").textContent = totalArticleCount;
  document.getElementById("summaryAffiliate").textContent = statTotals.affiliateLinks;
  document.getElementById("summaryInternal").textContent = statTotals.internalLinks;
  document.getElementById("summarySeoScore").textContent = websiteSeoScore + "/100";
  document.getElementById("summaryBrokenLinks").textContent = brokenInternalLinksCount;
  document.getElementById("summaryHealthy").textContent = fullyOptimizedCount + "/" + totalArticleCount;
  document.getElementById("summaryAffectedArticles").textContent = totalArticlesAffectedBySeoWarnings + "/" + totalArticleCount;
}

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
      var lastMod = currentFormattedToday;
      if (article.dateModified) {
        lastMod = String(article.dateModified).split("T")[0];
      } else if (article.date) {
        lastMod = String(article.date).split("T")[0];
      }
      xmlOutputRows.push("    <lastmod>" + lastMod + "</lastmod>");
      xmlOutputRows.push("    <changefreq>monthly</changefreq>");
      xmlOutputRows.push("    <priority>" + determinedPriority + "</priority>");
      xmlOutputRows.push("  </url>");
    }
  });

  xmlOutputRows.push("</urlset>");

  var totalUrlElementsCalculated = baselineStaticPages.length + allArticles.filter(function(a){ return a.url; }).length;
  var outputTextarea = document.getElementById("sitemapContainer");
  if (outputTextarea) outputTextarea.value = xmlOutputRows.join("\n");

  var liveDateObject = new Date();
  document.getElementById("sitemapUrlCount").textContent = totalUrlElementsCalculated + " URLs";
  document.getElementById("sitemapGenDate").textContent = liveDateObject.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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

function exportHealthyArticlesCsv() {
  var csvRows = [];

  function formatCsvDate(rawDateString) {
    if (!rawDateString || String(rawDateString).trim() === "") return "";
    var parsedDate = new Date(rawDateString);
    if (isNaN(parsedDate.getTime())) return rawDateString;
    var baseFormattedDate = parsedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    if (String(rawDateString).indexOf("T") !== -1 || String(rawDateString).indexOf(":") !== -1) {
      var baseFormattedTime = parsedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return baseFormattedDate + " " + baseFormattedTime;
    }
    return baseFormattedDate;
  }

  csvRows.push("Title, URL, Category, SEO Score, Article Completion, Published Date, Last Modified, Word Count, Status, Missing SEO Factors, Missing Architecture Factors");

  allArticles.forEach(function (article) {
    var cleanTitle = (article.title || article.key || "").replace(/"/g, '""');
    if (cleanTitle.indexOf(",") !== -1 || cleanTitle.indexOf('"') !== -1 || cleanTitle.indexOf("\n") !== -1) {
      cleanTitle = '"' + cleanTitle + '"';
    }

    var relativeUrl = article.url || "";
    var category = article.category || "Skincare";

    var healthScore = article._seoScore || 0;
    var completionPct = article._completenessScore || 0;
    var completionScoreText = completionPct + "%";
    var publishedDate = formatCsvDate(article.date || "");
    var lastModified = formatCsvDate(article.dateModified || "");
    var wordCount = countWordsInContent(article);

    var operationalStatus = "Needs Attention";
    if (completionPct >= 85) {
      operationalStatus = "Fully Optimized";
    } else if (completionPct >= 60) {
      operationalStatus = "Good Progress";
    }

    var missingSeoString = (article._missingSeo && article._missingSeo.length > 0) ? article._missingSeo.join(", ") : "None";
    var missingArchString = (article._missingArch && article._missingArch.length > 0) ? article._missingArch.join(", ") : "None";

    if (missingSeoString.indexOf(",") !== -1) missingSeoString = '"' + missingSeoString + '"';
    if (missingArchString.indexOf(",") !== -1) missingArchString = '"' + missingArchString + '"';

    csvRows.push([cleanTitle, relativeUrl, category, healthScore, completionScoreText, publishedDate, lastModified, wordCount, operationalStatus, missingSeoString, missingArchString].join(","));
  });

  var csvStringContent = csvRows.join("\n");
  var blobObject = new Blob([csvStringContent], { type: "text/csv;charset=utf-8;" });
  var downloadLink = document.createElement("a");
  var todayStamp = getFormattedToday();
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

// Synchronization Layer for Loader System
if (window.SKINCARE_ARTICLES && Object.keys(window.SKINCARE_ARTICLES).length > 0) {
  runEnginePipeline();
} else {
  document.addEventListener("articlesLoaded", runEnginePipeline);
}

})();
