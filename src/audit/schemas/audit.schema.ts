import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditDocument = Audit & Document;

@Schema({ timestamps: true })
export class Audit {
  @Prop()
  action: string;

  @Prop({ type: Types.ObjectId })
  recordId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  lotId?: Types.ObjectId;

  @Prop()
  field?: string;

  @Prop({ type: Array })
  changes?: {
    field: string;
    before: any;
    after: any;
  }[];

  @Prop()
  userId?: string;

  @Prop({ type: Object })
  meta?: any;
}

export const AuditSchema = SchemaFactory.createForClass(Audit);

