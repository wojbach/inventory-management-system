import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Max } from 'class-validator';

export class RestockProductDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  @Max(1_000_000)
  amount: number;
}
