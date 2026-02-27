import { VolumeDiscountStrategy } from './volume-discount.strategy';

describe('VolumeDiscountStrategy', () => {
  let strategy: VolumeDiscountStrategy;

  beforeEach(() => {
    strategy = new VolumeDiscountStrategy();
  });

  it('returns 30% savings for 50 or more items', () => {
    const result = strategy.calculate({
      items: [],
      adjustedTotal: 100,
      totalQuantity: 50,
      dateKey: '01-01',
    });
    expect(result.label).toBe('Volume 30%');
    expect(result.savings).toBe(30);
  });

  it('returns 20% savings for 10 or more items', () => {
    const result = strategy.calculate({
      items: [],
      adjustedTotal: 100,
      totalQuantity: 15,
      dateKey: '01-01',
    });
    expect(result.label).toBe('Volume 20%');
    expect(result.savings).toBe(20);
  });

  it('returns 10% savings for 5 or more items', () => {
    const result = strategy.calculate({
      items: [],
      adjustedTotal: 100,
      totalQuantity: 5,
      dateKey: '01-01',
    });
    expect(result.label).toBe('Volume 10%');
    expect(result.savings).toBe(10);
  });

  it('returns no savings for less than 5 items', () => {
    const result = strategy.calculate({
      items: [],
      adjustedTotal: 100,
      totalQuantity: 4,
      dateKey: '01-01',
    });
    expect(result.label).toBe('none');
    expect(result.savings).toBe(0);
  });
});
