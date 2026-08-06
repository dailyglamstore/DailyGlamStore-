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
    },
    makeup: {
      eyebrow: "images/beauty-images/makeup/eyebrow/",
      lips: "images/beauty-images/makeup/lips/",
      face: "images/beauty-images/makeup/face/"
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

  function normalizeImages(product) {
    let rawImages = [];

    if (Array.isArray(product.images) && product.images.length > 0) {
      rawImages = product.images;
    } else if (Array.isArray(product.image) && product.image.length > 0) {
      rawImages = product.image;
    } else if (typeof product.image === "string" && product.image.trim()) {
      rawImages = [product.image];
    }

    return rawImages.map(resolveImagePath);
  }

  function normalizeProduct(product) {
    return {
      id: product.id || "",
      name: product.name || "",
      brand: product.brand || "",
      images: normalizeImages(product),
      // Brand URL fallback accepts brandUrl, url, or link
      brandUrl: product.brandUrl || product.url || product.link || "",
      // Amazon URL fallback accepts amazonUrl or amazonLink
      amazonUrl: product.amazonUrl || product.amazonLink || "",
      priceText: product.priceText || "Check Latest Price",
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
      haircare: "Popular",
      makeup: "Must Have"
    };

    return badgesBySection[sectionKey] || "";
  }

  function renderMediaHtml(product, badgeHtml) {
    const images = product.images;

    if (images.length <= 1) {
      const singleImgSrc = images[0] || "";
      return [
        '<div class="product-media">',
        "  " + badgeHtml,
        '  <img src="' + escapeHtml(singleImgSrc) + '" alt="' + escapeHtml(product.name) + '" class="product-img" />',
        '</div>'
      ].join("\n");
    }

    const imgTagsHtml = images.map(function (src) {
      return '    <img src="' + escapeHtml(src) + '" alt="' + escapeHtml(product.name) + '" class="product-img" />';
    }).join("\n");

    const dotsHtml = images.map(function (_, i) {
      return '<span class="dot' + (i === 0 ? " active" : "") + '"></span>';
    }).join("");

    return [
      '<div class="product-media card-media-wrapper">',
      "  " + badgeHtml,
      '  <div class="product-slider">',
      imgTagsHtml,
      '  </div>',
      '  <div class="slider-dots">',
      '    ' + dotsHtml,
      '  </div>',
      '</div>'
    ].join("\n");
  }

  function createProductCard(rawProduct, index, sectionKey) {
    const product = normalizeProduct(rawProduct);
    const badgeText = getAutoBadgeText(sectionKey, index);
    const badgeHtml = badgeText ? '<span class="product-badge">' + escapeHtml(badgeText) + "</span>" : "";
    const mediaHtml = renderMediaHtml(product, badgeHtml);

    const detailsHtml = product.details.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");

    // Render Amazon Primary Button safely if URL is present & non-empty
    const hasAmazonUrl = Boolean(product.amazonUrl && String(product.amazonUrl).trim());
    const amazonBtnHtml = hasAmazonUrl ? [
      '    <a href="' + escapeHtml(String(product.amazonUrl).trim()) + '" target="_blank" rel="nofollow sponsored" class="price-btn btn-amazon">',
      '      🛒 Buy on Amazon',
      '    </a>'
    ].join("\n") : "";

    // Render Brand Secondary Button safely if URL is present & non-empty
    const hasBrandUrl = Boolean(product.brandUrl && String(product.brandUrl).trim());
    const brandBtnHtml = hasBrandUrl ? [
      '    <a href="' + escapeHtml(String(product.brandUrl).trim()) + '" target="_blank" rel="nofollow sponsored" class="price-btn btn-brand">',
      '      🌐 Buy on Official Website',
      '    </a>'
    ].join("\n") : "";

    return [
      '<div class="product-card">',
      mediaHtml,
      '  <h3 class="product-title">' + escapeHtml(product.name) + "</h3>",
      '  <div class="product-meta">Brand : ' + escapeHtml(product.brand) + "</div>",
      '  <div class="price-row"><span>Price : </span><span>' + formatPriceText(product.priceText) + '</span></div>',
      '  <div class="product-actions">',
      amazonBtnHtml,
      brandBtnHtml,
      '  </div>',
      '  <p class="checkout-note">Offers & Discounts available at checkout</p>',
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

  function bindSliderDots() {
    document.querySelectorAll(".card-media-wrapper").forEach(function (wrapper) {
      const slider = wrapper.querySelector(".product-slider");
      const dots = wrapper.querySelectorAll(".dot");

      if (!slider || dots.length === 0) {
        return;
      }

      slider.addEventListener("scroll", function () {
        const slideWidth = slider.clientWidth;
        if (!slideWidth) return;
        const activeIndex = Math.round(slider.scrollLeft / slideWidth);

        dots.forEach(function (dot, index) {
          if (index === activeIndex) {
            dot.classList.add("active");
          } else {
            dot.classList.remove("active");
          }
        });
      });
    });
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

    const makeup = []
      .concat(window.BEAUTY_COSMETICS_EYE_PRODUCTS || [])
      .concat(window.BEAUTY_COSMETICS_LIP_PRODUCTS || [])
      .concat(window.BEAUTY_COSMETICS_FACE_PRODUCTS || []);

    return {
      topPicks: topPicks,
      skincare: skincare,
      haircare: haircare,
      makeup: makeup,
      imagePathReference: IMAGE_PATH_REFERENCE
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    const data = getBeautyData();

    renderProducts("#top-picks .products", data.topPicks, "topPicks");
    renderProducts("#facewash-container", window.BEAUTY_SKINCARE_FACEWASH_PRODUCTS || [], "skincare");
    renderProducts("#serum-container", window.BEAUTY_SKINCARE_SERUM_PRODUCTS || [], "skincare");
    renderProducts("#sunscreen-container", window.BEAUTY_SKINCARE_SUNSCREEN_PRODUCTS || [], "skincare");
    renderProducts("#moisturiser-container", window.BEAUTY_SKINCARE_MOISTURISER_PRODUCTS || [], "skincare");
    renderProducts("#shampoo-container", window.BEAUTY_HAIRCARE_SHAMPOO_PRODUCTS || [], "haircare");
    renderProducts("#conditioner-container", window.BEAUTY_HAIRCARE_CONDITIONER_PRODUCTS || [], "haircare");
    renderProducts("#hairserum-container", window.BEAUTY_HAIRCARE_HAIR_SERUM_PRODUCTS || [], "haircare");
    renderProducts("#hairoil-container", window.BEAUTY_HAIRCARE_HAIR_OIL_PRODUCTS || [], "haircare");
    renderProducts("#eyemakeup-container", window.BEAUTY_COSMETICS_EYE_PRODUCTS || [], "makeup");
    renderProducts("#lipcare-container", window.BEAUTY_COSMETICS_LIP_PRODUCTS || [], "makeup");
    renderProducts("#facemakeup-container", window.BEAUTY_COSMETICS_FACE_PRODUCTS || [], "makeup");

    bindDetailsToggles();
    bindSliderDots();
  });
})();
