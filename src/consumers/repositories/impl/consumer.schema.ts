import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CustomerLocation } from '../../../common/enums/customer-location.enum';

@Schema({ timestamps: true })
export class ConsumerDocument extends Document<string> {
  @Prop({ type: String }) declare _id: string;

  @Prop({ required: true }) email: string;
  @Prop({ required: true }) firstName: string;
  @Prop({ required: true }) lastName: string;
  @Prop({ required: true, type: String, enum: CustomerLocation })
  location: CustomerLocation;
  @Prop({ required: true }) address: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ConsumerSchema: MongooseSchema<ConsumerDocument> = SchemaFactory.createForClass(ConsumerDocument);
