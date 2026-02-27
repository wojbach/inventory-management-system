import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class OrderDocument extends Document<string> {
  @Prop({ type: String }) declare _id: string;

  @Prop({ required: true }) customerId: string;
  @Prop({
    required: true,
    type: [{ productId: { type: String, ref: 'ProductDocument' }, quantity: Number, price: Number }],
  })
  items: { productId: string | { _id: string; name: string }; quantity: number; price: number }[];

  @Prop({ required: true, min: 0 }) total: number;
  @Prop({ required: true, min: 0 }) originalTotal: number;
  @Prop({ required: true }) regionalAdjustment: number;
  @Prop({ required: true, min: 0 }) taxAmount: number;
  @Prop({ required: true, min: 0 }) taxRate: number;
  @Prop({ required: true }) discountApplied: string;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema: MongooseSchema<OrderDocument> = SchemaFactory.createForClass(OrderDocument);
