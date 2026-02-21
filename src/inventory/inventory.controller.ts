import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductDto } from './dto/create-product.dto';
import { RestockProductDto } from './dto/restock-product.dto';
import { SellProductDto } from './dto/sell-product.dto';
import { CreateProductCommand } from './commands/impl/create-product.command';
import { RestockProductCommand } from './commands/impl/restock-product.command';
import { SellProductCommand } from './commands/impl/sell-product.command';
import { GetProductsQuery } from './queries/impl/get-products.query';
import { ApiBody } from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('products')
export class InventoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getProducts(@Query() queryParams: PaginationDto) {
    return this.queryBus.execute(
      new GetProductsQuery(queryParams.page, queryParams.limit),
    );
  }

  @Post()
  @ApiBody({ type: CreateProductDto })
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() dto: CreateProductDto) {
    const id = await this.commandBus.execute(
      new CreateProductCommand(dto.name, dto.description, dto.price, dto.stock),
    );
    return { id };
  }

  @Post(':id/restock')
  @ApiBody({ type: RestockProductDto })
  @HttpCode(HttpStatus.OK)
  async restockProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestockProductDto,
  ) {
    await this.commandBus.execute(new RestockProductCommand(id, dto.amount));
  }

  @Post(':id/sell')
  @ApiBody({ type: SellProductDto })
  @HttpCode(HttpStatus.OK)
  async sellProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SellProductDto,
  ) {
    await this.commandBus.execute(new SellProductCommand(id, dto.amount));
  }
}
