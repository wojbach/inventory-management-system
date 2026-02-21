import { Order } from '../models/order.aggregate';
import { OrderResponseDto } from '../dto/order-response.dto';

export const ORDER_REPOSITORY_TOKEN = Symbol('OrderRepository');

import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

export interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
  category: string;
}

export interface IOrderRepository<TTransactionalSession = unknown> {
  findAll(page: number, limit: number): Promise<PaginatedResponse<OrderResponseDto>>;

  create(
    orderId: string,
    customerId: string,
    items: OrderItemInput[],
    total: number,
    originalTotal: number,
    regionalAdjustment: number,
    taxAmount: number,
    taxRate: number,
    discountApplied: string,
    transaction?: TTransactionalSession,
  ): Promise<Order>;
}
