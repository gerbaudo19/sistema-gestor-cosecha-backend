import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RecordEntry, RecordDocument } from './schemas/record.schema';
import { Model, Types } from 'mongoose';
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

  /**
   * Valida si un día está cerrado para un lote específico.
   */
  private async validateDayNotClosed(lotId: string, date: Date): Promise<void> {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const isClosed = await this.auditService.isDayClosed(lotId, dayStart);
    if (isClosed) {
      throw new HttpException('Operación no permitida: El día ya se encuentra finalizado', HttpStatus.BAD_REQUEST);
    }
  }

  // ============ ASIGNAR LOTE ACTIVO ============
  async assignActiveLot(lotCode: string) {
    const lot = await this.lotsService.setActiveLot(lotCode);
    if (!lot) throw new HttpException('Código de lote inválido', HttpStatus.BAD_REQUEST);
    
    return {
      message: 'Lote habilitado correctamente',
      lotId: lot._id,
      code: lot.code,
    };
  }

  // ============ CREATE ============
  async create(dto: CreateRecordDto, userId: string = 'public_user') {
    if (!dto.loteNumber) throw new HttpException('Código de lote es requerido', HttpStatus.BAD_REQUEST);

    const lot = await this.lotsService.findByCode(dto.loteNumber);
    if (!lot) throw new HttpException('Código de lote inválido o inactivo', HttpStatus.BAD_REQUEST);

    const recordDate = new Date(dto.date);
    await this.validateDayNotClosed(lot._id.toString(), recordDate);

    const last = await this.recordModel.findOne({ lotId: lot._id }).sort({ orderNumber: -1 }).exec();
    const nextOrderNumber = last ? last.orderNumber + 1 : 1;

    const newRecord = new this.recordModel({
      ...dto,
      date: recordDate,
      orderNumber: nextOrderNumber,
      lotId: lot._id,
      loteNumber: lot.code,
      createdBy: userId,
    });

    const saved = await newRecord.save();

    await this.auditService.createEntry({
      action: 'CREATE',
      recordId: saved._id as Types.ObjectId,
      lotId: lot._id as Types.ObjectId,
      userId,
      meta: { orderNumber: nextOrderNumber }
    });

    return saved;
  }

  // ============ UPDATE ============
  async update(id: string, dto: any, userId: string = 'system') {
    const existing = await this.recordModel.findById(id);
    if (!existing) throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);

    await this.validateDayNotClosed(existing.lotId.toString(), existing.date);

    const stateBefore = existing.toObject();
    const { lotId, loteNumber, orderNumber, ...updateData } = dto;
    
    Object.assign(existing, updateData);
    const updated = await existing.save();

    await this.auditService.logUpdate({
      recordId: id,
      lotId: existing.lotId.toString(),
      userId,
      before: stateBefore,
      after: updateData, 
    });

    return updated;
  }

  // ============ DELETE ============
  async delete(id: string, userId: string = 'system') {
    const existing = await this.recordModel.findById(id);
    if (!existing) throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);

    await this.validateDayNotClosed(existing.lotId.toString(), existing.date);

    const lotIdSnapshot = existing.lotId;
    await this.recordModel.deleteOne({ _id: id });

    await this.auditService.createEntry({
      action: 'DELETE',
      recordId: new Types.ObjectId(id),
      lotId: lotIdSnapshot,
      userId,
      meta: { deletedRecord: existing.orderNumber }
    });

    return { message: 'Orden eliminada correctamente' };
  }

  // ============ LIST & SEARCH ============
  
  async listByLot(lotId: string) {
    return this.recordModel.find({ lotId: new Types.ObjectId(lotId) }).sort({ orderNumber: 1 }).exec();
  }

  async listByLotAndDay(lotId: string, date: Date) {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    return this.recordModel
      .find({ lotId: new Types.ObjectId(lotId), date: { $gte: dayStart, $lt: dayEnd } })
      .sort({ orderNumber: 1 })
      .exec();
  }

  async search(filters: any) {
    const query: any = {};
    if (filters.lotId) query.lotId = new Types.ObjectId(filters.lotId);
    if (filters.orderNumber) query.orderNumber = filters.orderNumber;
    if (filters.truckPlate) query.truckPlate = { $regex: filters.truckPlate, $options: 'i' };
    if (filters.truckDriver) query.truckDriver = { $regex: filters.truckDriver, $options: 'i' };
    if (filters.cereal) query.cereal = { $regex: filters.cereal, $options: 'i' };
    
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = filters.dateFrom;
      if (filters.dateTo) query.date.$lte = filters.dateTo;
    }
    
    return this.recordModel.find(query).sort({ date: -1, orderNumber: -1 }).exec();
  }

  // ============ EXPORT ============
  async exportByLot(lotId: string) {
    const records = await this.listByLot(lotId);
    if (!records.length) throw new HttpException('No hay registros', HttpStatus.NOT_FOUND);
    return records;
  }

  async exportByLotAndDay(lotId: string, date: Date) {
    const records = await this.listByLotAndDay(lotId, date);
    if (!records.length) throw new HttpException('No hay registros', HttpStatus.NOT_FOUND);
    return records;
  }
}