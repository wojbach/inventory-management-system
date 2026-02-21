import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Max } from 'class-validator';

export class RestockProductDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Max(1_000_000)
  amount: number;
}
