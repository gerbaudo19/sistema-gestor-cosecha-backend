import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditDocument = Audit & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Audit {
  @Prop({ required: true })
  action: string; 

  @Prop({ type: Types.ObjectId, index: true })
  recordId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true, required: true })
  lotId: Types.ObjectId;

  @Prop({ type: Array, default: [] })
  changes?: { field: string; before: any; after: any }[];

  @Prop({ required: true })
  userId: string;

  @Prop({ type: Object })
  meta?: any;
}

export const AuditSchema = SchemaFactory.createForClass(Audit);

// SRP: Clase utilitaria para comparar objetos
export class ChangeDetector {
  static compare(before: any, after: any): { field: string; before: any; after: any }[] {
    const changes: { field: string; before: any; after: any }[] = [];
    const ignore = ['_id', '__v', 'updatedAt', 'createdAt', 'lotId', 'orderNumber'];

    for (const key in after) {
      if (ignore.includes(key)) continue;
      
      const valBefore = before[key];
      const valAfter = after[key];

      if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
        changes.push({ field: key, before: valBefore, after: valAfter });
      }
    }
    return changes;
  }
}