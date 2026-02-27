import { Product } from './product.aggregate';
import { ProductCategory } from '../enums/product-category.enum';
import { InsufficientStockException } from '../../common/exceptions/insufficient-stock.exception';
import { InvalidProductPriceException, InvalidStockAmountException } from '../exceptions/product-domain.exceptions';

describe('Product Aggregate', () => {
  const defaultId = 'prod-123';
  const defaultName = 'Test Product';
  const defaultDesc = 'This is a test product';
  const defaultCategory = ProductCategory.GENERAL;

  describe('create', () => {
    it('should create a valid product', () => {
      const product = Product.create(defaultId, defaultName, defaultDesc, 100, 50, defaultCategory);
      expect(product.getId()).toBe(defaultId);
      expect(product.getName()).toBe(defaultName);
      expect(product.getPrice()).toBe(100);
      expect(product.getStock()).toBe(50);
      expect(product.getCategory()).toBe(defaultCategory);

      const uncommittedEvents = product.getUncommittedEvents();
      expect(uncommittedEvents.length).toBe(1);
      expect(uncommittedEvents[0].constructor.name).toBe('ProductCreatedEvent');
    });

    it('should throw if price is zero or negative', () => {
      expect(() => Product.create(defaultId, defaultName, defaultDesc, 0, 50, defaultCategory)).toThrow(InvalidProductPriceException);
      expect(() => Product.create(defaultId, defaultName, defaultDesc, -10, 50, defaultCategory)).toThrow(InvalidProductPriceException);
    });

    it('should throw if price exceeds 1,000,000', () => {
      expect(() => Product.create(defaultId, defaultName, defaultDesc, 1_000_001, 50, defaultCategory)).toThrow(InvalidProductPriceException);
    });

    it('should throw if stock exceeds 1,000,000', () => {
      expect(() => Product.create(defaultId, defaultName, defaultDesc, 100, 1_000_001, defaultCategory)).toThrow(InvalidStockAmountException);
    });
  });

  describe('restock', () => {
    it('should successfully increase stock in a valid restock', () => {
      const product = Product.create(defaultId, defaultName, defaultDesc, 100, 50, defaultCategory);
      product.commit(); // Clear events from creation

      product.restock(20);
      expect(product.getStock()).toBe(70);

      const uncommittedEvents = product.getUncommittedEvents();
      expect(uncommittedEvents.length).toBe(1);
      expect(uncommittedEvents[0].constructor.name).toBe('ProductRestockedEvent');
    });

    it('should throw if restock amount is zero or negative', () => {
      const product = Product.create(defaultId, defaultName, defaultDesc, 100, 50, defaultCategory);
      expect(() => product.restock(0)).toThrow(InvalidStockAmountException);
      expect(() => product.restock(-5)).toThrow(InvalidStockAmountException);
    });

    it('should throw if restocked stock exceeds 1,000,000', () => {
      const product = Product.create(defaultId, defaultName, defaultDesc, 100, 999_990, defaultCategory);
      expect(() => product.restock(20)).toThrow(InvalidStockAmountException);
    });
  });

  describe('sell', () => {
    it('should successfully decrease stock on a valid sale', () => {
      const product = Product.create(defaultId, defaultName, defaultDesc, 100, 50, defaultCategory);
      product.commit(); // Clear events from creation

      product.sell(15);
      expect(product.getStock()).toBe(35);

      const uncommittedEvents = product.getUncommittedEvents();
      expect(uncommittedEvents.length).toBe(1);
      expect(uncommittedEvents[0].constructor.name).toBe('ProductSoldEvent');
    });

    it('should throw InsufficientStockException if selling more than available stock', () => {
      const product = Product.create(defaultId, defaultName, defaultDesc, 100, 50, defaultCategory);
      expect(() => product.sell(51)).toThrow(InsufficientStockException);
      expect(() => product.sell(100)).toThrow(InsufficientStockException);
    });

    it('should throw if sell amount is zero or negative', () => {
      const product = Product.create(defaultId, defaultName, defaultDesc, 100, 50, defaultCategory);
      expect(() => product.sell(0)).toThrow(InvalidStockAmountException);
      expect(() => product.sell(-5)).toThrow(InvalidStockAmountException);
    });
  });

  describe('load', () => {
    it('should rehydrate a product without emitting events', () => {
      const product = Product.load(defaultId, defaultName, defaultDesc, 100, 50, defaultCategory);
      expect(product.getId()).toBe(defaultId);
      expect(product.getName()).toBe(defaultName);
      expect(product.getPrice()).toBe(100);
      expect(product.getStock()).toBe(50);
      expect(product.getCategory()).toBe(defaultCategory);

      const uncommittedEvents = product.getUncommittedEvents();
      expect(uncommittedEvents.length).toBe(0);
    });
  });
});
