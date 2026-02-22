import { Test, TestingModule } from '@nestjs/testing';
import { SellProductHandler } from './sell-product.handler';
import { EventPublisher } from '@nestjs/cqrs';
import { PRODUCT_REPOSITORY_TOKEN } from '../../repositories/product-repository.interface';
import { SellProductCommand } from '../impl/sell-product.command';
import { getConnectionToken } from '@nestjs/mongoose';

describe('SellProductHandler', () => {
  let handler: SellProductHandler;

  const mockProduct = {
    id: '123',
    stock: 5,
    sell: jest.fn(),
    commit: jest.fn(),
  };

  const mockProductRepository = {
    findById: jest.fn().mockResolvedValue(mockProduct),
    updateStock: jest.fn(),
  };

  const mockEventPublisher = {
    mergeObjectContext: jest.fn().mockReturnValue(mockProduct),
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
        SellProductHandler,
        {
          provide: PRODUCT_REPOSITORY_TOKEN,
          useValue: mockProductRepository,
        },
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    handler = module.get<SellProductHandler>(SellProductHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully sell a product', async () => {
    const command = new SellProductCommand('123', 2);

    await handler.execute(command);

    expect(mockConnection.startSession).toHaveBeenCalled();
    expect(mockSession.startTransaction).toHaveBeenCalled();

    expect(mockProductRepository.findById).toHaveBeenCalledWith('123');
    expect(mockEventPublisher.mergeObjectContext).toHaveBeenCalledWith(mockProduct);

    expect(mockProduct.sell).toHaveBeenCalledWith(2);
    expect(mockProductRepository.updateStock).toHaveBeenCalledWith(mockProduct.id, mockProduct.stock, mockSession);

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockProduct.commit).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should abort transaction on error', async () => {
    const command = new SellProductCommand('123', 10);
    const error = new Error('Insufficient Stock Error');
    mockProduct.sell.mockImplementationOnce(() => {
      throw error;
    });

    await expect(handler.execute(command)).rejects.toThrow(error);

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    expect(mockProduct.commit).not.toHaveBeenCalled();
  });
});
