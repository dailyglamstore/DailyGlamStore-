(function () {
  var config = window.ARTICLE_PAGE_CONFIG || {};
  var source = window[config.source];
  var article = source && source[config.key];

  if (!article) return;

  var siteUrl = "https://dailyglamstore.in";
  var fullUrl = siteUrl + article.url;

  var title =
    article.seoTitle || article.title || "Daily Glam Store";

  var description =
    article.seoDescription ||
    article.intro ||
    "Beauty recommendations and guides.";

  var image =
    article.image && article.image.src
      ? siteUrl + "/" + article.image.src.replace(/^\/+/, "")
      : siteUrl + "/images/logo.png";

  function setMeta(name, content, property) {
    if (!content) return;

    var selector = property
      ? 'meta[property="' + property + '"]'
      : 'meta[name="' + name + '"]';

    var meta = document.querySelector(selector);

    if (!meta) {
      meta = document.createElement("meta");

      if (property) {
        meta.setAttribute("property", property);
      } else {
        meta.setAttribute("name", name);
      }

      document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
  }

  document.title = title;

  setMeta("description", description);

  var canonical =
    document.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }

  canonical.href = fullUrl;

  setMeta(null, title, "og:title");
  setMeta(null, description, "og:description");
  setMeta(null, fullUrl, "og:url");
  setMeta(null, image, "og:image");
  setMeta(null, "article", "og:type");

  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  setMeta("twitter:image", image);

  var authorSchema = (article.author || [
  {
    enabled: true,
    type: "Organization",
    name: "Daily Glam Store"
  }
])
  .filter(function(author) {
    return author.enabled !== false;
  })
  .map(function(author) {
    return {
  "@type": author.type,
  name: author.name,
  url: author.url
};
  });

var schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: article.title,
  description: description,
  image: image,
  datePublished: article.date,
  dateModified: article.dateModified || article.date,
  mainEntityOfPage: fullUrl,
  author: authorSchema,
  publisher: {
    "@type": "Organization",
    name: "Daily Glam Store",
    logo: {
      "@type": "ImageObject",
      url: siteUrl + "/images/logo.png"
    }
  }
};

var breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl + "/"
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Beauty Blog",
      item: siteUrl + "/beauty-blog.html"
    },
    {
      "@type": "ListItem",
      position: 3,
      name: article.title,
      item: fullUrl
    }
  ]
};
  
  var schemas = [
  schema,
  breadcrumbSchema
];

if (article.faq && article.faq.length) {
  schemas.push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": article.faq.map(function(item) {
      return {
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      };
    })
  });
}

  var script = document.createElement("script");
script.type = "application/ld+json";
script.text =
  JSON.stringify(schemas);

document.head.appendChild(script);
})();