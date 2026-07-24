window.CURRENT_ARTICLE = {
  key: "lorem-ipsum",

  url: "/articles/skincare/lorem-ipsum.html",

  category: "Skincare",

  badge: "Testing",

  date: "2026-07-24T18:30:00+05:30",

  dateModified: "2026-07-24T22:30:00+05:30",

  author: [
    {
      enabled: true,
      type: "Organization",
      name: "Daily Glam Store",
      url: "https://dailyglamstore.in/"
    }
  ],

  title: "Lorem Ipsum Skincare Test Article for Nested Subfolders",

  seoTitle: "Lorem Ipsum Skincare Test Article | Daily Glam Store",

  intro:
    "This is a test introduction for the lorem-ipsum article. It verifies that your dynamic JS renderer and CSS styles correctly load and display content when hosted inside nested directories like /articles/skincare/.",

  seoDescription:
    "A lorem ipsum test article created to verify nested subfolder rendering, styles, and script paths on Daily Glam Store.",

  linkPlan: [
    {
      anchorText: "return to home page",
      href: "/",
      newTab: false
    }
  ],

  metaLine:
    "Test Article Guide • Nested Folder Architecture • Subfolder Test",

  image: {
    src: "/images/logo.png",
    alt: "Lorem ipsum test article image"
  },

  sections: [
    {
      heading: "Section 1: Testing Nested Subfolder Rendering",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
            "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
          ]
        }
      ]
    },
    {
      heading: "Section 2: Testing Lists and UI Components",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Below is a bullet list test to confirm that all custom article styling and block types work seamlessly in subfolders."
          ]
        },
        {
          type: "bullets",
          items: [
            "Test Item 1: Verifying bullet list rendering.",
            "Test Item 2: Checking font sizes and line heights.",
            "Test Item 3: Ensuring spacing and responsiveness work on mobile.",
            "Test Item 4: Checking nested path execution."
          ]
        },
        {
          type: "infoBox",
          boxType: "expert",
          title: "Test Notice Box",
          text: "If you can read this styled box inside your test page, your template configuration, CSS paths, and JS data structure are working 100% correctly!"
        }
      ]
    },
    {
      heading: "Section 3: Final Verification",
      blocks: [
        {
          type: "paragraph",
          text: [
            "Once this test page loads with full styling, header, footer, and article content, you can safely delete it or use it as a layout template for future articles!"
          ]
        }
      ]
    }
  ],

  productRecommendations: {
    title: "Test Product Recommendations",
    items: [
      {
        title: "Test Face Wash Link",
        href: "/",
        type: "affiliateProduct",
        affiliate: false,
        newTab: false
      }
    ]
  },

  alternativeProducts: {
    title: "Test Alternative Products",
    items: [
      {
        title: "Test Moisturiser Link",
        href: "/",
        type: "affiliateProduct",
        affiliate: false,
        newTab: false
      }
    ]
  },

  relatedArticles: [
    {
      title: "Daily Skincare Routine for Beginners: Simple Morning & Night Steps",
      href: "/skincare-routine.html"
    }
  ],

  faq: [
    {
      question: "Is this lorem-ipsum test article working?",
      answer: "Yes! If you are seeing this answer rendered under the FAQ section, your JS renderer processed the object cleanly."
    }
  ],

  ctaTitle: "Nested Subfolder Test Complete!",

  ctaText: "You are ready to create and organize all your upcoming articles into clean category subfolders.",

  ctaButtons: [
    {
      text: "Back to Home",
      href: "/",
      newTab: false
    }
  ]
};
