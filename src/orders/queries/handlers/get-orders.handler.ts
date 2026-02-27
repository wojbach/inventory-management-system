import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrdersQuery } from '../impl/get-orders.query';
import { OrderResponseDto } from '../../dto/order-response.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
import { IOrderReadRepository, ORDER_READ_REPOSITORY_TOKEN } from '../../repositories/order-read-repository.interface';

@QueryHandler(GetOrdersQuery)
export class GetOrdersHandler implements IQueryHandler<GetOrdersQuery> {
  constructor(
    @Inject(ORDER_READ_REPOSITORY_TOKEN)
    private readonly readRepository: IOrderReadRepository,
  ) {}

  async execute(query: GetOrdersQuery): Promise<PaginatedResponse<OrderResponseDto>> {
    return this.readRepository.findPaginated(query.page, query.limit);
  }
}
