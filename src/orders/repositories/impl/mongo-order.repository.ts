import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { OrderDocument } from './order.schema';
import { Order } from '../../models/order.aggregate';
import { IOrderRepository, OrderItemInput } from '../order-repository.interface';
import { OrderResponseDto } from '../../dto/order-response.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class MongoOrderRepository implements IOrderRepository<ClientSession> {
  constructor(
    @InjectModel(OrderDocument.name)
    private readonly model: Model<OrderDocument>,
  ) {}

  async findAll(page: number, limit: number): Promise<PaginatedResponse<OrderResponseDto>> {
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

  async create(
    orderId: string,
    customerId: string,
    items: OrderItemInput[],
    total: number,
    originalTotal: number,
    regionalAdjustment: number,
    taxAmount: number,
    taxRate: number,
    discountApplied: string,
    transaction?: ClientSession,
  ): Promise<Order> {
    await this.model.create(
      [
        {
          _id: orderId,
          customerId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
          total,
          originalTotal,
          regionalAdjustment,
          taxAmount,
          taxRate,
          discountApplied,
        },
      ],
      { session: transaction },
    );

    return new Order(orderId, customerId, items, total, originalTotal, regionalAdjustment, taxAmount, taxRate, discountApplied);
  }
}
