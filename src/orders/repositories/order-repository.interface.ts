import { Order } from '../models/order.aggregate';

export const ORDER_REPOSITORY_TOKEN = Symbol('OrderRepository');

export interface IOrderRepository {
  create(order: Order): Promise<void>;
}
