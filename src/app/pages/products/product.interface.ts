export interface ProductImage {
  _id?: string;
  url: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  altText?: string;
  order?: number;
}

export type StockMovementType = 'in' | 'out';
export type StockMovementReason =
  | 'manual_in'
  | 'manual_out'
  | 'service_order'
  | 'service_order_reversal'
  | 'adjustment';

export interface StockMovement {
  _id?: string;
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  balanceAfter: number;
  referenceType?: 'manual' | 'service_order';
  referenceLabel?: string;
  notes?: string;
  createdBy?: { _id: string; name: string } | string;
  createdAt?: string;
}

export interface ProductModel {
  id?: string;
  name: string;
  sku: string;
  ncmCode?: string;
  brand?: string;
  model?: string;
  description?: string;
  price: number;
  stock: number;
  isActive?: boolean;
  isVirtual?: boolean;
  service?: boolean;
  trackStock?: boolean;
  downloadUrl?: string;
  mainImage?: ProductImage;
  images?: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}
