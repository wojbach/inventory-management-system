import { BlackFridayDiscountStrategy } from './black-friday-discount.strategy';

describe('BlackFridayDiscountStrategy', () => {
  let strategy: BlackFridayDiscountStrategy;

  beforeEach(() => {
    strategy = new BlackFridayDiscountStrategy();
  });

  it('returns 25% savings on Black Friday (11-29)', () => {
    const result = strategy.calculate({
      items: [],
      adjustedTotal: 100,
      totalQuantity: 1,
      dateKey: '11-29',
    });

    expect(result.label).toBe('Black Friday');
    expect(result.savings).toBe(25);
  });

  it('returns no savings on other dates', () => {
    const result = strategy.calculate({
      items: [],
      adjustedTotal: 100,
      totalQuantity: 1,
      dateKey: '11-28',
    });

    expect(result.label).toBe('none');
    expect(result.savings).toBe(0);
  });
});
