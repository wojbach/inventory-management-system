import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { DISCOUNT_STRATEGIES_TOKEN, IDiscountStrategy } from './strategies/discount-strategy.interface';
import { CustomerLocation } from '../enums/customer-location.enum';
import { ProductCategory } from '../../inventory/enums/product-category.enum';

describe('PricingService', () => {
  let service: PricingService;
  let mockStrategy1: jest.Mocked<IDiscountStrategy>;
  let mockStrategy2: jest.Mocked<IDiscountStrategy>;

  beforeEach(async () => {
    mockStrategy1 = { calculate: jest.fn() };
    mockStrategy2 = { calculate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: DISCOUNT_STRATEGIES_TOKEN,
          useValue: [mockStrategy1, mockStrategy2],
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  const item = (price: number, quantity: number, category = ProductCategory.GENERAL) => ({
    price,
    quantity,
    category,
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calculates total without any discounts', () => {
    mockStrategy1.calculate.mockReturnValue({ savings: 0, label: 'none' });
    mockStrategy2.calculate.mockReturnValue({ savings: 0, label: 'none' });

    const result = service.calculate([item(10, 2)], CustomerLocation.US, new Date('2026-02-21'));

    expect(result.total).toBe(20);
    expect(result.discountApplied).toBe('none');

    expect(mockStrategy1.calculate).toHaveBeenCalledWith(
      expect.objectContaining({
        adjustedTotal: 20,
        totalQuantity: 2,
        dateKey: '02-21',
      }),
    );
  });

  it('applies VAT (EUROPE: 15% tax)', () => {
    mockStrategy1.calculate.mockReturnValue({ savings: 0, label: 'none' });
    mockStrategy2.calculate.mockReturnValue({ savings: 0, label: 'none' });

    const result = service.calculate([item(100, 1)], CustomerLocation.EUROPE);
    // Base 100 * 1 = 100. Tax = 100 * 0.15 = 15. Total = 115.
    expect(result.total).toBe(115);
    expect(result.taxAmount).toBe(15);
    expect(result.taxRate).toBe(0.15);
    expect(result.regionalAdjustment).toBe(0);
  });

  it('applies location adjustment (ASIA: 0.95x)', () => {
    mockStrategy1.calculate.mockReturnValue({ savings: 0, label: 'none' });
    mockStrategy2.calculate.mockReturnValue({ savings: 0, label: 'none' });

    const result = service.calculate([item(100, 1)], CustomerLocation.ASIA);
    // 100 * 0.95 = 95
    expect(result.total).toBe(95);
  });

  it('picks the discount strategy with highest savings', () => {
    mockStrategy1.calculate.mockReturnValue({
      savings: 10,
      label: 'Discount A',
    });
    mockStrategy2.calculate.mockReturnValue({
      savings: 25,
      label: 'Discount B',
    });

    const result = service.calculate([item(100, 1)], CustomerLocation.US);

    // total = 100 - 25 = 75
    expect(result.total).toBe(75);
    expect(result.discountApplied).toBe('Discount B');
  });

  it('rounds safely using internal calculation (100.00 - 33.33 = 66.67)', () => {
    mockStrategy1.calculate.mockReturnValue({
      savings: 33.33,
      label: 'Discount C',
    });
    mockStrategy2.calculate.mockReturnValue({ savings: 0, label: 'none' });

    const result = service.calculate([item(100, 1)], CustomerLocation.US);

    expect(result.total).toBe(66.67);
  });

  it('handles empty items array without errors', () => {
    mockStrategy1.calculate.mockReturnValue({ savings: 0, label: 'none' });
    mockStrategy2.calculate.mockReturnValue({ savings: 0, label: 'none' });

    const result = service.calculate([], CustomerLocation.US);

    expect(result.total).toBe(0);
    expect(result.discountApplied).toBe('none');
    expect(result.originalTotal).toBe(0);
  });
});
