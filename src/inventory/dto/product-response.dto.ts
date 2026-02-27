import { ProductCategory } from '../enums/product-category.enum';

interface CreateProductResponseParams {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  createdAt?: string;
  updatedAt?: string;
}

export class ProductResponseDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  createdAt?: string;
  updatedAt?: string;

  static create(params: CreateProductResponseParams): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = params.id;
    dto.name = params.name;
    dto.description = params.description;
    dto.price = params.price;
    dto.stock = params.stock;
    dto.category = params.category;
    dto.createdAt = params.createdAt;
    dto.updatedAt = params.updatedAt;
    return dto;
  }
}
