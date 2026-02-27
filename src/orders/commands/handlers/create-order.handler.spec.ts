import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderHandler } from './create-order.handler';
import { EventPublisher } from '@nestjs/cqrs';
import { ORDER_REPOSITORY_TOKEN } from '../../repositories/order-repository.interface';
import { CONSUMER_REPOSITORY_TOKEN } from '../../../consumers/repositories/consumer-repository.interface';
import { PricingService } from '../../services/pricing.service';
import { CreateOrderCommand } from '../impl/create-order.command';
import { CustomerLocation } from '../../../common/enums/customer-location.enum';
import { ProductCategory } from '../../../inventory/enums/product-category.enum';
import { UNIT_OF_WORK_TOKEN } from '../../../database/unit-of-work.interface';
import { InventoryFacade } from '../../../inventory/inventory.facade';
import { Order } from '../../models/order.aggregate';
import { OrderCreatedEvent } from '../../events/impl/order-created.event';

describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler;

  let uncommittedEvents: unknown[] = [];

  const mockOrderRepository = {
    create: jest.fn(),
  };

  const mockConsumerRepository = {
    findById: jest.fn().mockResolvedValue({ location: CustomerLocation.US }),
  };

  const mockPricingService = {
    calculate: jest.fn().mockReturnValue({
      total: 90,
      originalTotal: 100,
      regionalAdjustment: 0,
      taxAmount: 0,
      taxRate: 0,
      discountApplied: 'Volume 10%',
    }),
  };

  const mockEventPublisher = {
    mergeObjectContext: jest.fn().mockImplementation((obj: Order) => {
      // Mock commit to capture events for assertion
      obj.commit = jest.fn().mockImplementation(() => {
        uncommittedEvents = obj.getUncommittedEvents();
      });
      return obj;
    }),
  };

  const mockUnitOfWork = {
    withTransaction: jest.fn().mockImplementation(async (work: () => Promise<string>) => {
      return await work();
    }),
    getSession: jest.fn().mockReturnValue('mock-session'),
    getSessionIfAvailable: jest.fn().mockReturnValue('mock-session'),
  };

  const mockInventoryFacade = {
    getProductSnapshot: jest.fn().mockResolvedValue({
      id: 'prod-1',
      price: 100,
      stock: 10,
      category: ProductCategory.ELECTRONICS,
    }),
    deductStock: jest.fn(),
  };

  beforeEach(async () => {
    uncommittedEvents = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderHandler,
        { provide: ORDER_REPOSITORY_TOKEN, useValue: mockOrderRepository },
        { provide: CONSUMER_REPOSITORY_TOKEN, useValue: mockConsumerRepository },
        { provide: UNIT_OF_WORK_TOKEN, useValue: mockUnitOfWork },
        { provide: PricingService, useValue: mockPricingService },
        { provide: EventPublisher, useValue: mockEventPublisher },
        { provide: InventoryFacade, useValue: mockInventoryFacade },
      ],
    }).compile();

    handler = module.get<CreateOrderHandler>(CreateOrderHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create an order and emit OrderCreatedEvent (State-based test)', async () => {
    const command = new CreateOrderCommand('consumer-1', [{ productId: 'prod-1', quantity: 2 }]);

    const returnedOrderId = await handler.execute(command);

    // 1. Return Id Assertions — handler generates UUID internally
    expect(returnedOrderId).toBeDefined();
    expect(typeof returnedOrderId).toBe('string');
    expect(returnedOrderId.length).toBeGreaterThan(0);

    // 2. State & Data Driven Assertions (Testing the actual outcome, not just interactions)

    // Check if the order was created and saved with the expected encapsulated values
    expect(mockOrderRepository.create).toHaveBeenCalledTimes(1);

    // Retrieve the actual Order aggregate passed to the repository
    const savedOrder = mockOrderRepository.create.mock.calls[0][0] as Order;

    expect(savedOrder).toBeDefined();
    expect(savedOrder.getId()).toEqual(returnedOrderId);
    expect(savedOrder.getCustomerId()).toEqual('consumer-1');
    expect(savedOrder.getTotal().getAmount()).toEqual(90); // ValueObject Money unwrapped
    expect(savedOrder.getOriginalTotal().getAmount()).toEqual(100);
    expect(savedOrder.getItems()).toHaveLength(1);
    expect(savedOrder.getItems()[0].getProductId()).toEqual('prod-1');
    expect(savedOrder.getItems()[0].getQuantity()).toEqual(2);
    expect(savedOrder.getItems()[0].getPrice().getAmount()).toEqual(100); // from mock snapshot

    // 3. Domain Event Assertions (Crucial for CQRS)
    expect(uncommittedEvents).toHaveLength(1);
    const event = uncommittedEvents[0] as OrderCreatedEvent;

    expect(event).toBeInstanceOf(OrderCreatedEvent);
    expect(event.id).toEqual(returnedOrderId);
    expect(event.total).toEqual(90);
    expect(event.items).toHaveLength(1);
    expect(event.items[0]).toEqual({ productId: 'prod-1', quantity: 2, price: 100 });
  });

  it('should throw consumer not found exception', async () => {
    mockConsumerRepository.findById.mockResolvedValueOnce(null);
    const command = new CreateOrderCommand('consumer-1', [{ productId: 'prod-1', quantity: 2 }]);

    await expect(handler.execute(command)).rejects.toThrow('Consumer with ID consumer-1 not found');
  });

  it('should propagate insufficient stock error from inventory facade', async () => {
    const command = new CreateOrderCommand('consumer-1', [{ productId: 'prod-1', quantity: 15 }]);
    const error = new Error('Insufficient stock for product prod-1. Available: 10, Requested: 15');
    mockInventoryFacade.deductStock.mockRejectedValueOnce(error);

    await expect(handler.execute(command)).rejects.toThrow(error);
    expect(mockOrderRepository.create).not.toHaveBeenCalled();
  });
});
