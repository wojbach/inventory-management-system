import { Test, TestingModule } from '@nestjs/testing';
import { RestockProductHandler } from './restock-product.handler';
import { EventPublisher } from '@nestjs/cqrs';
import { PRODUCT_REPOSITORY_TOKEN } from '../../repositories/product-repository.interface';
import { RestockProductCommand } from '../impl/restock-product.command';
import { getConnectionToken } from '@nestjs/mongoose';

describe('RestockProductHandler', () => {
  let handler: RestockProductHandler;

  const mockProduct = {
    id: '123',
    stock: 5,
    restock: jest.fn(),
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
        RestockProductHandler,
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

    handler = module.get<RestockProductHandler>(RestockProductHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully restock a product', async () => {
    const command = new RestockProductCommand('123', 10);

    await handler.execute(command);

    expect(mockConnection.startSession).toHaveBeenCalled();
    expect(mockSession.startTransaction).toHaveBeenCalled();

    expect(mockProductRepository.findById).toHaveBeenCalledWith('123');
    expect(mockEventPublisher.mergeObjectContext).toHaveBeenCalledWith(mockProduct);

    expect(mockProduct.restock).toHaveBeenCalledWith(10);
    expect(mockProductRepository.updateStock).toHaveBeenCalledWith(mockProduct.id, 10, mockSession);

    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockProduct.commit).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should abort transaction on error', async () => {
    const command = new RestockProductCommand('123', 10);
    const error = new Error('Test Error');
    mockProduct.restock.mockImplementationOnce(() => {
      throw error;
    });

    await expect(handler.execute(command)).rejects.toThrow(error);

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    expect(mockProduct.commit).not.toHaveBeenCalled();
  });
});
