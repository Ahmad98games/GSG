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