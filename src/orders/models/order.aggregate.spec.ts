import { Order } from './order.aggregate';
import { Money } from './value-objects/money.value-object';
import { OrderItem } from './value-objects/order-item.value-object';
import { OrderMustContainAtLeastOneItemException, InvalidMoneyAmountException } from '../exceptions/order-domain.exceptions';

describe('Order Aggregate', () => {
  const defaultId = 'order-123';
  const defaultCustomerId = 'customer-456';
  const defaultItems = [OrderItem.create('prod-789', 2, Money.create(50))];
  const defaultTotal = Money.create(100);
  const defaultOriginalTotal = Money.create(100);
  const defaultRegionalAdjustment = Money.create(0);
  const defaultTaxAmount = Money.create(0);
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

      // Verify fields via getters (encapsulation enforced)
      expect(order.getId()).toBe(defaultId);
      expect(order.getCustomerId()).toBe(defaultCustomerId);
      expect(order.getItems()).toHaveLength(1);
      expect(order.getItems()[0].getProductId()).toBe('prod-789');
      expect(order.getTotal().getAmount()).toBe(100);
      expect(order.getOriginalTotal().getAmount()).toBe(100);

      // Verify events are pushed
      const uncommittedEvents = order.getUncommittedEvents();
      expect(uncommittedEvents.length).toBe(1);
      expect(uncommittedEvents[0].constructor.name).toBe('OrderCreatedEvent');
    });

    it('should throw InvalidMoneyAmountException if total is negative', () => {
      expect(() => {
        Order.create(
          defaultId,
          defaultCustomerId,
          defaultItems,
          Money.create(-10), // Invalid total — Money guards this
          defaultOriginalTotal,
          defaultRegionalAdjustment,
          defaultTaxAmount,
          defaultTaxRate,
          defaultDiscountApplied,
        );
      }).toThrow(InvalidMoneyAmountException);
    });

    it('should throw InvalidMoneyAmountException if originalTotal is negative', () => {
      expect(() => {
        Order.create(
          defaultId,
          defaultCustomerId,
          defaultItems,
          defaultTotal,
          Money.create(-20), // Invalid original total — Money guards this
          defaultRegionalAdjustment,
          defaultTaxAmount,
          defaultTaxRate,
          defaultDiscountApplied,
        );
      }).toThrow(InvalidMoneyAmountException);
    });

    it('should throw OrderMustContainAtLeastOneItemException if items array is empty', () => {
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
      }).toThrow(OrderMustContainAtLeastOneItemException);
    });
  });
});
