/**
 * Daily Glam Store - Publisher Tools Engine
 * Fully integrated with beauty-blog-loader.js & article-registry.js
 */

(function () {
  "use strict";

  const BASE_URL = "https://dailyglamstore.in";

  // Static site routes for sitemap generation
  const STATIC_ROUTES = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/beauty-blog.html", priority: "0.9", changefreq: "daily" }
  ];

  let auditState = {
    articles: [],
    skincareCount: 0,
    haircareCount: 0,
    totalWords: 0,
    averageScore: 0,
    issuesFound: 0
  };

  /**
   * 1. RECURSIVE CONTENT & WORD COUNT PARSER
   * Recursively traverses sections[].blocks[] and metadata
   */
  function extractArticleText(article) {
    let fullText = "";

    // Header & Meta Text
    if (article.title) fullText += article.title + " ";
    if (article.cardDescription) fullText += article.cardDescription + " ";
    if (article.excerpt) fullText += article.excerpt + " ";
    if (article.intro) fullText += article.intro + " ";

    // Traversal of Section Blocks
    if (Array.isArray(article.sections)) {
      article.sections.forEach((sec) => {
        if (sec.heading) fullText += sec.heading + " ";
        if (Array.isArray(sec.blocks)) {
          sec.blocks.forEach((block) => {
            if (typeof block === "string") {
              fullText += block + " ";
            } else if (typeof block === "object" && block !== null) {
              if (block.subHeading) fullText += block.subHeading + " ";
              if (block.text) fullText += block.text + " ";
              if (Array.isArray(block.paragraph)) {
                fullText += block.paragraph.join(" ") + " ";
              } else if (typeof block.paragraph === "string") {
                fullText += block.paragraph + " ";
              }
              if (Array.isArray(block.bullets)) {
                fullText += block.bullets.join(" ") + " ";
              }
              if (block.infoBox) {
                if (block.infoBox.title) fullText += block.infoBox.title + " ";
                if (block.infoBox.text) fullText += block.infoBox.text + " ";
              }
            }
          });
        }
      });
    }

    // FAQ Block Traversal
    if (Array.isArray(article.faq)) {
      article.faq.forEach((f) => {
        if (f.question) fullText += f.question + " ";
        if (f.answer) fullText += f.answer + " ";
      });
    }

    // Product Recommendations Traversal
    if (Array.isArray(article.products)) {
      article.products.forEach((p) => {
        if (p.name) fullText += p.name + " ";
        if (p.description) fullText += p.description + " ";
        if (Array.isArray(p.pros)) fullText += p.pros.join(" ") + " ";
        if (Array.isArray(p.cons)) fullText += p.cons.join(" ") + " ";
      });
    }

    return fullText;
  }

  function calculateWordCount(text) {
    if (!text) return 0;
    const clean = text.replace(/<[^>]*>/g, " ").replace(/[^\w\s]/gi, " ");
    const words = clean.trim().split(/\s+/).filter((w) => w.length > 0);
    return words.length;
  }

  /**
   * 2. DIAGNOSTIC SUITE (23 SEO & ARCHITECTURE RULES)
   */
  function runDiagnostics(article, allArticles) {
    const rules = [];
    const wordCount = article._wordCount || 0;

    // Rule 1: Title Tag Presence
    rules.push({ name: "Title Exists", pass: !!article.title, impact: 10 });
    
    // Rule 2: Title Length (30-70 chars)
    const titleLen = article.title ? article.title.length : 0;
    rules.push({ name: "Optimal Title Length (30-70 chars)", pass: titleLen >= 30 && titleLen <= 70, impact: 5 });

    // Rule 3: Description Exists
    const desc = article.cardDescription || article.description || article.excerpt;
    rules.push({ name: "Meta Description Exists", pass: !!desc, impact: 10 });

    // Rule 4: Meta Description Length (80-160 chars)
    const descLen = desc ? desc.length : 0;
    rules.push({ name: "Optimal Meta Description (80-160 chars)", pass: descLen >= 80 && descLen <= 160, impact: 5 });

    // Rule 5: Article Image Defined
    const hasImg = !!(article.image && (article.image.src || typeof article.image === "string"));
    rules.push({ name: "Featured Image Defined", pass: hasImg, impact: 8 });

    // Rule 6: Image Alt Attribute
    const hasAlt = !!(typeof article.image === "object" && article.image.alt);
    rules.push({ name: "Featured Image Alt Text Present", pass: hasAlt, impact: 4 });

    // Rule 7: Category Assignment
    rules.push({ name: "Valid Category Defined", pass: article.category === "Skincare" || article.category === "Haircare", impact: 5 });

    // Rule 8: URL Path Defined
    const url = article.url || article.link;
    rules.push({ name: "Canonical URL Assigned", pass: !!url, impact: 10 });

    // Rule 9: Word Count Thresholds (Min 700 standard, 1200 comparison)
    const isComparison = (article.title && article.title.toLowerCase().includes("vs")) || (article.type === "comparison");
    const minWords = isComparison ? 1200 : 700;
    rules.push({ name: `Sufficient Content Depth (${minWords}+ words)`, pass: wordCount >= minWords, impact: 10 });

    // Rule 10: Section Blocks Structure
    rules.push({ name: "Structured Sections Defined", pass: Array.isArray(article.sections) && article.sections.length >= 2, impact: 8 });

    // Rule 11: Author Metadata
    rules.push({ name: "Author Schema Provided", pass: !!article.author, impact: 3 });

    // Rule 12: Publication Date
    rules.push({ name: "Publication Date Defined", pass: !!(article.publishedAt || article.datePublished), impact: 4 });

    // Rule 13: Modification Date Freshness
    rules.push({ name: "Updated Date Freshness", pass: !!(article.updatedAt || article.dateModified), impact: 3 });

    // Rule 14: FAQ Schema Array
    rules.push({ name: "FAQ Schema Array Present", pass: Array.isArray(article.faq) && article.faq.length >= 2, impact: 5 });

    // Rule 15: Product Recommendations Block
    rules.push({ name: "Product Recommendation Blocks", pass: Array.isArray(article.products) && article.products.length > 0, impact: 5 });

    // Rule 16: Affiliate Link Property Check
    const hasAffiliateLinks = Array.isArray(article.products) && article.products.some(p => p.affiliateUrl || p.buyUrl);
    rules.push({ name: "Monetization Links Functional", pass: hasAffiliateLinks, impact: 5 });

    // Rule 17: Intro Paragraph Presence
    rules.push({ name: "Intro Summary Included", pass: !!article.intro, impact: 4 });

    // Rule 18: Table of Contents / Key Highlights
    rules.push({ name: "Key Takeaways / Highlights", pass: !!(article.highlights || article.keyTakeaways), impact: 3 });

    // Rule 19: Related Articles Linking
    rules.push({ name: "Related Articles Internal Array", pass: Array.isArray(article.relatedArticles) && article.relatedArticles.length > 0, impact: 4 });

    // Rule 20: Unique URL Validation
    const duplicateUrls = allArticles.filter(a => (a.url || a.link) === url);
    rules.push({ name: "Unique Canonical Slug Check", pass: duplicateUrls.length <= 1, impact: 10 });

    // Rule 21: No Blank Section Headings
    const emptyHeadings = Array.isArray(article.sections) && article.sections.some(s => !s.heading || s.heading.trim() === "");
    rules.push({ name: "Section Headings Non-Empty", pass: !emptyHeadings, impact: 4 });

    // Rule 22: Content Paragraphs Depth
    const totalBlocks = Array.isArray(article.sections) ? article.sections.reduce((acc, s) => acc + (s.blocks ? s.blocks.length : 0), 0) : 0;
    rules.push({ name: "Rich Content Blocks (5+ blocks)", pass: totalBlocks >= 5, impact: 5 });

    // Rule 23: Clean Slug Format
    const cleanSlug = url ? /^[a-z0-9\-\.\/]+$/.test(url) : false;
    rules.push({ name: "SEO Clean URL Slug Format", pass: cleanSlug, impact: 4 });

    // Score Calculation
    let maxPossible = 0;
    let earned = 0;
    rules.forEach((r) => {
      maxPossible += r.impact;
      if (r.pass) earned += r.impact;
    });

    const score = Math.round((earned / maxPossible) * 100);

    return { rules, score };
  }

  /**
   * 3. ENGINE INITIALIZATION & DATA HARVESTER
   */
  function harvestAndAnalyze() {
    const skincareMap = window.SKINCARE_ARTICLES || {};
    const haircareMap = window.HAIRCARE_ARTICLES || {};

    const skincareList = Object.values(skincareMap);
    const haircareList = Object.values(haircareMap);

    const rawList = [...skincareList, ...haircareList];

    if (rawList.length === 0) {
      console.warn("Publisher Tools: No articles found in memory.");
      return;
    }

    let totalWords = 0;
    let totalScore = 0;
    let totalIssues = 0;

    const processed = rawList.map((art) => {
      const fullText = extractArticleText(art);
      const wordCount = calculateWordCount(fullText);
      art._wordCount = wordCount;
      totalWords += wordCount;

      const audit = runDiagnostics(art, rawList);
      art._audit = audit;
      totalScore += audit.score;

      const failedRules = audit.rules.filter((r) => !r.pass);
      totalIssues += failedRules.length;

      return art;
    });

    auditState = {
      articles: processed,
      skincareCount: skincareList.length,
      haircareCount: haircareList.length,
      totalWords: totalWords,
      averageScore: Math.round(totalScore / processed.length),
      issuesFound: totalIssues
    };

    renderDashboard();
  }

  /**
   * 4. UI RENDERER & SITEMAP / CSV GENERATORS
   */
  function renderDashboard() {
    const container = document.getElementById("publisherDashboard");
    if (!container) return;

    container.innerHTML = `
      <div class="publisher-grid">
        <div class="stat-card">
          <div class="stat-title">Total Articles</div>
          <div class="stat-value">${auditState.articles.length}</div>
          <div class="stat-sub">Skincare: ${auditState.skincareCount} | Haircare: ${auditState.haircareCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Average SEO Score</div>
          <div class="stat-value ${auditState.averageScore >= 80 ? 'green' : 'orange'}">${auditState.averageScore}/100</div>
          <div class="stat-sub">Health Index across inventory</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total Word Count</div>
          <div class="stat-value">${auditState.totalWords.toLocaleString()}</div>
          <div class="stat-sub">Avg: ${Math.round(auditState.totalWords / (auditState.articles.length || 1))} words/art</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Issues Flagged</div>
          <div class="stat-value ${auditState.issuesFound === 0 ? 'green' : 'red'}">${auditState.issuesFound}</div>
          <div class="stat-sub">Action items for optimization</div>
        </div>
      </div>

      <div class="publisher-actions">
        <button id="btnGenerateSitemap" class="pub-btn primary">📋 Generate & Copy XML Sitemap</button>
        <button id="btnExportCSV" class="pub-btn secondary">📥 Export Diagnostic CSV Report</button>
      </div>

      <div class="publisher-table-wrap">
        <table class="publisher-table">
          <thead>
            <tr>
              <th>Article Title</th>
              <th>Category</th>
              <th>Word Count</th>
              <th>SEO Health</th>
              <th>Diagnostics</th>
            </tr>
          </thead>
          <tbody>
            ${auditState.articles.map(art => {
              const url = art.url || art.link || "#";
              const score = art._audit.score;
              const failed = art._audit.rules.filter(r => !r.pass);
              return `
                <tr>
                  <td>
                    <strong><a href="${url}" target="_blank">${art.title || 'Untitled'}</a></strong>
                    <div class="table-url">${url}</div>
                  </td>
                  <td><span class="badge ${art.category === 'Haircare' ? 'haircare' : 'skincare'}">${art.category || 'General'}</span></td>
                  <td>${art._wordCount.toLocaleString()} words</td>
                  <td>
                    <span class="score-pill ${score >= 85 ? 'high' : score >= 70 ? 'med' : 'low'}">${score}/100</span>
                  </td>
                  <td>
                    ${failed.length === 0 ? '<span class="status-pass">✓ All 23 Rules Passed</span>' : `
                      <details class="issue-details">
                        <summary><span class="status-fail">⚠ ${failed.length} Issues</span></summary>
                        <ul>
                          ${failed.map(f => `<li>${f.name}</li>`).join('')}
                        </ul>
                      </details>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Event Bindings
    document.getElementById("btnGenerateSitemap").addEventListener("click", generateAndCopySitemap);
    document.getElementById("btnExportCSV").addEventListener("click", exportDiagnosticCSV);
  }

  /**
   * 5. SITEMAP GENERATOR
   */
  function generateAndCopySitemap() {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static Routes
    STATIC_ROUTES.forEach(route => {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${route.url}</loc>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Dynamic Articles
    auditState.articles.forEach(art => {
      const slug = art.url || art.link || "";
      const path = slug.startsWith("http") ? slug : `${BASE_URL}${slug.startsWith("/") ? "" : "/"}${slug}`;
      const lastMod = art.updatedAt || art.publishedAt || new Date().toISOString().split("T")[0];

      xml += `  <url>\n`;
      xml += `    <loc>${path}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    navigator.clipboard.writeText(xml).then(() => {
      alert("XML Sitemap generated and copied to your clipboard!");
    }).catch(err => {
      console.error("Clipboard error:", err);
      alert("XML Sitemap generated! Check browser console.");
      console.log(xml);
    });
  }

  /**
   * 6. CSV EXPORTER
   */
  function exportDiagnosticCSV() {
    let csv = "Title,Category,URL,Word Count,SEO Score,Passed Rules,Failed Rules,Issues List\n";

    auditState.articles.forEach(art => {
      const title = `"${(art.title || '').replace(/"/g, '""')}"`;
      const cat = `"${art.category || 'General'}"`;
      const url = `"${art.url || art.link || ''}"`;
      const words = art._wordCount;
      const score = art._audit.score;
      const passedCount = art._audit.rules.filter(r => r.pass).length;
      const failed = art._audit.rules.filter(r => !r.pass);
      const failedNames = `"${failed.map(f => f.name).join('; ')}"`;

      csv += `${title},${cat},${url},${words},${score},${passedCount},${failed.length},${failedNames}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `dailyglamstore_seo_audit_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * 7. LOADER SYNCHRONIZATION HOOK
   * Connects seamlessly with beauty-blog-loader.js lifecycle
   */
  function init() {
    if (window.SKINCARE_ARTICLES && Object.keys(window.SKINCARE_ARTICLES).length > 0) {
      harvestAndAnalyze();
    } else {
      document.addEventListener("articlesLoaded", harvestAndAnalyze);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
