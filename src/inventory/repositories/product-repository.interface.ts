import { Product } from '../models/product.aggregate';
import { ProductResponseDto } from '../dto/product-response.dto';

export const PRODUCT_REPOSITORY_TOKEN = Symbol('ProductRepository');

export interface IProductRepository {
  findById(id: string): Promise<Product>;

  findAll(
    page: number,
    limit: number,
  ): Promise<{
    data: ProductResponseDto[];
    total: number;
    page: number;
    limit: number;
  }>;

  create(product: Product, session?: unknown): Promise<void>;

  updateStock(id: string, newStock: number, session?: unknown): Promise<void>;
}
