import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetConsumersQuery } from '../impl/get-consumers.query';
import { CONSUMER_REPOSITORY_TOKEN, IConsumerRepository, ConsumerDto } from '../../repositories/consumer-repository.interface';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';

@QueryHandler(GetConsumersQuery)
export class GetConsumersHandler implements IQueryHandler<GetConsumersQuery> {
  constructor(
    @Inject(CONSUMER_REPOSITORY_TOKEN)
    private readonly consumerRepository: IConsumerRepository,
  ) {}

  async execute(query: GetConsumersQuery): Promise<PaginatedResponse<ConsumerDto>> {
    return this.consumerRepository.findAll(query.page, query.limit);
  }
}
