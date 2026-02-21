import { Injectable } from '@nestjs/common';
import { IDiscountStrategy, PricingContext, DiscountResult } from '../discount-strategy.interface';
import Big from 'big.js';

// Note: In a real system, Black Friday is dynamically calculated as the 4th Friday of November
const BLACK_FRIDAY = '11-29';

@Injectable()
export class BlackFridayDiscountStrategy implements IDiscountStrategy {
  calculate({ adjustedTotal, dateKey }: PricingContext): DiscountResult {
    if (dateKey === BLACK_FRIDAY) {
      const savings = new Big(adjustedTotal).times(0.25).round(2);
      return { savings: Number(savings), label: 'Black Friday' };
    }
    return { savings: 0, label: 'none' };
  }
}
