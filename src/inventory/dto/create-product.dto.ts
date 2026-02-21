import {
  IsString,
  MaxLength,
  IsPositive,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Mouse', description: 'Product name' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: '2.4G wireless mouse',
    description: 'Brief description of the product',
  })
  @IsString()
  @MaxLength(50)
  description: string;

  @ApiProperty({ example: 19.99, description: 'Product price in decimal' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000)
  price: number;

  @ApiProperty({ example: 150, description: 'Initial stock available' })
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  stock: number;
}
