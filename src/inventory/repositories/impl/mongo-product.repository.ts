import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, QueryFilter } from 'mongoose';
import { ProductDocument } from './product.schema';
import { Product } from '../../models/product.aggregate';
import { ProductNotFoundException } from '../../../common/exceptions/product-not-found.exception';
import { ProductResponseDto } from '../../dto/product-response.dto';
import { IProductRepository } from '../product-repository.interface';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class MongoProductRepository implements IProductRepository<ClientSession> {
  constructor(
    @InjectModel(ProductDocument.name)
    private readonly model: Model<ProductDocument>,
  ) {}

  async findById(id: string): Promise<Product> {
    const doc = await this.model.findById(id);
    if (!doc) throw new ProductNotFoundException(id);
    return new Product(doc._id.toString(), doc.name, doc.description, doc.price, doc.stock, doc.category);
  }

  async findAll(page: number, limit: number): Promise<PaginatedResponse<ProductResponseDto>> {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([this.model.find().skip(skip).limit(limit).lean().exec(), this.model.countDocuments().exec()]);

    const data: ProductResponseDto[] = docs.map((doc: ProductDocument) =>
      ProductResponseDto.create({
        id: doc._id.toString(),
        name: doc.name,
        description: doc.description,
        price: doc.price,
        stock: doc.stock,
        category: doc.category,
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      }),
    );

    return { data, total, page, limit };
  }

  async create(product: Product, transaction?: ClientSession): Promise<void> {
    await this.model.create(
      [
        {
          _id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
        },
      ],
      { session: transaction },
    );
  }

  async updateStock(id: string, quantityChange: number, transaction?: ClientSession): Promise<void> {
    const filter: QueryFilter<ProductDocument> = { _id: id };
    if (quantityChange < 0) {
      filter.stock = { $gte: Math.abs(quantityChange) };
    }
    const result = await this.model.updateOne(filter, { $inc: { stock: quantityChange } }, { session: transaction });
    if (result.matchedCount === 0) {
      if (quantityChange < 0) {
        throw new Error('Concurrent order update detected, insufficient stock or product not found.');
      }
      throw new ProductNotFoundException(id);
    }
  }
}
