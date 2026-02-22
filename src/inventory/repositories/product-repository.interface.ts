import { Product } from '../models/product.aggregate';
import { ProductResponseDto } from '../dto/product-response.dto';

import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

export const PRODUCT_REPOSITORY_TOKEN = Symbol('ProductRepository');

export interface IProductRepository<TTransactionalSession = unknown> {
  findById(id: string): Promise<Product>;

  findAll(page: number, limit: number): Promise<PaginatedResponse<ProductResponseDto>>;

  create(product: Product, transaction?: TTransactionalSession): Promise<void>;

  updateStock(id: string, quantityChange: number, transaction?: TTransactionalSession): Promise<void>;
}
