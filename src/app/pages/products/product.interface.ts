export interface ProductImage {
  _id?: string;
  url: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  altText?: string;
  order?: number;
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
