import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetConsumersQuery } from './queries/impl/get-consumers.query';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('consumers')
export class ConsumersController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getConsumers(@Query() query: PaginationDto) {
    return this.queryBus.execute(new GetConsumersQuery(query.page, query.limit));
  }
}
