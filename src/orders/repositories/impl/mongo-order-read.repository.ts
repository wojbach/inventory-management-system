import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderDocument } from './order.schema';
import { IOrderReadRepository } from '../order-read-repository.interface';
import { OrderResponseDto } from '../../dto/order-response.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class MongoOrderReadRepository implements IOrderReadRepository {
  constructor(
    @InjectModel(OrderDocument.name)
    private readonly model: Model<OrderDocument>,
  ) {}

  async findPaginated(page: number, limit: number): Promise<PaginatedResponse<OrderResponseDto>> {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model.find().skip(skip).limit(limit).populate('items.productId').lean().exec(),
      this.model.countDocuments().exec(),
    ]);

    const data: OrderResponseDto[] = docs.map((doc) => {
      const orderDoc = doc as Omit<OrderDocument, 'items'> & {
        items: {
          productId: { _id: import('mongoose').Types.ObjectId | string; name: string } | string;
          quantity: number;
          price: number;
        }[];
      };

      return OrderResponseDto.create({
        id: orderDoc._id.toString(),
        customerId: orderDoc.customerId,
        items: orderDoc.items.map((i) => {
          const p = i.productId;
          const isPopulated = p && typeof p === 'object' && '_id' in p;

          return {
            productId: isPopulated ? p._id.toString() : (p as string),
            productName: isPopulated ? p.name : undefined,
            quantity: i.quantity,
            price: i.price,
          };
        }),
        total: orderDoc.total,
        originalTotal: orderDoc.originalTotal,
        regionalAdjustment: orderDoc.regionalAdjustment,
        taxAmount: orderDoc.taxAmount,
        taxRate: orderDoc.taxRate,
        discountApplied: orderDoc.discountApplied,
        createdAt: orderDoc.createdAt?.toISOString(),
        updatedAt: orderDoc.updatedAt?.toISOString(),
      });
    });

    return { data, total, page, limit };
  }
}
