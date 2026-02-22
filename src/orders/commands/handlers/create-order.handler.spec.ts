import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderHandler } from './create-order.handler';
import { EventPublisher } from '@nestjs/cqrs';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../inventory/repositories/product-repository.interface';
import { ORDER_REPOSITORY_TOKEN } from '../../repositories/order-repository.interface';
import { CONSUMER_REPOSITORY_TOKEN } from '../../../consumers/repositories/consumer-repository.interface';
import { PricingService } from '../../services/pricing.service';
import { CreateOrderCommand } from '../impl/create-order.command';
import { getConnectionToken } from '@nestjs/mongoose';
import { CustomerLocation } from '../../enums/customer-location.enum';
import { ProductCategory } from '../../../inventory/enums/product-category.enum';

describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler;

  const mockProduct = {
    id: 'prod-1',
    price: 100,
    stock: 10,
    category: ProductCategory.ELECTRONICS,
    sell: jest.fn(),
    commit: jest.fn(),
  };

  const mockProductRepository = {
    findById: jest.fn().mockResolvedValue(mockProduct),
    updateStock: jest.fn(),
  };

  const mockOrderAggregate = {
    commit: jest.fn(),
  };

  const mockOrderRepository = {
    create: jest.fn().mockResolvedValue(mockOrderAggregate),
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
    mergeObjectContext: jest.fn().mockImplementation((obj) => obj), // just returns the passed object
  };

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue(mockSession),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderHandler,
        { provide: PRODUCT_REPOSITORY_TOKEN, useValue: mockProductRepository },
        { provide: ORDER_REPOSITORY_TOKEN, useValue: mockOrderRepository },
        { provide: CONSUMER_REPOSITORY_TOKEN, useValue: mockConsumerRepository },
        { provide: PricingService, useValue: mockPricingService },
        { provide: EventPublisher, useValue: mockEventPublisher },
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    handler = module.get<CreateOrderHandler>(CreateOrderHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create an order', async () => {
    const command = new CreateOrderCommand('consumer-1', [{ productId: 'prod-1', quantity: 2 }]);

    const orderId = await handler.execute(command);

    // Verifications
    expect(orderId).toBeDefined();
    expect(mockConnection.startSession).toHaveBeenCalled();
    expect(mockSession.startTransaction).toHaveBeenCalled();

    // Checked consumer
    expect(mockConsumerRepository.findById).toHaveBeenCalledWith('consumer-1');

    // Checked product
    expect(mockProductRepository.findById).toHaveBeenCalledWith('prod-1');

    // Calculated pricing
    expect(mockPricingService.calculate).toHaveBeenCalledWith(
      [{ productId: 'prod-1', price: 100, quantity: 2, category: ProductCategory.ELECTRONICS }],
      CustomerLocation.US,
    );

    // Stock deduplicated and updated
    expect(mockProductRepository.updateStock).toHaveBeenCalledWith('prod-1', -2, mockSession);

    // Order created
    expect(mockOrderRepository.create).toHaveBeenCalled();

    // Transactions committed and ended correctly
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();

    // Events pushed
    expect(mockProduct.commit).toHaveBeenCalled();
    expect(mockOrderAggregate.commit).toHaveBeenCalled();
  });

  it('should throw consumer not found exception', async () => {
    mockConsumerRepository.findById.mockResolvedValueOnce(null);
    const command = new CreateOrderCommand('consumer-1', [{ productId: 'prod-1', quantity: 2 }]);

    await expect(handler.execute(command)).rejects.toThrow('Consumer with ID consumer-1 not found');
  });

  it('should abort transaction on product insufficient stock error', async () => {
    const command = new CreateOrderCommand('consumer-1', [{ productId: 'prod-1', quantity: 15 }]);

    await expect(handler.execute(command)).rejects.toThrow('Insufficient stock for product prod-1. Available: 10, Requested: 15');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });
});
