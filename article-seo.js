(function () {
  "use strict";

  function initSEO() {
    // Read directly from the dynamic window.CURRENT_ARTICLE populated by article-loader.js
    var article = window.CURRENT_ARTICLE;
    if (!article) return;

    var head = document.head;
    var siteUrl = "https://dailyglamstore.in";
    var cleanCanonical = (article.url || window.location.pathname).startsWith("http")
      ? article.url
      : siteUrl + (article.url || window.location.pathname);

    // 1. Meta Title & Description
    var seoTitle = article.seoTitle || article.title || "";
    var seoDesc = article.seoDescription || article.intro || "";

    if (seoTitle) {
      document.title = seoTitle;
      updateMeta("og:title", seoTitle, true);
      updateMeta("twitter:title", seoTitle);
    }

    if (seoDesc) {
      updateMeta("description", seoDesc);
      updateMeta("og:description", seoDesc, true);
      updateMeta("twitter:description", seoDesc);
    }

    // 2. Canonical URL & Open Graph Meta Tags
    updateMeta("og:url", cleanCanonical, true);
    updateMeta("og:type", "article", true);
    updateMeta("og:site_name", "Daily Glam Store", true);
    updateLink("canonical", cleanCanonical);

    if (article.image && article.image.src) {
      var imgUrl = article.image.src.startsWith("http")
        ? article.image.src
        : siteUrl + "/" + article.image.src.replace(/^\/+/, "");
      updateMeta("og:image", imgUrl, true);
      updateMeta("twitter:image", imgUrl);
      updateMeta("twitter:card", "summary_large_image");
      if (article.image.alt) {
        updateMeta("og:image:alt", article.image.alt, true);
      }
    }

    // 3. Schema.org JSON-LD Generation
    injectSchema(article, cleanCanonical, siteUrl);
  }

  function updateMeta(nameOrProperty, content, isProperty) {
    var selector = isProperty
      ? 'meta[property="' + nameOrProperty + '"]'
      : 'meta[name="' + nameOrProperty + '"]';
    var element = document.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      if (isProperty) {
        element.setAttribute("property", nameOrProperty);
      } else {
        element.setAttribute("name", nameOrProperty);
      }
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  }

  function updateLink(rel, href) {
    var element = document.querySelector('link[rel="' + rel + '"]');
    if (!element) {
      element = document.createElement("link");
      element.setAttribute("rel", rel);
      document.head.appendChild(element);
    }
    element.setAttribute("href", href);
  }

  function injectSchema(article, articleUrl, siteUrl) {
    // Article Schema
    var articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": articleUrl
      },
      "headline": article.title || article.seoTitle,
      "description": article.seoDescription || article.intro,
      "datePublished": article.date,
      "dateModified": article.dateModified || article.date,
      "publisher": {
        "@type": "Organization",
        "name": "Daily Glam Store",
        "url": siteUrl
      }
    };

    if (article.author && article.author.length > 0) {
      articleSchema.author = article.author.map(function (auth) {
        return {
          "@type": auth.type || "Person",
          "name": auth.name,
          "url": auth.url || siteUrl
        };
      });
    }

    if (article.image && article.image.src) {
      var imgUrl = article.image.src.startsWith("http")
        ? article.image.src
        : siteUrl + "/" + article.image.src.replace(/^\/+/, "");
      articleSchema.image = [imgUrl];
    }

    appendSchemaScript(articleSchema);

    // Breadcrumb Schema
    var breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": siteUrl + "/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": article.category || "Blog",
          "item": siteUrl + "/#beauty-blog"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": article.title,
          "item": articleUrl
        }
      ]
    };

    appendSchemaScript(breadcrumbSchema);

    // FAQ Schema (if FAQs are present)
    if (article.faq && article.faq.length > 0) {
      var faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": article.faq.map(function (item) {
          return {
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer
            }
          };
        })
      };
      appendSchemaScript(faqSchema);
    }
  }

  function appendSchemaScript(schemaData) {
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);
  }

  // Execute once DOM / window is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSEO);
  } else {
    initSEO();
  }
})();
