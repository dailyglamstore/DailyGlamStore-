document.addEventListener("DOMContentLoaded", () => {

  window.toggleMenu = function () {
    const menu = document.getElementById("menuDropdown");
    if (!menu) return;
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  };

  window.toggleCategoryMenu = function (e) {
    e.stopPropagation();
    const subMenu = document.getElementById("categorySubMenu");
    const btn = e.currentTarget;
    if (!subMenu) return;
    subMenu.classList.toggle("open");
    btn.classList.toggle("open");
  };

  document.addEventListener("click", e => {
    const menu = document.getElementById("menuDropdown");
    const button = document.querySelector(".menu-btn");
    if (!menu || !button) return;
    if (!menu.contains(e.target) && !button.contains(e.target)) {
      menu.style.display = "none";
    }
  });

  function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !products) return;

    container.innerHTML = products.map(p => `
      <div class="product-card">
        <div class="slider">
          <div class="slides">
            ${p.images.map(img => `<img src="${img}">`).join("")}
          </div>
          <div class="image-counter"></div>
        </div>

        <h3>${p.name}</h3>
        <div class="product-code">Code: ${p.code}</div>

        <div class="price-box">
          <span class="mrp-amount">₹${p.mrp}</span>
          <span class="final-price">₹${p.price}</span>
        </div>

        <a href="javascript:void(0)"
           class="whatsapp-btn"
           data-product="${p.name}"
           data-code="${p.code}">
          Order on WhatsApp
        </a>

        <div class="view-details-btn">View Details</div>

        <div class="product-details">
          <ul>
            ${p.details.map(d => `<li>${d}</li>`).join("")}
          </ul>
        </div>
      </div>
    `).join("");
  }

  document.addEventListener("click", e => {
    if (!e.target.classList.contains("view-details-btn")) return;
    const card = e.target.closest(".product-card");
    const details = card.querySelector(".product-details");
    details.classList.toggle("active");
    e.target.textContent = details.classList.contains("active")
      ? "Hide Details"
      : "View Details";
  });

  document.addEventListener("click", e => {
    if (!e.target.classList.contains("whatsapp-btn")) return;
    const btn = e.target;
    const card = btn.closest(".product-card");

    const msg =
`Hello Daily Glam Store 👋

I want to order:
${btn.dataset.product}
Code: ${btn.dataset.code}

Price: ${card.querySelector(".final-price").textContent}

Please share availability & payment details.`;

    window.open(
      "https://wa.me/919463638810?text=" + encodeURIComponent(msg),
      "_blank"
    );
  });

  function initSliders() {
    document.querySelectorAll(".slider").forEach(slider => {
      const slides = slider.querySelector(".slides");
      let index = 0;

      slider.addEventListener("click", () => {
        index = (index + 1) % slides.children.length;
        slides.scrollTo({
          left: slides.children[index].offsetLeft,
          behavior: "smooth"
        });
      });
    });
  }

  fetch("products.json")
    .then(r => r.json())
    .then(data => {
      renderProducts(data.deal, "deal-products");
      renderProducts(data.earrings, "earrings-products");
      renderProducts(data.handbags, "handbags-products");
      renderProducts(data.wallets, "wallets-products");
      setTimeout(initSliders, 200);
    })
    .catch(err => console.error(err));

});
