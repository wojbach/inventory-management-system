import { ProductCategory } from '../../enums/product-category.enum';

export class CreateProductCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly category: ProductCategory,
  ) {}
}
