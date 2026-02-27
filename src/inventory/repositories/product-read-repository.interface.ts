import { ProductResponseDto } from '../dto/product-response.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

export const PRODUCT_READ_REPOSITORY_TOKEN = Symbol('ProductReadRepository');

export interface IProductReadRepository {
  findPaginated(page: number, limit: number): Promise<PaginatedResponse<ProductResponseDto>>;
}
