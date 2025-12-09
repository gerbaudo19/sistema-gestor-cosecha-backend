import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RecordEntry, RecordDocument } from './schemas/record.schema';
import { Model } from 'mongoose';
import { CreateRecordDto } from './dto/create-record.dto';
import { LotsService } from '../lots/lots.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RecordsService {
  constructor(
    @InjectModel(RecordEntry.name) private recordModel: Model<RecordDocument>,
    private lotsService: LotsService,
    private auditService: AuditService,
  ) {}

  // crear registro usando code del lote
  async create(dto: CreateRecordDto, userId: string) {
    const lot = await this.lotsService.findByCode(dto.lotCode);
    if (!lot) throw new HttpException('Código de lote inválido', HttpStatus.BAD_REQUEST);

    // Verificar si la fecha está cerrada: para simplificar, se usa colección audit para "cierres"
    const date = new Date(dto.date);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    // revisaremos mediante auditService si el día está cerrado (implementado en audit)
    const closed = await this.auditService.isDayClosed(lot._id.toString(), dayStart);
    if (closed) throw new HttpException('Día ya finalizado', HttpStatus.BAD_REQUEST);

    const rec = new this.recordModel({
      ...dto,
      date,
      lotId: lot._id,
      createdBy: userId,
    });
    const saved = await rec.save();

    await this.auditService.logCreate(saved._id.toString(), saved.lotId.toString(), userId);
    return saved;
  }

  async update(id: string, dto: any, userId: string) {
    const existing = await this.recordModel.findById(id);
    if (!existing) throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);

    const dayStart = new Date(existing.date.getFullYear(), existing.date.getMonth(), existing.date.getDate());
    const closed = await this.auditService.isDayClosed(existing.lotId.toString(), dayStart);
    if (closed) throw new HttpException('Día ya finalizado', HttpStatus.BAD_REQUEST);

    const before = existing.toObject();
    Object.assign(existing, dto);
    const after = await existing.save();

    await this.auditService.logUpdate(after._id.toString(), after.lotId.toString(), userId, before, after);
    return after;
  }

  async listByLot(lotId: string) {
    return this.recordModel.find({ lotId }).sort({ date: 1, orderNumber: 1 }).exec();
  }

  async listByLotAndDay(lotId: string, date: Date) {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return this.recordModel.find({ lotId, date: { $gte: dayStart, $lt: dayEnd } }).exec();
  }

  async delete(id: string, userId: string) {
    const existing = await this.recordModel.findById(id);
    if (!existing) throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);

    const dayStart = new Date(existing.date.getFullYear(), existing.date.getMonth(), existing.date.getDate());
    const closed = await this.auditService.isDayClosed(existing.lotId.toString(), dayStart);
    if (closed) throw new HttpException('Día ya finalizado', HttpStatus.BAD_REQUEST);

    await this.auditService.logDelete(existing._id.toString(), existing.lotId.toString(), userId);
    return this.recordModel.findByIdAndDelete(id);
  }
}
