import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBody } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderCommand } from './commands/impl/create-order.command';
import { GetOrdersQuery } from './queries/impl/get-orders.query';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getOrders(@Query() queryParams: PaginationDto) {
    return this.queryBus.execute(new GetOrdersQuery(queryParams.page, queryParams.limit));
  }

  @Post()
  @ApiBody({ type: CreateOrderDto })
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() dto: CreateOrderDto) {
    const orderId = await this.commandBus.execute(new CreateOrderCommand(dto.customerId, dto.items));
    return { orderId };
  }
}
