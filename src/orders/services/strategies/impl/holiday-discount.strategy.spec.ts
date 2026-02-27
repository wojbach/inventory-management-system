import { HolidayDiscountStrategy } from './holiday-discount.strategy';
import { ProductCategory } from '../../../../inventory/enums/product-category.enum';

describe('HolidayDiscountStrategy', () => {
  let strategy: HolidayDiscountStrategy;

  beforeEach(() => {
    strategy = new HolidayDiscountStrategy();
  });

  it('returns no savings if date is not a holiday', () => {
    const result = strategy.calculate({
      items: [{ price: 100, quantity: 1, category: ProductCategory.ELECTRONICS }],
      adjustedTotal: 100,
      totalQuantity: 1,
      dateKey: '05-02',
    });
    expect(result.label).toBe('none');
    expect(result.savings).toBe(0);
  });

  it('returns no savings if holiday applies but no qualifying categories are bought', () => {
    const result = strategy.calculate({
      items: [{ price: 100, quantity: 1, category: ProductCategory.GENERAL }],
      adjustedTotal: 100,
      totalQuantity: 1,
      dateKey: '12-25', // Christmas
    });
    expect(result.label).toBe('none');
    expect(result.savings).toBe(0);
  });

  it('returns 15% savings based only on qualifying categories (Toys & Electronics)', () => {
    // 100 * 2 = 200 electronics
    // 50 * 1 = 50 toys
    // 200 * 1 = 200 general
    const result = strategy.calculate({
      items: [
        { price: 100, quantity: 2, category: ProductCategory.ELECTRONICS },
        { price: 50, quantity: 1, category: ProductCategory.TOYS },
        { price: 200, quantity: 1, category: ProductCategory.GENERAL },
      ],
      adjustedTotal: 450,
      totalQuantity: 4,
      dateKey: '12-25', // Christmas
    });
    // total qualifying = 250
    // 15% of 250 = 37.5
    expect(result.label).toBe('Holiday Sale');
    expect(result.savings).toBe(37.5);
  });

  it('calculates savings relative to location adjustedTotal (e.g. ASIA 0.95x)', () => {
    const result = strategy.calculate({
      items: [
        { price: 100, quantity: 2, category: ProductCategory.ELECTRONICS }, // 200 base
      ],
      adjustedTotal: 190, // 0.95x modifier
      totalQuantity: 2,
      dateKey: '01-06', // Epiphany
    });
    // total base qualifying = 200
    // adjusted = 190
    // 15% of 190 = 28.5
    expect(result.label).toBe('Holiday Sale');
    expect(result.savings).toBe(28.5);
  });
});
