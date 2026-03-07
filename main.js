document.addEventListener("DOMContentLoaded", () => {

  const menu = document.getElementById("menuDropdown");
  const menuBtn = document.querySelector(".menu-btn");
  const categorySubMenu = document.getElementById("categorySubMenu");
  const legalSubMenu = document.getElementById("legalSubMenu");

window.toggleLegalMenu = (e) => {
e.stopPropagation();
legalSubMenu.classList.toggle("open");
e.currentTarget.classList.toggle("open");
};

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
if (legalSubMenu) legalSubMenu.classList.remove("open");
});
});

  document.addEventListener("click", e => {
    if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
      menu.style.display = "none";
    }
  });

  window.addEventListener("scroll", () => {
    menu.style.display = "none";

    const activeDetails = document.querySelector(".product-details.active");
    if (!activeDetails) return;

    const card = activeDetails.closest(".product-card");
    const rect = card.getBoundingClientRect();

    if (rect.bottom < 80 || rect.top > window.innerHeight - 80) {
      activeDetails.classList.remove("active");
      const btn = card.querySelector(".view-details-btn");
      btn.querySelector(".vd-text").textContent = "View Details";
      btn.querySelector(".vd-arrow").textContent = "▼";
    }
  });

  function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !products.length) return;

    container.innerHTML = products.map(p => `
      <div class="product-card">
        <div class="slider">
          <div class="slides">
            ${p.images.map((img, i) => 
  `<img src="${img}" ${i === 0 ? "" : 'loading="lazy"'}>`
).join("")}
          </div>
          <div class="image-counter"></div>
${p.images.length > 1 ? '<div class="swipe-arrow">→</div>' : ''}

</div>

        <h3>${p.name}</h3>
<div class="product-code">Product Code: ${p.code}</div>

<div class="price-box">
  <span class="mrp-label">MRP:</span>
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

  function initControlledSliders() {
    document.querySelectorAll(".slider").forEach(slider => {

      const track = slider.querySelector(".slides");
      const slides = [...track.querySelectorAll("img")];
      const counter = slider.querySelector(".image-counter");

      let index = 0;
      let startX = 0;
      let slideSize = 0;
      const gap = parseInt(getComputedStyle(track).gap) || 0;

      function calcSize() {
        slideSize = slides[0].getBoundingClientRect().width + gap;
      }

      function update() {
        if (!slideSize) return;
        track.style.transform = `translateX(-${index * slideSize}px)`;

slides.forEach(img => img.classList.remove("active-slide"));
slides[index].classList.add("active-slide");

        counter.textContent = `${index + 1} / ${slides.length}`;
        counter.style.opacity = "1";
        clearTimeout(counter._t);
        counter._t = setTimeout(() => counter.style.opacity = "0", 1500);
      }

      if (slides[0].complete) {
        calcSize(); update();
      } else {
        slides[0].addEventListener("load", () => {
          calcSize(); update();
        }, { once: true });
      }

      track.addEventListener("touchstart", e => {
startX = e.touches[0].clientX;

const arrow = slider.querySelector(".swipe-arrow");
if (arrow) arrow.style.display = "none";

}, { passive: true });

      track.addEventListener("touchend", e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) < 22) return;
        if (diff > 0 && index < slides.length - 1) index++;
        if (diff < 0 && index > 0) index--;
        update();
      }, { passive: true });

      window.addEventListener("resize", () => {
        calcSize(); update();
      });
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
        const c = d.closest(".product-card");
        c.querySelector(".vd-text").textContent = "View Details";
        c.querySelector(".vd-arrow").textContent = "▼";
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
    const counterText = slider.querySelector(".image-counter").textContent;
    const index = parseInt(counterText) - 1;
    const slides = slider.querySelectorAll(".slides img");

    const msg = `Hello Daily Glam Store 👋

I want to order:
*${btn.dataset.product}*
Product Code: *${btn.dataset.code}*
Selected Image: *${index + 1}*
MRP: ${card.querySelector(".mrp-amount").textContent}
Final Price: *${card.querySelector(".final-price").textContent}*

Image Preview 👇
${slides[index].src}

Please share availability & payment details.`;

 window.open(`https://wa.me/919463638810?text=${encodeURIComponent(msg)}`, "_blank");
  });

const glamDealBox = document.getElementById("glamDeal");
const timerEl = document.getElementById("dealTimer");

const DEAL_START = new Date(window.DEAL_CONFIG.start).getTime();
const DEAL_END   = new Date(window.DEAL_CONFIG.end).getTime();

if (glamDealBox && timerEl) {
  const dealInterval = setInterval(() => {
    const now = Date.now();

    if (now < DEAL_START) {
      glamDealBox.style.display = "none";
      return;
    }

    if (now >= DEAL_END) {
      glamDealBox.style.display = "none";
      clearInterval(dealInterval);
      return;
    }

    glamDealBox.style.display = "block";

    const diff = DEAL_END - now;

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    timerEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
  }, 1000);
}

  async function loadCategory(category, containerId) {
  try {
    const res = await fetch(`data/${category}.json`);
    const products = await res.json();
    renderProducts(products, containerId);
    initControlledSliders();
  } catch (err) {
    console.error(`Error loading ${category}`, err);
  }
}

loadCategory("deals", "deal-products");
loadCategory("earrings", "earrings-products");
loadCategory("handbags", "handbags-products");
loadCategory("wallets", "wallets-products");

});

