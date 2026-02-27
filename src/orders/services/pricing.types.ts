import { ProductCategory } from '../../inventory/enums/product-category.enum';

export interface PricingItem {
  productId: string;
  price: number;
  quantity: number;
  category: ProductCategory;
}

export interface PricingResult {
  total: number;
  originalTotal: number;
  regionalAdjustment: number;
  taxAmount: number;
  taxRate: number;
  discountApplied: string;
}
