import { ProductCategory } from '../enums/product-category.enum';

export class ProductResponseDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  createdAt?: string;
  updatedAt?: string;

  static create(primitive: Partial<ProductResponseDto>): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = primitive.id ?? '';
    dto.name = primitive.name ?? '';
    dto.description = primitive.description ?? '';
    dto.price = primitive.price ?? 0;
    dto.stock = primitive.stock ?? 0;
    dto.category = primitive.category ?? ProductCategory.GENERAL;
    dto.createdAt = primitive.createdAt ?? '';
    dto.updatedAt = primitive.updatedAt ?? '';
    return dto;
  }
}
