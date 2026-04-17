(function () {
  const IMAGE_PATH_REFERENCE = {
    // Reference-only folder structure for future manual uploads.
    // Current images remain in their existing locations.
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
    },
    topPicks: "images/beauty/top-picks/",
    brands: "images/beauty/brands/"
  };

  const BEAUTY_PRODUCTS = {
    topPicks: [
      {
        id: "lotus-vitamin-c-day-creme",
        name: "Vitamin C Skin Brightening Day Crème",
        brand: "Lotus Botanicals",
        mrp: "₹685",
        image: "images/top-picks/lotus-vitamin-c-skin-brightening-day-creme.JPG",
        link: "https://www.lotusbotanicals.com/products/vitamin-c-skin-brightening-day-creme?ref=DGS-Deepak",
        note: "Discount auto-applied at checkout",
        details: [
          "Reduces dark spots & uneven skin tone",
          "Vitamin C + Niacinamide for visible glow",
          "Lightweight, non-greasy daily cream",
          "Hydrates and refreshes dull skin",
          "Ideal for daily morning routine",
          "Best for dull and tired-looking skin"
        ]
      }
    ],
    skincare: [
      {
        id: "plum-face-wash-recommendation",
        name: "Face Wash Recommendation",
        brand: "Plum",
        mrp: "Check on website",
        image: "images/top-picks/lotus-vitamin-c-skin-brightening-day-creme.JPG",
        link: "https://plumgoodness.com/",
        note: "Explore current offer on official website",
        details: [
          "Use a gentle cleanser for daily routine",
          "Pick based on skin type and concern",
          "Avoid over-cleansing to protect barrier"
        ]
      },
      {
        id: "dot-key-sunscreen-recommendation",
        name: "Sunscreen Recommendation",
        brand: "Dot & Key",
        mrp: "Check on website",
        image: "images/top-picks/lotus-vitamin-c-skin-brightening-day-creme.JPG",
        link: "https://www.dotandkey.com/",
        note: "Explore current offer on official website",
        details: [
          "Use broad spectrum sunscreen in daytime",
          "Reapply as needed during long exposure",
          "Choose texture comfortable for everyday use"
        ]
      }
    ],
    haircare: [
      {
        id: "mamaearth-shampoo-recommendation",
        name: "Shampoo Recommendation",
        brand: "Mamaearth",
        mrp: "Check on website",
        image: "images/top-picks/lotus-vitamin-c-skin-brightening-day-creme.JPG",
        link: "https://mamaearth.in/",
        note: "Explore current offer on official website",
        details: [
          "Choose shampoo by scalp type",
          "Cleanse properly to reduce product buildup",
          "Avoid very harsh formulas for frequent wash"
        ]
      },
      {
        id: "lotus-hair-serum-recommendation",
        name: "Hair Serum Recommendation",
        brand: "Lotus Botanicals",
        mrp: "Check on website",
        image: "images/top-picks/lotus-vitamin-c-skin-brightening-day-creme.JPG",
        link: "https://www.lotusbotanicals.com/",
        note: "Explore current offer on official website",
        details: [
          "Apply on lengths to manage frizz",
          "Use small quantity to avoid heaviness",
          "Pairs well with conditioner for smoother hair"
        ]
      }
    ],
    imagePathReference: IMAGE_PATH_REFERENCE
  };

  window.BEAUTY_PRODUCTS = BEAUTY_PRODUCTS;
})();
