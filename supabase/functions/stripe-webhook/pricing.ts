/**
 * Canonical Pricing and Capabilities Map for Edge Functions
 */

export const PRODUCTS = {
  BASE_ACCESS: {
    priceId: "price_base_access",
    grants: ["account.access"]
  },
  FEATURE_AD: {
    priceId: "price_feature_ad",
    grants: ["ad.feature"]
  },
  PLAYLIST_PLACEMENT: {
    priceId: "price_playlist_place",
    grants: ["playlist.place"],
    price_cents: 30000
  },
  POST_SUBMIT: {
    priceId: "price_post_submit",
    grants: ["post.submit"]
  },
  INTERVIEW: {
    priceId: "price_interview",
    grants: ["ad.feature"],
    price_cents: 15000
  },
  MUSIC_MONDAY: {
    priceId: "price_music_monday",
    grants: ["playlist.place"],
    price_cents: 30000
  }
} as const;

export function getProductByPriceId(priceId: string) {
  return Object.values(PRODUCTS).find(p => p.priceId === priceId);
}
