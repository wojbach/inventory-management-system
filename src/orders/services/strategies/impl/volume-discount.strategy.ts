import { Injectable } from '@nestjs/common';
import { IDiscountStrategy, PricingContext, DiscountResult } from '../discount-strategy.interface';
import Big from 'big.js';

@Injectable()
export class VolumeDiscountStrategy implements IDiscountStrategy {
  calculate({ adjustedTotal, totalQuantity }: PricingContext): DiscountResult {
    const totalBig = new Big(adjustedTotal);
    if (totalQuantity >= 50)
      return {
        savings: Number(totalBig.times(0.3).round(2)),
        label: 'Volume 30%',
      };
    if (totalQuantity >= 10)
      return {
        savings: Number(totalBig.times(0.2).round(2)),
        label: 'Volume 20%',
      };
    if (totalQuantity >= 5)
      return {
        savings: Number(totalBig.times(0.1).round(2)),
        label: 'Volume 10%',
      };
    return { savings: 0, label: 'none' };
  }
}
