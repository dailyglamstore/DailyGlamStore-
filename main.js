document.addEventListener("DOMContentLoaded", () => {

  function resolveAssetPath(path) {
    if (typeof path !== "string") return path;
    if (/^(?:https?:)?\/\//.test(path) || path.startsWith("/")) return path;
    if (path.startsWith("images/")) return path;
    return path;
  }

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
  `<img src="${resolveAssetPath(img)}" ${i === 0 ? "" : 'loading="lazy"'}>`
).join("")}
          </div>
          <div class="image-counter"></div>
${p.images.length > 1 ? '<div class="swipe-arrow">➜</div>' : ''}

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
      if (slider.dataset.sliderReady === "yes") return;

      const track = slider.querySelector(".slides");
      if (!track) return;
      const slides = [...track.querySelectorAll(".slide-item, img")];
      if (!slides.length) return;

      slider.dataset.sliderReady = "yes";
      const counter = slider.querySelector(".image-counter");
      const dots = [...slider.querySelectorAll(".slider-dot")];
      const swipeArrow = slider.querySelector(".swipe-arrow");

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

        slides.forEach(slide => slide.classList.remove("active-slide"));
        slides[index].classList.add("active-slide");

        if (dots.length) {
          dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
          });
        }

        if (counter) {
          counter.textContent = `${index + 1} / ${slides.length}`;
          counter.style.opacity = "1";
          clearTimeout(counter._t);
          counter._t = setTimeout(() => counter.style.opacity = "0", 1500);
        }
      }

      if (!(slides[0] instanceof HTMLImageElement) || slides[0].complete) {
        calcSize(); update();
      } else {
        slides[0].addEventListener("load", () => {
          calcSize(); update();
        }, { once: true });
      }

      slider.addEventListener("touchstart", e => {
        startX = e.touches[0].clientX;
        if (swipeArrow) swipeArrow.style.display = "none";
      }, { passive: true });

      slider.addEventListener("touchend", e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) < 22) return;
        if (diff > 0 && index < slides.length - 1) index++;
        if (diff < 0 && index > 0) index--;
        update();
      }, { passive: true });

      window.addEventListener("resize", () => {
        calcSize(); update();
      });

      if (swipeArrow && slides.length > 1) {
        swipeArrow.addEventListener("click", () => {
          index = index >= slides.length - 1 ? 0 : index + 1;
          update();
        });
      }

      if (dots.length) {
        dots.forEach((dot, dotIndex) => {
          dot.addEventListener("click", () => {
            index = dotIndex;
            update();
          });
        });
      }
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

View Your Selected Image 👇
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

document.getElementById("days").textContent = d;
document.getElementById("hours").textContent = h;
document.getElementById("minutes").textContent = m;
document.getElementById("seconds").textContent = s;

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

  function normalizeApprovalValue(value) {
    return String(value || "").trim().toLowerCase() === "yes";
  }

  function normalizeRatingValue(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return 0;
    if (parsed < 1) return 1;
    if (parsed > 5) return 5;
    return Math.round(parsed);
  }

  function parseTestimonialTimestamp(value) {
    const raw = String(value || "").trim();
    if (!raw) return null;

    const directParse = new Date(raw);
    if (!Number.isNaN(directParse.getTime())) return directParse;

    const normalized = raw.replace(/(\d+)\/(\d+)\/(\d{2,4})/, (_, month, day, year) => {
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    });
    const fallbackParse = new Date(normalized);
    if (!Number.isNaN(fallbackParse.getTime())) return fallbackParse;

    return null;
  }

  function formatTestimonialDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const parsedDate = parseTestimonialTimestamp(raw);
    if (!parsedDate) return raw;

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(parsedDate);
  }

  function renderTestimonials(testimonials) {
    const container = document.getElementById("testimonials-list");
    if (!container) return;

    if (!testimonials.length) {
      container.innerHTML = "";
      return;
    }

    const slidesMarkup = testimonials.map((item) => {
      const name = item.name || "Verified Customer";
      const city = item.city ? `<div class="testimonial-city">${item.city}</div>` : "";
      const product = item.product ? `<div class="testimonial-product">Product: ${item.product}</div>` : "";
      const rating = normalizeRatingValue(item.rating);
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      const review = item.review || "";
      const reviewDate = formatTestimonialDate(item.timestamp);
      const dateMarkup = reviewDate ? `<div class="testimonial-date">${reviewDate}</div>` : "";

      return `
        <div class="testimonial-slide slide-item">
          <div class="testimonial-card">
            <div class="testimonial-top">
              <div>
                <div class="testimonial-name">${name}</div>
                ${city}
              </div>
            <div class="testimonial-stars" aria-label="${rating} star rating">${stars}</div>
          </div>
          ${product}
          <p class="testimonial-review">${review}</p>
          ${dateMarkup}
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="slides testimonial-slides">
        ${slidesMarkup}
      </div>
      ${testimonials.length > 1 ? `
        <div class="slider-dots" aria-label="Testimonial slider indicators">
          ${testimonials.map((_, i) => `<button type="button" class="slider-dot${i === 0 ? " active" : ""}" aria-label="Go to testimonial ${i + 1}"></button>`).join("")}
        </div>
      ` : ""}
    `;

    initControlledSliders();
  }

  function parseCSV(csvText) {
    if (!csvText) return [];

    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === "\"") {
        if (inQuotes && nextChar === "\"") {
          cell += "\"";
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        row.push(cell);
        cell = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") i++;
        row.push(cell);
        if (row.some(value => value.trim() !== "")) rows.push(row);
        row = [];
        cell = "";
        continue;
      }

      cell += char;
    }

    if (cell !== "" || row.length) {
      row.push(cell);
      if (row.some(value => value.trim() !== "")) rows.push(row);
    }

    return rows;
  }

  function parseTestimonialsCsvToJson(csvText) {
    const expectedHeaders = [
      "Timestamp",
      "Name",
      "Product Purchased",
      "Rating",
      "Review",
      "City",
      "approved"
    ];

    const csvRows = parseCSV(csvText);
    if (!csvRows.length) return [];

    const headerRow = csvRows[0].map((header) => String(header || "").trim());
    const headerIndexMap = expectedHeaders.reduce((acc, header) => {
      const index = headerRow.indexOf(header);
      if (index === -1) throw new Error(`Missing required CSV header: ${header}`);
      acc[header] = index;
      return acc;
    }, {});

    return csvRows.slice(1).map((columns) => ({
      timestamp: String(columns[headerIndexMap["Timestamp"]] || "").trim(),
      name: String(columns[headerIndexMap["Name"]] || "").trim(),
      product: String(columns[headerIndexMap["Product Purchased"]] || "").trim(),
      rating: String(columns[headerIndexMap["Rating"]] || "").trim(),
      review: String(columns[headerIndexMap["Review"]] || "").trim(),
      city: String(columns[headerIndexMap["City"]] || "").trim(),
      approved: String(columns[headerIndexMap["approved"]] || "").trim()
    }));
  }

  async function fetchTestimonialsFromCsv(sourceUrl) {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error("Failed to load testimonials CSV");
    const csvText = await res.text();
    return parseTestimonialsCsvToJson(csvText);
  }

  async function fetchTestimonialsFromJson(sourceUrl) {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error("Failed to load testimonials JSON");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function loadTestimonials() {
    const localFallback = "data/testimonials.json";
    const csvEndpoint = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQKCr35cDOhCG0FTf-l5W8AhjjaPU5cvKdXwOVD2s840rtkANRHRYw-OZOFEpJOl01TUizdc9WglJyS/pub?output=csv";

    let testimonialRows = [];

    try {
      testimonialRows = await fetchTestimonialsFromCsv(csvEndpoint);
    } catch (err) {
      console.error("Primary testimonials fetch failed:", err);

      try {
        testimonialRows = await fetchTestimonialsFromJson(localFallback);
      } catch (fallbackErr) {
        console.error("Fallback testimonials fetch failed:", fallbackErr);
        testimonialRows = [];
      }
    }

    const approvedTestimonials = testimonialRows
      .filter(row => normalizeApprovalValue(row.approved))
      .sort((a, b) => {
        const timeA = parseTestimonialTimestamp(a.timestamp)?.getTime() || 0;
        const timeB = parseTestimonialTimestamp(b.timestamp)?.getTime() || 0;
        return timeB - timeA;
      });

    renderTestimonials(approvedTestimonials);
  }

function alignTestimonialsHashScroll() {
  if (window.location.hash !== "#testimonials") return;

  const target = document.getElementById("testimonials");
  if (!target) return;

  const header = document.querySelector(".site-header");
  const headerOffset = header ? header.getBoundingClientRect().height : 0;
  const extraGap = 12;
  const targetTop = window.pageYOffset + target.getBoundingClientRect().top - headerOffset - extraGap;

  window.scrollTo(0, Math.max(targetTop, 0));
}

function scheduleTestimonialsHashAlignment() {
  if (window.location.hash !== "#testimonials") return;

  [0, 120, 360, 900].forEach(delay => {
    setTimeout(() => {
      requestAnimationFrame(alignTestimonialsHashScroll);
    }, delay);
  });
}

const homepageLoadTasks = [
  loadCategory("deals", "deal-products"),
  loadCategory("earrings", "earrings-products"),
  loadCategory("handbags", "handbags-products"),
  loadCategory("wallets", "wallets-products"),
  loadTestimonials()
];

Promise.allSettled(homepageLoadTasks).then(() => {
  scheduleTestimonialsHashAlignment();
});

window.addEventListener("hashchange", scheduleTestimonialsHashAlignment);
window.addEventListener("load", scheduleTestimonialsHashAlignment);
scheduleTestimonialsHashAlignment();


const backBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
if (window.scrollY > 500) {
backBtn.style.display = "block";
} else {
backBtn.style.display = "none";
}
});

backBtn.addEventListener("click", () => {
window.scrollTo({
top:0,
behavior:"smooth"
});
});

});
