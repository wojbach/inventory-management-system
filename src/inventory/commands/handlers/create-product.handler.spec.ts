import { Test, TestingModule } from '@nestjs/testing';
import { CreateProductHandler } from './create-product.handler';
import { EventPublisher } from '@nestjs/cqrs';
import { PRODUCT_REPOSITORY_TOKEN } from '../../repositories/product-repository.interface';
import { CreateProductCommand } from '../impl/create-product.command';
import { ProductCategory } from '../../enums/product-category.enum';

describe('CreateProductHandler', () => {
  let handler: CreateProductHandler;

  const mockProductRepository = {
    create: jest.fn(),
  };

  const mockProduct = {
    commit: jest.fn(),
  };

  const mockEventPublisher = {
    mergeObjectContext: jest.fn().mockReturnValue(mockProduct),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductHandler,
        {
          provide: PRODUCT_REPOSITORY_TOKEN,
          useValue: mockProductRepository,
        },
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    handler = module.get<CreateProductHandler>(CreateProductHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a product and save it to the repository', async () => {
    const command = new CreateProductCommand('Test Product', 'Test Description', 100, 10, ProductCategory.ELECTRONICS);

    const id = await handler.execute(command);

    // Ensure an ID is returned
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');

    // Ensure repository.create was called
    expect(mockProductRepository.create).toHaveBeenCalled();

    // Ensure the event publisher merged the context
    expect(mockEventPublisher.mergeObjectContext).toHaveBeenCalled();

    // Ensure commit was called on the aggregate
    expect(mockProduct.commit).toHaveBeenCalled();
  });
});
