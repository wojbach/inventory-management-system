import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { ProductDocument } from './product.schema';
import { Product } from '../../models/product.aggregate';
import { ProductNotFoundException } from '../../../common/exceptions/product-not-found.exception';
import { IProductRepository } from '../product-repository.interface';
import { UNIT_OF_WORK_TOKEN, IUnitOfWork } from '../../../database/unit-of-work.interface';

@Injectable()
export class MongoProductRepository implements IProductRepository {
  constructor(
    @InjectModel(ProductDocument.name)
    private readonly model: Model<ProductDocument>,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: IUnitOfWork,
  ) {}

  async findById(id: string): Promise<Product> {
    const session = this.uow.getSessionIfAvailable();
    const doc = await this.model.findById(id).session(session ?? null);
    if (!doc) throw new ProductNotFoundException(id);
    return Product.load(doc._id.toString(), doc.name, doc.description, doc.price, doc.stock, doc.category);
  }

  async create(product: Product): Promise<void> {
    const session = this.uow.getSessionIfAvailable();

    await this.model.create(
      [
        {
          _id: product.getId(),
          name: product.getName(),
          description: product.getDescription(),
          price: product.getPrice(),
          stock: product.getStock(),
          category: product.getCategory(),
        },
      ],
      { session },
    );
  }

  async updateStock(id: string, quantityChange: number): Promise<void> {
    const session = this.uow.getSession();

    const filter: QueryFilter<ProductDocument> = { _id: id };
    if (quantityChange < 0) {
      filter.stock = { $gte: Math.abs(quantityChange) };
    }
    const result = await this.model.updateOne(filter, { $inc: { stock: quantityChange } }, { session });
    if (result.matchedCount === 0) {
      if (quantityChange < 0) {
        throw new Error('Concurrent order update detected, insufficient stock or product not found.');
      }
      throw new ProductNotFoundException(id);
    }
  }
}
