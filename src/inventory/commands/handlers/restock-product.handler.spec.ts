import { Test, TestingModule } from '@nestjs/testing';
import { RestockProductHandler } from './restock-product.handler';
import { EventPublisher } from '@nestjs/cqrs';
import { PRODUCT_REPOSITORY_TOKEN } from '../../repositories/product-repository.interface';
import { RestockProductCommand } from '../impl/restock-product.command';
import { UNIT_OF_WORK_TOKEN } from '../../../database/unit-of-work.interface';

describe('RestockProductHandler', () => {
  let handler: RestockProductHandler;

  const mockProduct = {
    id: '123',
    stock: 5,
    getId: jest.fn().mockReturnValue('123'),
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

  const mockUnitOfWork = {
    withTransaction: jest.fn().mockImplementation(async (work: () => Promise<void>) => {
      return await work();
    }),
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
          provide: UNIT_OF_WORK_TOKEN,
          useValue: mockUnitOfWork,
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

    expect(mockUnitOfWork.withTransaction).toHaveBeenCalled();
    expect(mockProductRepository.findById).toHaveBeenCalledWith('123');
    expect(mockEventPublisher.mergeObjectContext).toHaveBeenCalledWith(mockProduct);

    expect(mockProduct.restock).toHaveBeenCalledWith(10);
    expect(mockProductRepository.updateStock).toHaveBeenCalledWith('123', 10);

    expect(mockProduct.commit).toHaveBeenCalled();
  });

  it('should abort transaction on error', async () => {
    const command = new RestockProductCommand('123', 10);
    const error = new Error('Test Error');
    mockProduct.restock.mockImplementationOnce(() => {
      throw error;
    });

    await expect(handler.execute(command)).rejects.toThrow(error);
    expect(mockProduct.commit).not.toHaveBeenCalled();
  });
});
