import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Audit, AuditDocument } from './schemas/audit.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(Audit.name) private readonly auditModel: Model<AuditDocument>,
  ) {}

  async logCreate(recordId: string, lotId: string, userId: string) {
    return this.auditModel.create({
      action: 'CREATE',
      recordId: new Types.ObjectId(recordId),
      lotId: new Types.ObjectId(lotId),
      userId,
    });
  }

  async logDelete(recordId: string, lotId: string, userId: string) {
    return this.auditModel.create({
      action: 'DELETE',
      recordId: new Types.ObjectId(recordId),
      lotId: new Types.ObjectId(lotId),
      userId,
    });
  }

  async logUpdate(
    recordId: string,
    lotId: string,
    userId: string,
    before: any,
    after: any,
  ) {
    const changes: {
      field: string;
      before: any;
      after: any;
    }[] = [];

    for (const key of Object.keys(after)) {
      if (before[key] !== after[key]) {
        changes.push({
          field: key,
          before: before[key],
          after: after[key],
        });
      }
    }

    return this.auditModel.create({
      action: 'UPDATE',
      recordId: new Types.ObjectId(recordId),
      lotId: new Types.ObjectId(lotId),
      userId,
      changes,
    });
  }

  async closeDay(lotId: string, day: Date, userId: string) {
    return this.auditModel.create({
      action: 'CLOSE_DAY',
      lotId: new Types.ObjectId(lotId),
      userId,
      meta: {
        day,
        closedAt: new Date(),
      },
    });
  }

  async reopenDay(
    lotId: string,
    day: Date,
    userId: string,
    reason: string,
  ) {
    return this.auditModel.create({
      action: 'REOPEN_DAY',
      lotId: new Types.ObjectId(lotId),
      userId,
      meta: {
        day,
        reason,
        reopenedAt: new Date(),
      },
    });
  }

  async listByLot(lotId: string) {
    return this.auditModel.find({
      lotId: new Types.ObjectId(lotId),
    });
  }

  async listByRecord(recordId: string) {
    return this.auditModel.find({
      recordId: new Types.ObjectId(recordId),
    });
  }

  // Nuevo método: comprueba si existe un registro CLOSE_DAY para el lote y día proporcionados
  async isDayClosed(lotId: string, day: Date): Promise<boolean> {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    // Buscamos un CLOSE_DAY cuyo meta.day coincida con dayStart (se guardó así en closeDay)
    const found = await this.auditModel.findOne({
      action: 'CLOSE_DAY',
      lotId: new Types.ObjectId(lotId),
      'meta.day': dayStart,
    }).lean().exec();

    return !!found;
  }

  formatAudit(audit: AuditDocument) {
    return {
      id: audit._id,
      action: audit.action,
      userId: audit.userId,
      createdAt: (audit as any).createdAt,
      changes: (audit as any).changes || [],
      meta: audit.meta,
    };
  }
}

