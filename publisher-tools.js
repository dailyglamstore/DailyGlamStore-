(function () {
  var BASE_URL = "https://dailyglamstore.in";
  var DEDUCTION_PER_WARNING = 2;

  var allArticles = [];
  var skincareArticlesList = [];
  var haircareArticlesList = [];
  var comparisonArticlesCount = 0;
  var seenUrls = {};
  var duplicateUrlsCount = 0;
  var validationLogsList = [];

  function initTimestamp() {
    var scanDateNode = document.getElementById("scanDate");
    if (scanDateNode) {
      var currentDate = new Date("2026-06-29T22:02:50+05:30");
      scanDateNode.textContent = currentDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
  }

  function gatherSourceObjects() {
    var skincareSource = window.SKINCARE_ARTICLES || {};
    var haircareSource = window.HAIRCARE_ARTICLES || {};

    Object.keys(skincareSource).forEach(function (key) {
      var item = skincareSource[key];
      if (item && typeof item === "object") {
        skincareArticlesList.push(item);
        allArticles.push(item);
      }
    });

    Object.keys(haircareSource).forEach(function (key) {
      var item = haircareSource[key];
      if (item && typeof item === "object") {
        haircareArticlesList.push(item);
        allArticles.push(item);
      }
    });
  }

  function auditWebsiteEcosystem() {
    allArticles.forEach(function (article) {
      var titleIdentifier = article.title || article.key || "Unnamed Article";

      if (article.comparisonTable && article.comparisonTable.rows && article.comparisonTable.rows.length) {
        comparisonArticlesCount++;
      }

      if (!article.faq || !Array.isArray(article.faq) || article.faq.length === 0) {
        validationLogsList.push("Warning: Missing FAQ array or items in article: \"" + titleIdentifier + "\"");
      }

      var hasValidAuthor = false;
      if (article.author && Array.isArray(article.author)) {
        hasValidAuthor = article.author.some(function (auth) {
          return auth && auth.enabled === true && (auth.type === "Person" || auth.type === "Organization");
        });
      }
      if (!hasValidAuthor) {
        validationLogsList.push("Warning: Missing enabled Author assignment in article: \"" + titleIdentifier + "\"");
      }

      if (!article.dateModified) {
        validationLogsList.push("Warning: Missing explicit 'dateModified' tracking field in article: \"" + titleIdentifier + "\"");
      }

      if (!article.relatedArticles || !Array.isArray(article.relatedArticles) || article.relatedArticles.length === 0) {
        validationLogsList.push("Warning: Missing Related Articles reference listings in: \"" + titleIdentifier + "\"");
      }

      if (!article.url) {
        validationLogsList.push("Warning: Missing Canonical URL tracking target field inside object structure: \"" + titleIdentifier + "\"");
      } else {
        var cleanUrl = String(article.url).trim().toLowerCase();
        if (seenUrls[cleanUrl]) {
          seenUrls[cleanUrl]++;
          duplicateUrlsCount++;
          validationLogsList.push("Error: Duplicate URL path context detected: '" + article.url + "' assigned to: \"" + titleIdentifier + "\"");
        } else {
          seenUrls[cleanUrl] = 1;
        }
      }

      if (!article.seoTitle || String(article.seoTitle).trim() === "") {
        validationLogsList.push("Warning: Missing optimized SEO Title variant template setting in: \"" + titleIdentifier + "\"");
      }

      if (!article.seoDescription || String(article.seoDescription).trim() === "") {
        validationLogsList.push("Warning: Missing optimized SEO Description metadata field configuration in: \"" + titleIdentifier + "\"");
      }

      var targetImageSource = (article.image && article.image.src) || article.src;
      if (!targetImageSource || String(targetImageSource).trim() === "") {
        validationLogsList.push("Warning: Missing primary asset image configuration block for article: \"" + titleIdentifier + "\"");
      }
    });
  }

  function paintInterfaceOutputs() {
    document.getElementById("totalCount").textContent = allArticles.length;
    document.getElementById("skincareCount").textContent = skincareArticlesList.length;
    document.getElementById("haircareCount").textContent = haircareArticlesList.length;
    document.getElementById("comparisonCount").textContent = comparisonArticlesCount;

    var computedScore = 100 - (validationLogsList.length * DEDUCTION_PER_WARNING);
    if (computedScore < 0) {
      computedScore = 0;
    }
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
      healthStatusNode.textContent = "🔴 Errors Detected";
      healthStatusNode.classList.add("health-error");
    }

    var warningsLogContainer = document.getElementById("seoWarningsLog");
    warningsLogContainer.innerHTML = "";

    if (validationLogsList.length === 0) {
      var perfectionPlaceholder = document.createElement("li");
      perfectionPlaceholder.className = "success-placeholder";
      perfectionPlaceholder.textContent = "Excellent! Your entire article matrix passes validation checks with clean scores.";
      warningsLogContainer.appendChild(perfectionPlaceholder);
    } else {
      validationLogsList.forEach(function (warningMessage) {
        var logRowItem = document.createElement("li");
        logRowItem.textContent = warningMessage;
        warningsLogContainer.appendChild(logRowItem);
      });
    }
  }

  function manufactureSitemapContent() {
    var xmlOutputRows = [];
    xmlOutputRows.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlOutputRows.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    var executionFormattedDate = "2026-06-29";

    var baselineStaticPages = [
      { route: "/", priority: "1.0", frequency: "daily" },
      { route: "/beauty-blog.html", priority: "0.8", frequency: "weekly" },
      { route: "/beauty-guides.html", priority: "0.8", frequency: "weekly" },
      { route: "/shop.html", priority: "0.8", frequency: "monthly" }
    ];

    baselineStaticPages.forEach(function (page) {
      xmlOutputRows.push("  <url>");
      xmlOutputRows.push("    <loc>" + BASE_URL + page.route + "</loc>");
      xmlOutputRows.push("    <lastmod>" + executionFormattedDate + "</lastmod>");
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

        var itemLastModifiedDate = article.dateModified || article.date || executionFormattedDate;
        if (itemLastModifiedDate.indexOf("T") !== -1) {
          itemLastModifiedDate = itemLastModifiedDate.split("T")[0];
        }

        xmlOutputRows.push("  <url>");
        xmlOutputRows.push("    <loc>" + BASE_URL + formattedUrlSegment + "</loc>");
        xmlOutputRows.push("    <lastmod>" + itemLastModifiedDate + "</lastmod>");
        xmlOutputRows.push("    <changefreq>monthly</changefreq>");
        xmlOutputRows.push("    <priority>0.8</priority>");
        xmlOutputRows.push("  </url>");
      }
    });

    xmlOutputRows.push("</urlset>");
    
    var outputTextarea = document.getElementById("sitemapContainer");
    if (outputTextarea) {
      outputTextarea.value = xmlOutputRows.join("\n");
    }
  }

  function handleClipboardCopyAction() {
    var sitemapTextarea = document.getElementById("sitemapContainer");
    if (!sitemapTextarea || sitemapTextarea.value.trim() === "") {
      alert("Please generate the sitemap profile engine content before executing a copy task.");
      return;
    }

    sitemapTextarea.select();
    sitemapTextarea.setSelectionRange(0, 99999);

    try {
      var secureCopyActionStatus = document.execCommand("copy");
      if (secureCopyActionStatus) {
        alert("Success! Sitemap XML documentation copied perfectly to device clipboard.");
      } else {
        alert("Clipboard command processing failed. Please select and duplicate manually.");
      }
    } catch (err) {
      alert("Your system configuration profile blocks automated selection duplicates.");
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
    initTimestamp();
    gatherSourceObjects();
    auditWebsiteEcosystem();
    paintInterfaceOutputs();
    attachControlListeners();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runEnginePipeline);
  } else {
    runEnginePipeline();
  }
})();
