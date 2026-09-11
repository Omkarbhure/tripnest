/**
 * High-definition, verified curated destination images and fallback resolution.
 */
export const DESTINATION_FALLBACK_IMAGES: Record<string, string> = {
  bali: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
  "new york city": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
  "machu picchu": "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80",
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
  manali: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
  jaipur: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
  "kerala backwaters": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
  varanasi: "https://images.unsplash.com/photo-1561361066-419b48c3b4c1?auto=format&fit=crop&w=1200&q=80",
  agra: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
  darjeeling: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
  udaipur: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80",
  "andaman islands": "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80",
  "leh ladakh": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80",
};

export const DEFAULT_DESTINATION_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";

export function getDestinationImageUrl(name?: string, rawUrl?: string | null): string {
  if (rawUrl && rawUrl.trim() && !rawUrl.includes("via.placeholder.com")) {
    // If the name is Bali and the rawUrl is broken/low quality, override with vibrant Bali photo
    if (name && name.toLowerCase().includes("bali") && rawUrl.includes("photo-1537996194471")) {
      return DESTINATION_FALLBACK_IMAGES["bali"];
    }
    return rawUrl.trim();
  }

  if (name) {
    const key = name.trim().toLowerCase();
    if (DESTINATION_FALLBACK_IMAGES[key]) {
      return DESTINATION_FALLBACK_IMAGES[key];
    }
    // Partial search in keys
    for (const [k, url] of Object.entries(DESTINATION_FALLBACK_IMAGES)) {
      if (key.includes(k) || k.includes(key)) {
        return url;
      }
    }
  }

  return DEFAULT_DESTINATION_IMAGE;
}
