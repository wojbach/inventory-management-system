import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ProductCategory } from '../../enums/product-category.enum';

@Schema({ timestamps: true })
export class ProductDocument extends Document<string> {
  @Prop({ type: String }) declare _id: string;

  @Prop({ required: true, maxlength: 50 }) name: string;
  @Prop({ required: true, maxlength: 50 }) description: string;
  @Prop({ required: true, min: 0.01, max: 1_000_000 }) price: number;
  @Prop({ required: true, min: 0, max: 1_000_000, default: 0 }) stock: number;
  @Prop({ required: true, type: String, enum: ProductCategory })
  category: ProductCategory;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema: MongooseSchema<ProductDocument> = SchemaFactory.createForClass(ProductDocument);
