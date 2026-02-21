import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetProductsQuery } from '../impl/get-products.query';
import { IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../repositories/product-repository.interface';
import { ProductResponseDto } from '../../dto/product-response.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<GetProductsQuery> {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: GetProductsQuery): Promise<PaginatedResponse<ProductResponseDto>> {
    return this.productRepository.findAll(query.page, query.limit);
  }
}
