import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecordDocument = RecordEntry & Document;

@Schema({ timestamps: true })
export class RecordEntry {
  @Prop({ required: true })
  orderNumber: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  kilograms: number;

  @Prop()
  bolsonNumber?: number;

  @Prop()
  loteNumber?: string;

  @Prop()
  truckPlate?: string;

  @Prop()
  truckDriver?: string;

  @Prop()
  tolvero?: string;

  @Prop()
  controller?: string;

  @Prop()
  cereal?: string;

  @Prop({ required: true })
  lotId: Types.ObjectId;

  @Prop({ default: 'system' })
  createdBy: string;
}

export const RecordSchema = SchemaFactory.createForClass(RecordEntry);
