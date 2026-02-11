/**
 * Canonical Pricing and Capabilities Map
 * 
 * This is the single source of truth for mapping Stripe Price IDs
 * to user capabilities granted upon successful payment.
 */

export const PRODUCTS = {
  // Base account access (e.g. standard membership)
  BASE_ACCESS: {
    priceId: "price_base_access",
    grants: ["account.access"]
  },

  // One-time ad featuring capability
  FEATURE_AD: {
    priceId: "price_feature_ad",
    grants: ["ad.feature"]
  },

  // One-time playlist placement capability
  PLAYLIST_PLACEMENT: {
    priceId: "price_playlist_place",
    grants: ["playlist.place"]
  },

  // Standard submission capability
  POST_SUBMIT: {
    priceId: "price_post_submit",
    grants: ["post.submit"]
  },

  // INTERVIEW capability (added to map slot slug)
  INTERVIEW: {
    priceId: "price_interview",
    grants: ["ad.feature"],
    price_cents: 15000
  },

  // NEW MUSIC MONDAYS capability
  MUSIC_MONDAY: {
    priceId: "price_music_monday",
    grants: ["playlist.place"],
    price_cents: 30000
  }
} as const;

export type ProductKey = keyof typeof PRODUCTS;
export type Capability = typeof PRODUCTS[ProductKey]["grants"][number];

/**
 * Helper to find a product by its Stripe Price ID
 */
export function getProductByPriceId(priceId: string) {
  return Object.values(PRODUCTS).find(p => p.priceId === priceId);
}

/**
 * Helper to find a product by its Slot Slug
 */
export function getProductBySlotSlug(slug: string) {
  if (slug === 'featured-interview' || slug === 'interview') return PRODUCTS.INTERVIEW;
  if (slug === 'new-music-mondays' || slug === 'new-music-monday') return PRODUCTS.MUSIC_MONDAY;
  return PRODUCTS.POST_SUBMIT;
}
