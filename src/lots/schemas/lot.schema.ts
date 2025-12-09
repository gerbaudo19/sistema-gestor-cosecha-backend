import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LotDocument = Lot & Document;

@Schema({ timestamps: true })
export class Lot {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  cereal: string;

  @Prop()
  startDate: Date;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ default: true })
  active: boolean;
}

export const LotSchema = SchemaFactory.createForClass(Lot);
