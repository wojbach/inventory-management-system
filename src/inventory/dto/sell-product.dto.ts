import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class SellProductDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  amount: number;
}
