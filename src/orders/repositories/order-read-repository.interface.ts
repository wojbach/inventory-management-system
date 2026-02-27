import { OrderResponseDto } from '../dto/order-response.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

export const ORDER_READ_REPOSITORY_TOKEN = Symbol('OrderReadRepository');

export interface IOrderReadRepository {
  findPaginated(page: number, limit: number): Promise<PaginatedResponse<OrderResponseDto>>;
}
