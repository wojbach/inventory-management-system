import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrdersQuery } from '../impl/get-orders.query';
import { IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../repositories/order-repository.interface';
import { OrderResponseDto } from '../../dto/order-response.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';

@QueryHandler(GetOrdersQuery)
export class GetOrdersHandler implements IQueryHandler<GetOrdersQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(query: GetOrdersQuery): Promise<PaginatedResponse<OrderResponseDto>> {
    return this.orderRepository.findAll(query.page, query.limit);
  }
}
