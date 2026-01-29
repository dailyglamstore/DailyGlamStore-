document.addEventListener("DOMContentLoaded", () => {

  const menu = document.getElementById("menuDropdown");
  const menuBtn = document.querySelector(".menu-btn");
  const categorySubMenu = document.getElementById("categorySubMenu");

  window.toggleMenu = () => {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  };

  window.toggleCategoryMenu = (e) => {
    e.stopPropagation();
    categorySubMenu.classList.toggle("open");
    e.currentTarget.classList.toggle("open");
  };

  document.querySelectorAll(".menu-dropdown a").forEach(link => {
    link.addEventListener("click", () => {
      menu.style.display = "none";
      categorySubMenu.classList.remove("open");
    });
  });

  document.addEventListener("click", e => {
    if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
      menu.style.display = "none";
    }
  });

  window.addEventListener("scroll", () => {
    menu.style.display = "none";
  });


  function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !products.length) return;

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

        <a href="javascript:void(0)" class="whatsapp-btn"
           data-product="${p.name}" data-code="${p.code}">
          Order on WhatsApp
        </a>

        <div class="view-details-btn">
          <span class="vd-text">View Details</span>
          <span class="vd-arrow">▼</span>
        </div>

        <div class="product-details">
          <ul>${p.details.map(d => `<li>${d}</li>`).join("")}</ul>
        </div>
      </div>
    `).join("");
  }


  function initSliders() {
  document.querySelectorAll(".slider").forEach(slider => {
    const slidesWrap = slider.querySelector(".slides");
    const slides = slidesWrap.querySelectorAll("img");
    const counter = slider.querySelector(".image-counter");
    const gap = parseInt(getComputedStyle(slidesWrap).gap) || 0;

    const slideWidth = () => slides[0].offsetWidth + gap;

    let counterTimer;

    const updateCounter = () => {
      const index = Math.round(slidesWrap.scrollLeft / slideWidth());
      counter.textContent = `${index + 1} / ${slides.length}`;
      counter.style.opacity = "1";

      clearTimeout(counterTimer);
      counterTimer = setTimeout(() => {
        counter.style.opacity = "0";
      }, 2000);
    };

    // Initial
    updateCounter();

    slidesWrap.addEventListener("scroll", updateCounter, { passive: true });
  });
}

  const zoomOverlay = document.getElementById("zoomOverlay");
  const zoomImage = document.getElementById("zoomImage");
  const zoomCounter = document.getElementById("zoomCounter");
  const zoomClose = document.getElementById("zoomClose");

  let zoomImages = [];
  let zoomIndex = 0;
  let startX = 0;
  let lastTap = 0;
  let zoomed = false;

  document.addEventListener("click", e => {
    const img = e.target.closest(".slides img");
    if (!img) return;

    const imgs = img.closest(".slides").querySelectorAll("img");
    zoomImages = [...imgs].map(i => i.src);
    zoomIndex = [...imgs].indexOf(img);

    openZoom();
  });

  function openZoom() {
    zoomImage.src = zoomImages[zoomIndex];
    zoomCounter.textContent = `${zoomIndex + 1} / ${zoomImages.length}`;
    zoomOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
    resetZoom();
  }

  function resetZoom() {
    zoomed = false;
    zoomImage.style.transform = "scale(1)";
  }

  zoomImage.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      zoomed = !zoomed;
      zoomImage.style.transform = zoomed ? "scale(2)" : "scale(1)";
    }
    lastTap = now;
  });

  zoomOverlay.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  zoomOverlay.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;

    if (diff > 0 && zoomIndex < zoomImages.length - 1) zoomIndex++;
    if (diff < 0 && zoomIndex > 0) zoomIndex--;

    zoomImage.src = zoomImages[zoomIndex];
    zoomCounter.textContent = `${zoomIndex + 1} / ${zoomImages.length}`;
    resetZoom();
  });

  zoomClose.addEventListener("click", closeZoom);
  zoomOverlay.addEventListener("click", e => {
    if (e.target === zoomOverlay) closeZoom();
  });

  function closeZoom() {
    zoomOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }


  document.addEventListener("click", e => {
    const btn = e.target.closest(".view-details-btn");
    if (!btn) return;

    const card = btn.closest(".product-card");
    const details = card.querySelector(".product-details");
    const text = btn.querySelector(".vd-text");
    const arrow = btn.querySelector(".vd-arrow");

    document.querySelectorAll(".product-details.active").forEach(d => {
      if (d !== details) {
        d.classList.remove("active");
        const b = d.closest(".product-card").querySelector(".vd-text");
        const a = d.closest(".product-card").querySelector(".vd-arrow");
        b.textContent = "View Details";
        a.textContent = "▼";
      }
    });

    details.classList.toggle("active");
    const open = details.classList.contains("active");
    text.textContent = open ? "Hide Details" : "View Details";
    arrow.textContent = open ? "▲" : "▼";
  });


  document.addEventListener("click", e => {
    const btn = e.target.closest(".whatsapp-btn");
    if (!btn) return;

    const card = btn.closest(".product-card");
    const slider = card.querySelector(".slider");
    const slides = slider.querySelectorAll(".slides img");
    const index = parseInt(slider.querySelector(".image-counter").textContent) - 1;

    const msg = `Hello Daily Glam Store 👋

I want to order:
*${btn.dataset.product}*
Product Code: *${btn.dataset.code}*
Selected Image: *${index + 1}*
MRP: ${card.querySelector(".mrp-amount").textContent}
Final Price: *${card.querySelector(".final-price").textContent}*

${slides[index].src}`;

    window.open(`https://wa.me/919463638810?text=${encodeURIComponent(msg)}`, "_blank");
  });


  fetch("products.json")
    .then(r => r.json())
    .then(data => {
      renderProducts(data.deal, "deal-products");
      renderProducts(data.earrings, "earrings-products");
      renderProducts(data.handbags, "handbags-products");
      renderProducts(data.wallets, "wallets-products");
      setTimeout(initSliders, 100);
    });

});
