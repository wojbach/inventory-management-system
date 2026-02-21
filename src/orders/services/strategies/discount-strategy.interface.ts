import { ProductCategory } from '../../../inventory/enums/product-category.enum';

export interface PricingContext {
  items: { price: number; quantity: number; category: ProductCategory }[];
  adjustedTotal: number;
  totalQuantity: number;
  dateKey: string; // 'MM-DD' format
}

export interface DiscountResult {
  savings: number;
  label: string;
}

export interface IDiscountStrategy {
  calculate(ctx: PricingContext): DiscountResult;
}

export const DISCOUNT_STRATEGIES_TOKEN = Symbol('DiscountStrategies');
