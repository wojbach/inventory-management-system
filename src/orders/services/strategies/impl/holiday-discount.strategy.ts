import { Injectable } from '@nestjs/common';
import { ProductCategory } from '../../../../inventory/enums/product-category.enum';
import { IDiscountStrategy, PricingContext, DiscountResult } from '../discount-strategy.interface';
import Big from 'big.js';

const POLISH_HOLIDAYS = [
  '01-01', // New Year's Day
  '01-06', // Epiphany
  '05-01', // Labour Day
  '05-03', // Constitution Day
  '08-15', // Assumption of Mary
  '11-01', // All Saints' Day
  '11-11', // Independence Day
  '12-25', // Christmas Day
  '12-26', // Second Day of Christmas
];

// Holiday discount applies only to selected categories (Electronics & Toys per spec)
const HOLIDAY_CATEGORIES: ProductCategory[] = [ProductCategory.ELECTRONICS, ProductCategory.TOYS];

@Injectable()
export class HolidayDiscountStrategy implements IDiscountStrategy {
  calculate({ items, adjustedTotal, dateKey }: PricingContext): DiscountResult {
    if (!POLISH_HOLIDAYS.includes(dateKey)) {
      return { savings: 0, label: 'none' };
    }

    const baseTotal = items.reduce((sum, i) => sum.plus(new Big(i.price).times(i.quantity)), new Big(0));

    const holidayItemsTotal = items
      .filter((i) => HOLIDAY_CATEGORIES.includes(i.category))
      .reduce((sum, i) => sum.plus(new Big(i.price).times(i.quantity)), new Big(0));

    if (holidayItemsTotal.eq(0)) {
      return { savings: 0, label: 'none' };
    }

    const adjustmentMultiplier = new Big(adjustedTotal).div(baseTotal);
    const adjustedHolidayTotal = holidayItemsTotal.times(adjustmentMultiplier);

    const savings = adjustedHolidayTotal.times(0.15).round(2);
    return { savings: Number(savings), label: 'Holiday Sale' };
  }
}
