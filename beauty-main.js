(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function createProductCard(product) {
    const details = Array.isArray(product.details) ? product.details : [];
    const detailsHtml = details.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");

    return [
      '<div class="product-card">',
      '  <div class="product-media">',
      '    <img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" class="product-img" />',
      "  </div>",
      '  <h3 class="product-title">' + escapeHtml(product.name) + "</h3>",
      '  <div class="product-meta">Brand : ' + escapeHtml(product.brand) + "</div>",
      '  <div class="price-row"><span>MRP: </span><span class="mrp-value">' + escapeHtml(product.mrp) + "</span></div>",
      '  <a href="' + escapeHtml(product.link) + '" target="_blank" rel="nofollow sponsored" class="price-btn">Buy on Official Website</a>',
      '  <p class="price-note">' + escapeHtml(product.note || "") + "</p>",
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

  document.addEventListener("DOMContentLoaded", function () {
    const data = window.BEAUTY_PRODUCTS;
    if (!data) {
      return;
    }

    renderProducts("#top-picks .products", data.topPicks);
    renderProducts("#skincare-recommendations .products", data.skincare);
    renderProducts("#haircare-recommendations .products", data.haircare);
    bindDetailsToggles();
  });
})();
