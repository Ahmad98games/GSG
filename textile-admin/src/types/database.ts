// 🛡️ BEYOND AI: Centralized Industry Type System

export type ItemCategory = 'Fabric' | 'Embroidery' | 'Dyeing';

// Ye wo interface hai jo Database se wapis aata hai (with ID)
export interface Product {
  id: string;
  created_at: string;
  item_name: string;
  item_category: ItemCategory;
  total_gaz: number;
  unit_cost: number;
  is_dyeing_required: boolean;
  qr_code: string;
  subtotal: number;
  grand_total: number;
  // Set-wise Phase 10 extensions
  article_id?: string;
  stock_in_sets?: number;
  derived_units?: number;
  vault_entry_date?: string;
}

// Ye wo interface hai jo hum naya batch banate waqt bhejte hain
export interface NewProductDto {
  item_name: string;
  item_category: ItemCategory;
  total_gaz: number;
  unit_cost: number;
  is_dyeing_required: boolean;
  qr_code: string;
  subtotal: number;
  grand_total: number;
}

// 🛡️ THE GATEKEEPER: Device Management Types
export type DeviceStatus = 'active' | 'revoked';
export type DeviceType = 'pc' | 'mobile';

export interface AuthorizedDevice {
  id: string;
  device_uuid: string;
  device_name: string;
  device_type: DeviceType;
  status: DeviceStatus;
  added_by: string | null;
  authorized_at: string;
  last_active: string | null;
}

export interface DeviceStats {
  active_count: number;
  remaining_slots: number;
}

// 🛡️ THE ARTICLE SOVEREIGN: Wholesale Identity & Inventory
export type SetProtocol = 4 | 5 | 6 | 8;

export interface ArticleMaster {
  id: string;
  article_id: string; // GS-ART-XXXX
  article_name: string;
  canonical_name: string;
  primary_image_url: string | null;
  set_protocol: SetProtocol;
  wholesale_set_price: number;
  total_sets_in_vault: number;
  total_units_available: number;
  is_active: boolean;
  desi_colors: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewArticleDto {
  article_id: string;
  article_name: string;
  canonical_name: string;
  primary_image_url: string | null;
  set_protocol: SetProtocol;
  wholesale_set_price: number;
  total_sets_in_vault: number;
  desi_colors: string | null;
}
