import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductDocument } from './product.schema';
import { IProductReadRepository } from '../product-read-repository.interface';
import { ProductResponseDto } from '../../dto/product-response.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class MongoProductReadRepository implements IProductReadRepository {
  constructor(
    @InjectModel(ProductDocument.name)
    private readonly model: Model<ProductDocument>,
  ) {}

  async findPaginated(page: number, limit: number): Promise<PaginatedResponse<ProductResponseDto>> {
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
}
