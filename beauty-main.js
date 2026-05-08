(function () {
  // Beauty page renderer using split category files under data/beauty-products/
  // Future images should be uploaded inside images/beauty-images/<section>/<category>/

  const IMAGE_PATH_REFERENCE = {
    topPicks: "images/beauty-images/top-picks/",
    brands: "images/beauty-images/brands/",
    skincare: {
      facewash: "images/beauty-images/skincare/facewash/",
      serum: "images/beauty-images/skincare/serum/",
      moisturiser: "images/beauty-images/skincare/moisturiser/",
      sunscreen: "images/beauty-images/skincare/sunscreen/"
    },
    haircare: {
      shampoo: "images/beauty-images/haircare/shampoo/",
      conditioner: "images/beauty-images/haircare/conditioner/",
      hairSerum: "images/beauty-images/haircare/hair-serum/",
      hairOil: "images/beauty-images/haircare/hair-oil/"
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


  function resolveImagePath(imagePath) {
    if (!imagePath || typeof imagePath !== "string") {
      return "";
    }

    if (/^(?:https?:)?\/\//.test(imagePath) || imagePath.startsWith("../") || imagePath.startsWith("./") || imagePath.startsWith("/")) {
      return imagePath;
    }

    if (imagePath.startsWith("images/")) {
      return imagePath;
    }

    return imagePath;
  }

  function normalizeProduct(product) {
    return {
      id: product.id || "",
      name: product.name || "",
      brand: product.brand || "",
      image: resolveImagePath(product.image),
      url: product.url || product.link || "#",
      priceText: product.priceText || "Check on official website",
      note: product.note || "",
      details: Array.isArray(product.details) ? product.details : []
    };
  }

  function formatPriceText(priceText) {
    const escapedPriceText = escapeHtml(priceText);
    return escapedPriceText.replace("20% OFF", '<span class="discount-highlight">20% OFF</span>');
  }

  function getAutoBadgeText(sectionKey, index) {
    if (index > 1) {
      return "";
    }

    const badgesBySection = {
      topPicks: "Best Seller",
      skincare: "Trending",
      haircare: "Popular"
    };

    return badgesBySection[sectionKey] || "";
  }

  function createProductCard(rawProduct, index, sectionKey) {
    const product = normalizeProduct(rawProduct);
    const badgeText = getAutoBadgeText(sectionKey, index);
    const badgeHtml = badgeText ? '<span class="product-badge">' + escapeHtml(badgeText) + "</span>" : "";
    const detailsHtml = product.details.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");

    return [
      '<div class="product-card">',
      '  <div class="product-media">',
      "    " + badgeHtml,
      '    <img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" class="product-img" />',
      "  </div>",
      '  <h3 class="product-title">' + escapeHtml(product.name) + "</h3>",
      '  <div class="product-meta">Brand : ' + escapeHtml(product.brand) + "</div>",
      '  <div class="price-row"><span>Price : </span><span>' + formatPriceText(product.priceText) + '</span></div>',
      '  <a href="' + escapeHtml(product.url) + '" target="_blank" rel="nofollow sponsored" class="price-btn">Buy on Official Website</a>',
      '  <p class="checkout-note">Discount auto-applied at checkout</p>',
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

  function renderProducts(containerSelector, products, sectionKey) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = '<p class="section-intro">Products will be updated soon.</p>';
      return;
    }

    container.innerHTML = products.map(function (product, index) {
      return createProductCard(product, index, sectionKey);
    }).join("\n");
  }

  function bindDetailsToggles() {
    const visibilityCloseThreshold = 0.35;
    let activeToggle = null;
    let openCardObserver = null;

    function closeDetails(button) {
      if (!button) {
        return;
      }

      const content = button.nextElementSibling;
      const arrow = button.querySelector(".arrow");

      if (content) {
        content.style.display = "none";
      }
      if (arrow) {
        arrow.textContent = "▼";
      }
      button.setAttribute("aria-expanded", "false");
    }

    function openDetails(button) {
      if (!button) {
        return;
      }

      const content = button.nextElementSibling;
      const arrow = button.querySelector(".arrow");

      if (content) {
        content.style.display = "block";
      }
      if (arrow) {
        arrow.textContent = "▲";
      }
      button.setAttribute("aria-expanded", "true");
    }

    function closeActiveDetails() {
      if (!activeToggle) {
        return;
      }

      closeDetails(activeToggle.button);

      if (openCardObserver && activeToggle.card) {
        openCardObserver.unobserve(activeToggle.card);
      }

      activeToggle = null;
    }

    if ("IntersectionObserver" in window) {
      openCardObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!activeToggle || entry.target !== activeToggle.card) {
            return;
          }

          if (entry.intersectionRatio < visibilityCloseThreshold) {
            closeActiveDetails();
          }
        });
      }, {
        threshold: [0, visibilityCloseThreshold, 0.5, 1]
      });
    }

    document.querySelectorAll(".toggle-header").forEach(function (button) {
      button.addEventListener("click", function () {
        const content = button.nextElementSibling;
        const isOpen = content && content.style.display === "block";

        if (activeToggle && activeToggle.button !== button) {
          closeActiveDetails();
        }

        if (isOpen) {
          closeDetails(button);
          if (activeToggle && activeToggle.button === button) {
            closeActiveDetails();
          }
          return;
        }

        openDetails(button);
        activeToggle = {
          button: button,
          card: button.closest(".product-card")
        };

        if (openCardObserver && activeToggle.card) {
          openCardObserver.observe(activeToggle.card);
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

    renderProducts("#top-picks .products", data.topPicks, "topPicks");
    
    renderProducts("#facewash-products + .products", window.BEAUTY_SKINCARE_FACEWASH_PRODUCTS || [], "skincare");

    renderProducts("#serum-products + .products", window.BEAUTY_SKINCARE_SERUM_PRODUCTS || [], "skincare");

    renderProducts("#sunscreen-products + .products", window.BEAUTY_SKINCARE_SUNSCREEN_PRODUCTS || [], "skincare");

    renderProducts("#moisturiser-products + .products", window.BEAUTY_SKINCARE_MOISTURISER_PRODUCTS || [], "skincare");

    renderProducts("#shampoo-products + .products", window.BEAUTY_HAIRCARE_SHAMPOO_PRODUCTS || [], "haircare");

    renderProducts("#conditioner-products + .products", window.BEAUTY_HAIRCARE_CONDITIONER_PRODUCTS || [], "haircare");

    renderProducts("#hairserum-products + .products", window.BEAUTY_HAIRCARE_HAIR_SERUM_PRODUCTS || [], "haircare");

    renderProducts("#hairoil-products + .products", window.BEAUTY_HAIRCARE_HAIR_OIL_PRODUCTS || [], "haircare");
    
    bindDetailsToggles();

const targetHeading = document.querySelector(".subcategory-heading:target");

if (targetHeading) {

  let hasScrolled = false;

  window.addEventListener("scroll", function () {

    if (hasScrolled) {
      return;
    }

    hasScrolled = true;

    targetHeading.classList.add("remove-target-highlight");

  }, { passive: true });

}
  });
})();