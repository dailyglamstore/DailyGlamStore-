(function () {
  // Beauty page renderer using split category files under data/beauty/
  // Future images should be uploaded inside images/beauty/<section>/<category>/

  const IMAGE_PATH_REFERENCE = {
    topPicks: "images/beauty/top-picks/",
    brands: "images/beauty/brands/",
    skincare: {
      facewash: "images/beauty/skincare/facewash/",
      serum: "images/beauty/skincare/serum/",
      moisturiser: "images/beauty/skincare/moisturiser/",
      sunscreen: "images/beauty/skincare/sunscreen/"
    },
    haircare: {
      shampoo: "images/beauty/haircare/shampoo/",
      conditioner: "images/beauty/haircare/conditioner/",
      hairSerum: "images/beauty/haircare/hair-serum/",
      hairOil: "images/beauty/haircare/hair-oil/"
    }
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeProduct(product) {
    return {
      id: product.id || "",
      name: product.name || "",
      brand: product.brand || "",
      image: product.image || "",
      url: product.url || product.link || "#",
      priceText: product.priceText || product.mrp || "Check on official website",
      note: product.note || "",
      details: Array.isArray(product.details) ? product.details : []
    };
  }

  function createProductCard(rawProduct) {
    const product = normalizeProduct(rawProduct);
    const detailsHtml = product.details.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");

    return [
      '<div class="product-card">',
      '  <div class="product-media">',
      '    <img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" class="product-img" />',
      "  </div>",
      '  <h3 class="product-title">' + escapeHtml(product.name) + "</h3>",
      '  <div class="product-meta">Brand : ' + escapeHtml(product.brand) + "</div>",
      '  <div class="price-row"><span>MRP: </span><span class="mrp-value">' + escapeHtml(product.priceText) + "</span></div>",
      '  <a href="' + escapeHtml(product.url) + '" target="_blank" rel="nofollow sponsored" class="price-btn">Buy on Official Website</a>',
      '  <p class="price-note">' + escapeHtml(product.note) + "</p>",
      '  <div class="toggle-box">',
      '    <button class="toggle-header" type="button" aria-expanded="false">',
      '      Key Product Details <span class="arrow">▼</span>',
      "    </button>",
      '    <div class="toggle-content"><ul>' + detailsHtml + "</ul></div>",
      "  </div>",
      "</div>"
    ].join("\n");
  }

  function renderProducts(containerSelector, products) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = '<p class="section-intro">Products will be updated soon.</p>';
      return;
    }

    container.innerHTML = products.map(createProductCard).join("\n");
  }

  function bindDetailsToggles() {
    document.querySelectorAll(".toggle-header").forEach(function (button) {
      button.addEventListener("click", function () {
        const content = button.nextElementSibling;
        const arrow = button.querySelector(".arrow");
        const isOpen = content && content.style.display === "block";

        document.querySelectorAll(".toggle-content").forEach(function (panel) {
          panel.style.display = "none";
        });
        document.querySelectorAll(".toggle-header .arrow").forEach(function (icon) {
          icon.textContent = "▼";
        });
        document.querySelectorAll(".toggle-header").forEach(function (headerBtn) {
          headerBtn.setAttribute("aria-expanded", "false");
        });

        if (!isOpen && content) {
          content.style.display = "block";
          if (arrow) {
            arrow.textContent = "▲";
          }
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function getBeautyData() {
    const topPicks = window.BEAUTY_TOP_PICKS_PRODUCTS || [];

    const skincare = []
      .concat(window.BEAUTY_SKINCARE_FACEWASH_PRODUCTS || [])
      .concat(window.BEAUTY_SKINCARE_SERUM_PRODUCTS || [])
      .concat(window.BEAUTY_SKINCARE_MOISTURISER_PRODUCTS || [])
      .concat(window.BEAUTY_SKINCARE_SUNSCREEN_PRODUCTS || []);

    const haircare = []
      .concat(window.BEAUTY_HAIRCARE_SHAMPOO_PRODUCTS || [])
      .concat(window.BEAUTY_HAIRCARE_CONDITIONER_PRODUCTS || [])
      .concat(window.BEAUTY_HAIRCARE_HAIR_SERUM_PRODUCTS || [])
      .concat(window.BEAUTY_HAIRCARE_HAIR_OIL_PRODUCTS || []);

    return {
      topPicks: topPicks,
      skincare: skincare,
      haircare: haircare,
      imagePathReference: IMAGE_PATH_REFERENCE
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    const data = getBeautyData();

    renderProducts("#top-picks .products", data.topPicks);
    renderProducts("#skincare-recommendations .products", data.skincare);
    renderProducts("#haircare-recommendations .products", data.haircare);
    bindDetailsToggles();
  });
})();
