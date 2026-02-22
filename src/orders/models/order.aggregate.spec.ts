import { Order } from './order.aggregate';

describe('Order Aggregate', () => {
  const defaultId = 'order-123';
  const defaultCustomerId = 'customer-456';
  const defaultItems = [{ productId: 'prod-789', quantity: 2, price: 50 }];
  const defaultTotal = 100;
  const defaultOriginalTotal = 100;
  const defaultRegionalAdjustment = 0;
  const defaultTaxAmount = 0;
  const defaultTaxRate = 0;
  const defaultDiscountApplied = 'None';

  describe('create (Static Factory)', () => {
    it('should create a valid order and apply the OrderCreatedEvent', () => {
      const order = Order.create(
        defaultId,
        defaultCustomerId,
        defaultItems,
        defaultTotal,
        defaultOriginalTotal,
        defaultRegionalAdjustment,
        defaultTaxAmount,
        defaultTaxRate,
        defaultDiscountApplied,
      );

      // Verify fields
      expect(order.id).toBe(defaultId);
      expect(order.customerId).toBe(defaultCustomerId);
      expect(order.items).toEqual(defaultItems);
      expect(order.total).toBe(defaultTotal);
      expect(order.originalTotal).toBe(defaultOriginalTotal);

      // Verify events are pushed
      const uncommittedEvents = order.getUncommittedEvents();
      expect(uncommittedEvents.length).toBe(1);
      expect(uncommittedEvents[0].constructor.name).toBe('OrderCreatedEvent');
    });

    it('should throw Error if total is negative', () => {
      expect(() => {
        Order.create(
          defaultId,
          defaultCustomerId,
          defaultItems,
          -10, // Invalid total
          defaultOriginalTotal,
          defaultRegionalAdjustment,
          defaultTaxAmount,
          defaultTaxRate,
          defaultDiscountApplied,
        );
      }).toThrow('Order total cannot be negative');
    });

    it('should throw Error if originalTotal is negative', () => {
      expect(() => {
        Order.create(
          defaultId,
          defaultCustomerId,
          defaultItems,
          defaultTotal,
          -20, // Invalid original total
          defaultRegionalAdjustment,
          defaultTaxAmount,
          defaultTaxRate,
          defaultDiscountApplied,
        );
      }).toThrow('Order original total cannot be negative');
    });

    it('should throw Error if items array is empty', () => {
      expect(() => {
        Order.create(
          defaultId,
          defaultCustomerId,
          [], // Invalid items array
          defaultTotal,
          defaultOriginalTotal,
          defaultRegionalAdjustment,
          defaultTaxAmount,
          defaultTaxRate,
          defaultDiscountApplied,
        );
      }).toThrow('Order must contain at least one item');
    });
  });
});
