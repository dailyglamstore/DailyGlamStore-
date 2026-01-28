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
  if (!e.target.closest(".view-details-btn")) return;

  const btn = e.target.closest(".view-details-btn");
  const card = btn.closest(".product-card");
  const details = card.querySelector(".product-details");
  const arrow = btn.querySelector(".vd-arrow");
  const text = btn.querySelector(".vd-text");

  details.classList.toggle("active");

  if (details.classList.contains("active")) {
    text.textContent = "Hide Details";
    arrow.textContent = "▲";
  } else {
    text.textContent = "View Details";
    arrow.textContent = "▼";
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

        <div class="view-details-btn">
  <span class="vd-text">View Details</span>
  <span class="vd-arrow">▼</span>
</div>


        <div class="product-details">
          <ul>
            ${p.details.map(d => `<li>${d}</li>`).join("")}
          </ul>
        </div>
      </div>
    `).join("");
  }

  document.addEventListener("click", e => {
  if (!e.target.classList.contains("whatsapp-btn")) return;

  const btn = e.target;
  const card = btn.closest(".product-card");

  const name = btn.dataset.product;
  const code = btn.dataset.code;

  const mrp = card.querySelector(".mrp-amount").textContent;
  const price = card.querySelector(".final-price").textContent;

  const slider = card.querySelector(".slider");
  const slides = slider.querySelectorAll(".slides img");
  const counter = slider.querySelector(".image-counter").textContent;
  const selectedIndex = parseInt(counter.split("/")[0].trim()) - 1;
  const imageUrl = slides[selectedIndex].src;

  const message =
`Hello Daily Glam Store 👋

I want to order:
*${name}*
Product Code: *${code}*
Selected Image: *${selectedIndex + 1}*
MRP: ${mrp}
Final Price: *${price}*

Image Preview 👇
${imageUrl}

Please share availability & payment details.`;

  window.open(
    "https://wa.me/919463638810?text=" + encodeURIComponent(message),
    "_blank"
  );
});


  function initSliders() {
  document.querySelectorAll(".slider").forEach(slider => {
    const slides = slider.querySelector(".slides");
    const images = slides.querySelectorAll("img");
    const counter = slider.querySelector(".image-counter");

    let index = 0;
    let startX = 0;

    function update() {
      slides.style.transform = `translateX(-${index * 92}%)`;
      counter.textContent = `${index + 1} / ${images.length}`;
    }

    update();

    slider.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });

    slider.addEventListener("touchend", e => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50 && index < images.length - 1) index++;
      if (endX - startX > 50 && index > 0) index--;
      update();
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

let zoomImages = [];
let zoomIndex = 0;
let lastTap = 0;

const zoomOverlay = document.getElementById("zoomOverlay");
const zoomImage = document.getElementById("zoomImage");
const zoomCounter = document.getElementById("zoomCounter");
const zoomClose = document.getElementById("zoomClose");

document.addEventListener("touchend", e => {
  const img = e.target.closest(".slides img");
  if (!img) return;

  const now = Date.now();
  if (now - lastTap < 300) {
    openZoom(img);
  }
  lastTap = now;
});

document.addEventListener("click", e => {
  const img = e.target.closest(".slides img");
  if (!img) return;
  openZoom(img);
});

function openZoom(img) {
  const slides = img.closest(".slides");
  zoomImages = Array.from(slides.querySelectorAll("img"));
  zoomIndex = zoomImages.indexOf(img);
  showZoom();
}

function showZoom() {
  zoomImage.src = zoomImages[zoomIndex].src;
  zoomCounter.textContent = `${zoomIndex + 1} / ${zoomImages.length}`;
  zoomOverlay.classList.add("active");
}

zoomClose.addEventListener("click", () => {
  zoomOverlay.classList.remove("active");
});

let startX = 0;

zoomOverlay.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

zoomOverlay.addEventListener("touchend", e => {
  const diff = startX - e.changedTouches[0].clientX;

  if (diff > 50 && zoomIndex < zoomImages.length - 1) zoomIndex++;
  else if (diff < -50 && zoomIndex > 0) zoomIndex--;

  showZoom();
});
