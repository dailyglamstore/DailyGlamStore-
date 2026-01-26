fetch("data/products.json")
  .then(res => res.json())
  .then(data => {
    const category = data.categories[0]; // Earrings
    const productsWrap = document.querySelector("#earrings + .products");

    category.products.forEach(p => {
      const imagesHTML = p.images
        .map(img => `<img src="${img}">`)
        .join("");

      const detailsHTML = p.details
        .map(d => `${d}<br>`)
        .join("");

      const productHTML = `
        <div class="product-card">
          <div class="slider">
            <div class="slides">
              ${imagesHTML}
            </div>
            <div class="image-counter">1 / ${p.images.length}</div>
          </div>

          <h3>${p.name}</h3>
          <div class="product-code">Product Code: ${p.code}</div>

          <div class="price-box">
            <span class="mrp-label">MRP</span>
            <span class="mrp-amount">₹${p.mrp}</span>
            <span class="final-price">₹${p.price}</span>
          </div>

          <div class="view-details-btn" onclick="toggleDetails(this)">
            <span class="text">View Details</span>
            <span class="arrow">⌄</span>
          </div>

          <div class="product-details">
            ${detailsHTML}
          </div>

          <a class="whatsapp-btn"
             href="#"
             data-product="${p.name}"
             data-code="${p.code}"
             onclick="orderOnWhatsApp(this)">
            Order on WhatsApp
          </a>
        </div>
      `;

      productsWrap.insertAdjacentHTML("beforeend", productHTML);
    });
  })

.then(() => {
  if (typeof initSliders === "function") {
    initSliders();
  }
});

  .catch(err => console.error("JSON load error:", err));
