import { Inject, Injectable } from '@nestjs/common';
import { CustomerLocation } from '../enums/customer-location.enum';
import { ProductCategory } from '../../inventory/enums/product-category.enum';
import { IDiscountStrategy, DISCOUNT_STRATEGIES_TOKEN, PricingContext } from './strategies/discount-strategy.interface';
import { PricingResult } from './pricing.types';
import Big from 'big.js';

@Injectable()
export class PricingService {
  constructor(
    @Inject(DISCOUNT_STRATEGIES_TOKEN)
    private readonly strategies: IDiscountStrategy[],
  ) {}

  calculate(
    items: { price: number; quantity: number; category: ProductCategory }[],
    location: CustomerLocation,
    date: Date = new Date(),
  ): PricingResult {
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const baseTotal = items.reduce((sum, i) => sum.plus(new Big(i.price).times(i.quantity)), new Big(0));

    const { adjustedTotal, regionalAdjustment } = this.applyLocationAdjustment(baseTotal, location);

    const dateKey = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const ctx: PricingContext = {
      items,
      adjustedTotal: Number(adjustedTotal),
      totalQuantity,
      dateKey,
    };

    const best = this.strategies
      .map((strategy) => strategy.calculate(ctx))
      .reduce((best, current) => (current.savings > best.savings ? current : best), { savings: 0, label: 'none' });

    const finalBeforeTax = adjustedTotal.minus(best.savings);
    const { taxAmount, taxRate } = this.calculateVat(finalBeforeTax, location);
    const finalTotal = finalBeforeTax.plus(taxAmount);

    return {
      total: this.formatPrice(finalTotal),
      originalTotal: this.formatPrice(baseTotal),
      regionalAdjustment: this.formatPrice(regionalAdjustment),
      taxAmount: this.formatPrice(taxAmount),
      taxRate,
      discountApplied: best.label,
    };
  }

  private applyLocationAdjustment(baseTotal: Big, location: CustomerLocation): { adjustedTotal: Big; regionalAdjustment: Big } {
    const locationMultiplier = {
      [CustomerLocation.US]: 1,
      [CustomerLocation.EUROPE]: 1, // VAT is handled separately by taxAmount
      [CustomerLocation.ASIA]: 0.95,
    }[location];

    const adjustedTotal = baseTotal.times(locationMultiplier);
    const regionalAdjustment = adjustedTotal.minus(baseTotal);

    return {
      adjustedTotal,
      regionalAdjustment,
    };
  }

  private calculateVat(amount: Big, location: CustomerLocation): { taxAmount: Big; taxRate: number } {
    const taxRate = location === CustomerLocation.EUROPE ? 0.15 : 0;
    return { taxAmount: amount.times(taxRate), taxRate };
  }

  private formatPrice(amount: Big | number): number {
    return Number(new Big(amount).toFixed(2));
  }
}
