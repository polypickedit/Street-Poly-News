export interface Outlet {
  id: string;
  name: string;
  price_cents: number;
  outlet_type: string;
  accepted_content_types?: string[];
  active?: boolean;
}

export interface Slot {
  id: string;
  name: string;
  slug: string;
  price: number;
  type: "music" | "interview";
  is_active?: boolean;
}
