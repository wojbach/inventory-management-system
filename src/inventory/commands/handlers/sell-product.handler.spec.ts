import { Test, TestingModule } from '@nestjs/testing';
import { SellProductHandler } from './sell-product.handler';
import { EventPublisher } from '@nestjs/cqrs';
import { PRODUCT_REPOSITORY_TOKEN } from '../../repositories/product-repository.interface';
import { SellProductCommand } from '../impl/sell-product.command';
import { UNIT_OF_WORK_TOKEN } from '../../../database/unit-of-work.interface';

describe('SellProductHandler', () => {
  let handler: SellProductHandler;

  const mockProduct = {
    id: '123',
    stock: 5,
    getId: jest.fn().mockReturnValue('123'),
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

  const mockUnitOfWork = {
    withTransaction: jest.fn().mockImplementation(async (work: () => Promise<void>) => {
      return await work();
    }),
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
          provide: UNIT_OF_WORK_TOKEN,
          useValue: mockUnitOfWork,
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

    expect(mockUnitOfWork.withTransaction).toHaveBeenCalled();
    expect(mockProductRepository.findById).toHaveBeenCalledWith('123');
    expect(mockEventPublisher.mergeObjectContext).toHaveBeenCalledWith(mockProduct);

    expect(mockProduct.sell).toHaveBeenCalledWith(2);
    expect(mockProductRepository.updateStock).toHaveBeenCalledWith('123', -2);

    expect(mockProduct.commit).toHaveBeenCalled();
  });

  it('should abort transaction on error', async () => {
    const command = new SellProductCommand('123', 10);
    const error = new Error('Insufficient Stock Error');
    mockProduct.sell.mockImplementationOnce(() => {
      throw error;
    });

    await expect(handler.execute(command)).rejects.toThrow(error);
    expect(mockProduct.commit).not.toHaveBeenCalled();
  });
});
