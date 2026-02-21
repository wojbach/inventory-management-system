import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class SellProductDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;
}
