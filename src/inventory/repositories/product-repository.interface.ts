import { Product } from '../models/product.aggregate';

export const PRODUCT_REPOSITORY_TOKEN = Symbol('ProductRepository');

export interface IProductRepository {
  findById(id: string): Promise<Product>;

  create(product: Product): Promise<void>;

  updateStock(id: string, quantityChange: number): Promise<void>;
}
