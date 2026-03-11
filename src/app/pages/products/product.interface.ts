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
  description?: string;
  price: number;
  stock: number;
  isActive?: boolean;
  isVirtual?: boolean;
  trackStock?: boolean;
  downloadUrl?: string;
  mainImage?: ProductImage;
  images?: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}
