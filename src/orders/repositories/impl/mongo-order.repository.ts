import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderDocument } from './order.schema';
import { Order } from '../../models/order.aggregate';
import { IOrderRepository } from '../order-repository.interface';
import { UNIT_OF_WORK_TOKEN, IUnitOfWork } from '../../../database/unit-of-work.interface';

@Injectable()
export class MongoOrderRepository implements IOrderRepository {
  constructor(
    @InjectModel(OrderDocument.name)
    private readonly model: Model<OrderDocument>,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: IUnitOfWork,
  ) {}

  async create(order: Order): Promise<void> {
    const session = this.uow.getSession();

    await this.model.create(
      [
        {
          _id: order.getId(),
          customerId: order.getCustomerId(),
          items: order.getItems().map((i) => ({
            productId: i.getProductId(),
            quantity: i.getQuantity(),
            price: i.getPrice().getAmount(),
          })),
          total: order.getTotal().getAmount(),
          originalTotal: order.getOriginalTotal().getAmount(),
          regionalAdjustment: order.getRegionalAdjustment().getAmount(),
          taxAmount: order.getTaxAmount().getAmount(),
          taxRate: order.getTaxRate(),
          discountApplied: order.getDiscountApplied(),
        },
      ],
      { session },
    );
  }
}
