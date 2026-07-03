(function () {
    var BASE_URL = "https://dailyglamstore.in";
    var DEDUCTION_PER_WARNING = 2;
    var allArticles = [];
    var skincareArticlesList = [];
    var haircareArticlesList = [];
    var comparisonArticlesCount = 0;
    var articleUrlsMap = {};
    var uniqueArticleKeys = {};
    
    // Separate issues tracker to isolate SEO deductions vs standard architecture problems
    var seoIssueDeductions = 0;
    var totalIssueDeductions = 0; 

    // Mapped Diagnostic Categories Configuration
    var diagnosticCategories = {
        // Section A: Google / SEO Engine Checks
        seoTitle: { label: "SEO Titles", items: [], status: "pass", isFailType: false, area: "seo" },
        seoDescription: { label: "SEO Descriptions", items: [], status: "pass", isFailType: false, area: "seo" },
        intro: { label: "Intro", items: [], status: "pass", isFailType: false, area: "seo" },
        image: { label: "Images", items: [], status: "pass", isFailType: false, area: "seo" },
        faq: { label: "Missing FAQ", items: [], status: "pass", isFailType: false, area: "seo" },
        author: { label: "Authors", items: [], status: "pass", isFailType: false, area: "seo" },
        dateModified: { label: "Missing dateModified", items: [], status: "pass", isFailType: false, area: "seo" },
        emptySections: { label: "Empty Sections", items: [], status: "pass", isFailType: false, area: "seo" },
        brokenLinks: { label: "Broken Internal Links (Audited Arrays Only)", items: [], status: "pass", isFailType: false, area: "seo" },
        duplicateUrls: { label: "Duplicate URLs", items: [], status: "pass", isFailType: true, area: "seo" },
        duplicateKeys: { label: "Duplicate Keys", items: [], status: "pass", isFailType: true, area: "seo" },
        
        // Section B: Daily Glam Store Publishing Architecture Checks
        missingLinkPlan: { label: "Missing linkPlan Array", items: [], status: "pass", isFailType: false, area: "architecture" },
        missingRecommendations: { label: "Missing productRecommendations", items: [], status: "pass", isFailType: false, area: "architecture" },
        missingAlternativeProducts: { label: "Missing alternativeProducts", items: [], status: "pass", isFailType: false, area: "architecture" },
        missingLinkTypes: { label: "Missing Link Types", items: [], status: "pass", isFailType: false, area: "architecture" },
        invalidAffiliateProps: { label: "Invalid Affiliate Link Settings", items: [], status: "pass", isFailType: false, area: "architecture" },
        invalidTargetTabs: { label: "Invalid Target Tab (_blank / same-tab) Directives", items: [], status: "pass", isFailType: false, area: "architecture" },
        comparisonValidation: { label: "Comparison Article Validation", items: [], status: "pass", isFailType: false, area: "architecture" }
    };

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
            var fullTimestampString = formattedDate + " " + formattedTime;
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
            document.getElementById("newestArticleInfo").textContent = validDatedArticles[0].title + " - " + validDatedArticles[0].date.toLocaleDateString("en-GB", options);
            document.getElementById("oldestArticleInfo").textContent = validDatedArticles[validDatedArticles.length - 1].title + " - " + validDatedArticles[validDatedArticles.length - 1].date.toLocaleDateString("en-GB", options);
        }
    }

    function validateAffiliateProperty(item, locationContext, displayTitle) {
        if (!item.hasOwnProperty("affiliate")) {
            totalIssueDeductions++;
            diagnosticCategories.invalidAffiliateProps.items.push(displayTitle + " → " + locationContext + " is missing the 'affiliate' property");
        } else if (typeof item.affiliate !== "boolean") {
            totalIssueDeductions++;
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
        totalIssueDeductions = 0;

        Object.keys(uniqueArticleKeys).forEach(function (key) {
            if (uniqueArticleKeys[key].length > 1) {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.duplicateKeys.items.push("Key '" + key + "' is repeated across multiple definitions");
            }
        });

        allArticles.forEach(function (article) {
            var displayTitle = article.title || article.key || "Unnamed Article";
            if (article.url) {
                var cleanPath = String(article.url).toLowerCase().trim();
                if (!articleUrlsMap[cleanPath]) articleUrlsMap[cleanPath] = [];
                articleUrlsMap[cleanPath].push(displayTitle);
            }
        });

        allArticles.forEach(function (article) {
            var displayTitle = article.title || article.key || "Unnamed Article";
            var completenessPoints = 0;
            
            // Dynamic completeness total configuration depending on Layout Rules
            var completenessTotalPossible = article.comparisonTable ? 14 : 11;
            var isNewArch = isUsingNewArchitecture(article);

            // 1. SEO Title Evaluation (SEO)
            if (article.seoTitle && String(article.seoTitle).trim() !== "") { 
                completenessPoints++; 
            } else {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.seoTitle.items.push(displayTitle);
            }

            // 2. SEO Description Evaluation (SEO)
            if (article.seoDescription && String(article.seoDescription).trim() !== "") { 
                completenessPoints++; 
            } else {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.seoDescription.items.push(displayTitle);
            }

            // 3. Intro Evaluation (SEO)
            if (article.intro && String(article.intro).trim() !== "") { 
                completenessPoints++; 
            } else {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.intro.items.push(displayTitle);
            }

            // 4. Image Evaluation (SEO)
            var trackingImageSource = (article.image && article.image.src) || article.src;
            if (trackingImageSource && String(trackingImageSource).trim() !== "") { 
                completenessPoints++; 
            } else {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.image.items.push(displayTitle);
            }

            // 5. FAQ Evaluation (SEO)
            if (article.faq && Array.isArray(article.faq) && article.faq.length > 0) { 
                completenessPoints++; 
            } else {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.faq.items.push(displayTitle);
            }

            // 6. Related Articles Evaluation (SEO)
            if (article.relatedArticles && Array.isArray(article.relatedArticles) && article.relatedArticles.length > 0) { 
                completenessPoints++; 
            } else {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.relatedArticles.items.push(displayTitle);
            }

            // 7. Author Validation (SEO)
            var hasValidAuthor = false;
            if (article.author && Array.isArray(article.author)) {
                hasValidAuthor = article.author.some(function (auth) {
                    return auth && auth.enabled === true && (auth.type === "Person" || auth.type === "Organization");
                });
            }
            if (hasValidAuthor) { 
                completenessPoints++; 
            } else {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.author.items.push(displayTitle);
            }

            // 8. dateModified Validation (SEO)
            if (article.dateModified) { 
                completenessPoints++; 
            } else {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.dateModified.items.push(displayTitle);
            }

            // 9. Empty Sections Audit (SEO)
            if (article.sections && Array.isArray(article.sections)) {
                var emptyFound = article.sections.some(function (sec) {
                    return !(sec.heading && String(sec.heading).trim() !== "") &&
                           !(sec.paragraphs && sec.paragraphs.length > 0 && String(sec.paragraphs[0]).trim() !== "") &&
                           !(sec.bullets && sec.bullets.length > 0 && String(sec.bullets[0]).trim() !== "");
                });
                if (!emptyFound && article.sections.length > 0) { completenessPoints++; }
                if (emptyFound || article.sections.length === 0) {
                    seoIssueDeductions++;
                    totalIssueDeductions++;
                    diagnosticCategories.emptySections.items.push(displayTitle);
                }
            } else {
                seoIssueDeductions++;
                totalIssueDeductions++;
                diagnosticCategories.emptySections.items.push(displayTitle);
            }

            var extractedLinks = [];
            var trueAffiliateCountForThisArticle = 0;

            // 10. LinkPlan Mapping & Auditing (Architecture Metric)
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

            // 11. Product Recommendations Mapping (Architecture Metric)
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

            // 12. Alternative Products Audit (Architecture Metric - Selective Points allocation rules)
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
            } else if (isNewArch) {
                if (article.comparisonTable) {
                    totalIssueDeductions++;
                    diagnosticCategories.missingAlternativeProducts.items.push(displayTitle + " (Comparison missing alternativeProducts)");
                } else {
                    diagnosticCategories.missingAlternativeProducts.items.push(displayTitle);
                }
            }

            // Global link tracking aggregation context
            extractedLinks.forEach(function (lnk) {
                if (lnk.type === "affiliateProduct") {
                    if (lnk.affiliate === true) statTotals.affiliateLinks++;
                    if (lnk.affiliate === false) statTotals.nonAffiliateProducts++;
                }
                if (lnk.type === "internalArticle") statTotals.internalLinks++;
                if (lnk.type === "page") statTotals.pageLinks++;
                if (lnk.type === "externalReference") statTotals.externalReferences++;
            });

            // 13 & 14. Comparison Block Strict Matrix Validations
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

            // Calculation pipeline securely capped at 100 max
            article._completenessScore = Math.min(Math.round((completenessPoints / completenessTotalPossible) * 100), 100);
        });

        // Duplicate URL tracking validation
        Object.keys(articleUrlsMap).forEach(function (urlPath) {
            if (articleUrlsMap[urlPath].length > 1) {
                seoIssueDeductions += (articleUrlsMap[urlPath].length - 1);
                totalIssueDeductions += (articleUrlsMap[urlPath].length - 1);
                diagnosticCategories.duplicateUrls.items.push("Path '" + urlPath + "' linked in: " + articleUrlsMap[urlPath].join(" & "));
            }
        });

        // Broken Internal reference checks
        allArticles.forEach(function (article) {
            var displayTitle = article.title || article.key || "Unnamed Article";
            if (article.linkPlan && Array.isArray(article.linkPlan)) {
                article.linkPlan.forEach(function (lnk) {
                    if (lnk && lnk.type === "internalArticle" && lnk.href) {
                        var targetInternalHref = String(lnk.href).trim().toLowerCase();
                        if (!articleUrlsMap[targetInternalHref]) {
                            seoIssueDeductions++;
                            totalIssueDeductions++;
                            diagnosticCategories.brokenLinks.items.push("Broken Internal Link: " + displayTitle + " → " + lnk.href);
                        }
                    }
                });
            }
        });

        // Update processing status mappings flags
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

        // SEO Score Isolation Pipeline
        var computedSeoScore = 100 - (seoIssueDeductions * DEDUCTION_PER_WARNING);
        if (computedSeoScore < 0) computedSeoScore = 0;
        document.getElementById("seoScoreValue").textContent = computedSeoScore + "/100";
        document.getElementById("summarySeoScore").textContent = computedSeoScore + "/100";

        // Completion Metrics Accumulator Subsystem
        var totalCompletionSum = 0;
        var fullyOptimizedCount = 0;
        
        allArticles.forEach(function (art) {
            var score = art._completenessScore || 0;
            totalCompletionSum += score;
            if (score >= 85) {
                fullyOptimizedCount++;
            }
        });

        var avgCompletion = totalArticleCount > 0 ? Math.round(totalCompletionSum / totalArticleCount) : 0;
        document.getElementById("fullyOptimizedRatio").textContent = fullyOptimizedCount + " / " + totalArticleCount;
        document.getElementById("avgArticleCompletion").textContent = avgCompletion + "%";

        // Render standard links blocks counter fields
        document.getElementById("totalAffiliateLinks").textContent = statTotals.affiliateLinks;
        document.getElementById("totalNonAffiliateProducts").textContent = statTotals.nonAffiliateProducts;
        document.getElementById("totalInternalLinks").textContent = statTotals.internalLinks;
        document.getElementById("totalPageLinks").textContent = statTotals.pageLinks;
        document.getElementById("totalExternalReferences").textContent = statTotals.externalReferences;
        
        var altTargetNode = document.getElementById("totalAlternativeProducts");
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
        } else {
            document.getElementById("pctAffiliateLinks").textContent = "0%";
            document.getElementById("pctNonAffiliateLinks").textContent = "0%";
            document.getElementById("pctInternalLinks").textContent = "0%";
            document.getElementById("pctExternalReferences").textContent = "0%";
            document.getElementById("pctPageLinks").textContent = "0%";
        }

        // Master UI Badge Color Class Handler
        var healthStatusNode = document.getElementById("healthStatus");
        healthStatusNode.className = "status-value";
        if (computedSeoScore >= 90) {
            healthStatusNode.textContent = "Excellent";
            healthStatusNode.classList.add("health-excellent");
        } else if (computedSeoScore >= 75) {
            healthStatusNode.textContent = "Good";
            healthStatusNode.classList.add("health-good");
        } else if (computedSeoScore >= 50) {
            healthStatusNode.textContent = "Needs Attention";
            healthStatusNode.classList.add("health-attention");
        } else {
            healthStatusNode.textContent = "Errors Found";
            healthStatusNode.classList.add("health-error");
        }

        // UI Splitting Architecture Layout Generator Engine
        var seoLogContainer = document.getElementById("seoWarningsLog");
        var archLogContainer = document.getElementById("archWarningsLog");
        
        seoLogContainer.innerHTML = "";
        archLogContainer.innerHTML = "";

        var seoPassed = 0, seoFailed = 0;
        var archPassed = 0, archFailed = 0;
        var activeWarnCategoryNames = [];
        var calculatedBrokenCount = 0;
        var calculatedWarningsCount = 0;

        Object.keys(diagnosticCategories).forEach(function (catKey) {
            var cat = diagnosticCategories[catKey];
            var listRowItem = document.createElement("li");
            
            if (cat.status === "pass") {
                listRowItem.className = "log-pass";
                listRowItem.textContent = "✓ " + cat.label;
                if (cat.area === "seo") seoPassed++; else archPassed++;
            } else {
                listRowItem.className = (cat.status === "warn") ? "log-warn" : "log-fail";
                var prefixSign = (cat.status === "warn") ? "▲ " : "✘ ";
                var itemsCounterText = cat.isFailType ? "" : " (" + cat.items.length + ")";
                listRowItem.textContent = prefixSign + cat.label + itemsCounterText;
                
                if (cat.area === "seo") {
                    seoFailed++;
                } else {
                    archFailed++;
                }
                activeWarnCategoryNames.push(catKey);

                var nestedUl = document.createElement("ul");
                nestedUl.className = "warning-nested-list";
                cat.items.forEach(function (nestedText) {
                    var nestedLi = document.createElement("li");
                    nestedLi.textContent = "↳ " + nestedText;
                    nestedUl.appendChild(nestedLi);
                    
                    if (catKey === "brokenLinks") {
                        calculatedBrokenCount++;
                    } else {
                        calculatedWarningsCount++;
                    }
                });
                listRowItem.appendChild(nestedUl);
            }

            if (cat.area === "seo") {
                seoLogContainer.appendChild(listRowItem);
            } else {
                archLogContainer.appendChild(listRowItem);
            }
        });

        // Apply Dynamic Realtime Warning Counters Strings
        document.getElementById("seoPassedCount").textContent = seoPassed;
        document.getElementById("seoFailedCount").textContent = seoFailed;
        document.getElementById("archPassedCount").textContent = archPassed;
        document.getElementById("archFailedCount").textContent = archFailed;

        // Apply Legacy Summary Card Metrics Sync hooks
        document.getElementById("summaryArticles").textContent = totalArticleCount;
        document.getElementById("summaryAffiliate").textContent = statTotals.affiliateLinks;
        document.getElementById("summaryInternal").textContent = statTotals.internalLinks;
        document.getElementById("summaryBrokenLinks").textContent = calculatedBrokenCount;
        document.getElementById("summaryWarnings").textContent = calculatedWarningsCount;
        document.getElementById("summaryHealthy").textContent = fullyOptimizedCount;
        document.getElementById("summaryNeedsAttention").textContent = activeWarnCategoryNames.length;

        var needsAttentionSubSlot = document.getElementById("summaryNeedsAttentionCategories");
        if (needsAttentionSubSlot) {
            needsAttentionSubSlot.innerHTML = "";
            activeWarnCategoryNames.forEach(function (keyName) {
                var badge = document.createElement("div");
                var displayLabel = keyName;
                if (keyName === "seoTitle") displayLabel = "SEO Title";
                if (keyName === "seoDescription") displayLabel = "SEO Description";
                if (keyName === "faq") displayLabel = "FAQ";
                if (keyName === "relatedArticles") displayLabel = "Related Articles";
                if (keyName === "author") displayLabel = "Authors";
                if (keyName === "dateModified") displayLabel = "dateModified";
                if (keyName === "image") displayLabel = "Images";
                if (keyName === "intro") displayLabel = "Intro";
                if (keyName === "emptySections") displayLabel = "Empty Sections";
                if (keyName === "brokenLinks") displayLabel = "Broken Links";
                if (keyName === "comparisonValidation") displayLabel = "Comparison Validation";
                if (keyName === "missingLinkPlan") displayLabel = "LinkPlan Missing";
                if (keyName === "missingRecommendations") displayLabel = "Recommendations Missing";
                if (keyName === "missingAlternativeProducts") displayLabel = "Alternative Products Missing";
                if (keyName === "missingLinkTypes") displayLabel = "Missing Link Types";
                if (keyName === "invalidAffiliateProps") displayLabel = "Invalid Affiliate Settings";
                if (keyName === "invalidTargetTabs") displayLabel = "Invalid Target Directives";
                badge.textContent = displayLabel;
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
        
        var outputTextarea = document.getElementById("sitemapContainer");
        if (outputTextarea) outputTextarea.value = xmlOutputRows.join("\n");
        
        var liveDateObject = new Date();
        document.getElementById("sitemapUrlCount").textContent = totalUrlElementsCalculated + " URLS";
        document.getElementById("sitemapGenDate").textContent = liveDateObject.toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric"
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
                var baseFormattedTime = parsedDate.toLocaleTimeString("en-US", {
                    hour: "numeric", minute: "2-digit", hour12: true
                });
                return baseFormattedDate + " " + baseFormattedTime;
            }
            return baseFormattedDate;
        }

        // Updated Headers to match required specification parameters exactly
        csvRows.push("Title,URL,Category,SEO Score,Article Completion,Published Date,Last Modified,Word Count,Status");

        allArticles.forEach(function (article) {
            var cleanTitle = (article.title || article.key || "").replace(/"/g, '""');
            if (cleanTitle.indexOf(",") !== -1 || cleanTitle.indexOf('"') !== -1 || cleanTitle.indexOf("\n") !== -1) {
                cleanTitle = '"' + cleanTitle + '"';
            }
            
            var relativeUrl = article.url || "";
            var category = "Skincare";
            if (article.comparisonTable) {
                category = "Comparison";
            } else {
                var articleKey = article.key || "";
                var isHaircare = haircareArticlesList.some(function (h) {
                    return h.key === articleKey || (h.url && h.url === article.url);
                });
                if (isHaircare) category = "Haircare";
            }

            // Calculations mapped dynamically across parameters
            var articleSeoScore = 100; 
            Object.keys(diagnosticCategories).forEach(function(catKey) {
                var cat = diagnosticCategories[catKey];
                if (cat.area === "seo" && cat.items.includes(article.title || article.key)) {
                    articleSeoScore -= DEDUCTION_PER_WARNING;
                }
            });
            
            // Deduct key repetitions globally if present in collection validation maps
            if (uniqueArticleKeys[article.key] && uniqueArticleKeys[article.key].length > 1) {
                articleSeoScore -= DEDUCTION_PER_WARNING;
            }
            if (articleSeoScore < 0) articleSeoScore = 0;

            var compScore = Math.min(article._completenessScore || 0, 100);
            var publishedDate = formatCsvDate(article.date || "");
            var lastModified = formatCsvDate(article.dateModified || "");
            var wordCount = countWordsInContent(article);
            var textStatus = compScore >= 85 ? "Fully Optimized" : "Needs Attention";

            if (publishedDate.indexOf(",") !== -1) publishedDate = '"' + publishedDate + '"';
            if (lastModified.indexOf(",") !== -1) lastModified = '"' + lastModified + '"';

            csvRows.push([
                cleanTitle, relativeUrl, category, articleSeoScore, compScore + "%", publishedDate, lastModified, wordCount, textStatus
            ].join(","));
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

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", runEnginePipeline);
    } else {
        runEnginePipeline();
    }
})();
