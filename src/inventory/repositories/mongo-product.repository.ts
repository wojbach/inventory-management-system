import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { ProductDocument } from '../models/product.schema';
import { Product } from '../models/product.aggregate';
import { ProductNotFoundException } from '../../common/exceptions/product-not-found.exception';
import { ProductResponseDto } from '../dto/product-response.dto';
import { IProductRepository } from './product-repository.interface';

@Injectable()
export class MongoProductRepository implements IProductRepository {
  constructor(
    @InjectModel(ProductDocument.name)
    private readonly model: Model<ProductDocument>,
  ) {}

  async findById(id: string): Promise<Product> {
    const doc = await this.model.findById(id);
    if (!doc) throw new ProductNotFoundException(id);
    return new Product(
      doc._id.toString(),
      doc.name,
      doc.description,
      doc.price,
      doc.stock,
    );
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{
    data: ProductResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model.find().skip(skip).limit(limit).lean().exec(),
      this.model.countDocuments().exec(),
    ]);

    const data: ProductResponseDto[] = docs.map((doc: ProductDocument) =>
      ProductResponseDto.create({
        id: doc._id.toString(),
        name: doc.name,
        description: doc.description,
        price: doc.price,
        stock: doc.stock,
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      }),
    );

    return { data, total, page, limit };
  }

  async create(product: Product, session?: ClientSession): Promise<void> {
    await this.model.create(
      [
        {
          _id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
        },
      ],
      { session },
    );
  }

  async updateStock(
    id: string,
    newStock: number,
    session?: ClientSession,
  ): Promise<void> {
    await this.model.updateOne({ _id: id }, { stock: newStock }, { session });
  }
}
