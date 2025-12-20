import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Audit, AuditDocument, ChangeDetector } from './schemas/audit.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(Audit.name) private readonly auditModel: Model<AuditDocument>,
  ) {}

  // Helper privado para normalizar fechas y evitar errores de zona horaria
  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async createEntry(data: Partial<Audit>) {
    return this.auditModel.create(data);
  }

  async logUpdate(params: { recordId: string, lotId: string, userId: string, before: any, after: any }) {
    // Usamos el ChangeDetector para cumplir con el principio de responsabilidad única
    const changes = ChangeDetector.compare(params.before, params.after);

    if (changes.length === 0) return null;

    return this.createEntry({
      action: 'UPDATE',
      recordId: new Types.ObjectId(params.recordId),
      lotId: new Types.ObjectId(params.lotId),
      userId: params.userId,
      changes,
    });
  }

  async closeDay(lotId: string, day: Date, userId: string) {
    return this.createEntry({
      action: 'CLOSE_DAY',
      lotId: new Types.ObjectId(lotId),
      userId,
      meta: { 
        day: this.getStartOfDay(day), // Normalizado
        event: 'Cierre de jornada' 
      },
    });
  }

  async reopenDay(lotId: string, day: Date, userId: string, reason: string) {
    return this.createEntry({
      action: 'REOPEN_DAY',
      lotId: new Types.ObjectId(lotId),
      userId,
      meta: { 
        day: this.getStartOfDay(day), // Normalizado
        reason, 
        event: 'Reapertura de jornada' 
      },
    });
  }

  async isDayClosed(lotId: string, day: Date): Promise<boolean> {
    const dayStart = this.getStartOfDay(day);
    
    // Buscamos el último evento de este día específico
    const lastEvent = await this.auditModel.findOne({
      lotId: new Types.ObjectId(lotId),
      action: { $in: ['CLOSE_DAY', 'REOPEN_DAY'] },
      'meta.day': dayStart,
    })
    .sort({ createdAt: -1 }) // Importante: traer el más nuevo
    .exec();

    return lastEvent?.action === 'CLOSE_DAY';
  }

  async getHistoryByLot(lotId: string) {
    return this.auditModel
      .find({ lotId: new Types.ObjectId(lotId) })
      .sort({ createdAt: -1 }) // Lo más reciente arriba
      .exec();
  }
}