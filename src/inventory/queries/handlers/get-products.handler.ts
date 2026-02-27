import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetProductsQuery } from '../impl/get-products.query';
import { ProductResponseDto } from '../../dto/product-response.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
import { IProductReadRepository, PRODUCT_READ_REPOSITORY_TOKEN } from '../../repositories/product-read-repository.interface';

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<GetProductsQuery> {
  constructor(
    @Inject(PRODUCT_READ_REPOSITORY_TOKEN)
    private readonly readRepository: IProductReadRepository,
  ) {}

  async execute(query: GetProductsQuery): Promise<PaginatedResponse<ProductResponseDto>> {
    return this.readRepository.findPaginated(query.page, query.limit);
  }
}
