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

  // ============ ASIGNAR LOTE ACTIVO ============
  async assignActiveLot(lotCode: string) {
    const lot = await this.lotsService.setActiveLot(lotCode);
    if (!lot) {
      throw new HttpException('Código de lote inválido', HttpStatus.BAD_REQUEST);
    }
    return {
      message: 'Lote habilitado correctamente',
      lotId: lot._id,
      code: lot.code,
    };
  }

  // ============ CREATE ============
  async create(dto: CreateRecordDto) {
    if (!dto.loteNumber) {
      throw new HttpException('Código de lote es requerido', HttpStatus.BAD_REQUEST);
    }

    const lot = await this.lotsService.findByCode(dto.loteNumber);
    if (!lot) {
      throw new HttpException('Código de lote inválido o inactivo', HttpStatus.BAD_REQUEST);
    }

    const date = new Date(dto.date);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const closed = await this.auditService.isDayClosed(lot._id.toString(), dayStart);
    if (closed) {
      throw new HttpException('Día ya finalizado', HttpStatus.BAD_REQUEST);
    }

    const last = await this.recordModel
      .findOne({ lotId: lot._id })
      .sort({ orderNumber: -1 })
      .exec();

    const nextOrderNumber = last ? last.orderNumber + 1 : 1;

    const rec = new this.recordModel({
      ...dto,
      date,
      orderNumber: nextOrderNumber,
      lotId: lot._id,
      loteNumber: lot.code,
    });

    return rec.save();
  }

  // ============ UPDATE ============
  async update(id: string, dto: any) {
    const existing = await this.recordModel.findById(id);
    if (!existing) throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);

    const dayStart = new Date(existing.date.getFullYear(), existing.date.getMonth(), existing.date.getDate());
    const closed = await this.auditService.isDayClosed(existing.lotId.toString(), dayStart);
    if (closed) throw new HttpException('Día ya finalizado', HttpStatus.BAD_REQUEST);

    // Campos protegidos
    delete dto.lotId;
    delete dto.loteNumber;
    delete dto.orderNumber;

    Object.assign(existing, dto);
    return existing.save();
  }

  // ============ DELETE ============
  async delete(id: string) {
    const existing = await this.recordModel.findById(id);
    if (!existing) throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);

    const dayStart = new Date(existing.date.getFullYear(), existing.date.getMonth(), existing.date.getDate());
    const closed = await this.auditService.isDayClosed(existing.lotId.toString(), dayStart);
    if (closed) throw new HttpException('Día ya finalizado', HttpStatus.BAD_REQUEST);

    await this.recordModel.deleteOne({ _id: id });
    return { message: 'Orden eliminada correctamente' };
  }

  // ============ LIST ============
  async listByLot(lotId: string) {
    return this.recordModel.find({ lotId: new Types.ObjectId(lotId) }).sort({ orderNumber: 1 }).exec();
  }

  async listByLotAndDay(lotId: string, date: Date) {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return this.recordModel
      .find({ lotId: new Types.ObjectId(lotId), date: { $gte: dayStart, $lt: dayEnd } })
      .exec();
  }

  // ============ SEARCH ============
  async search(filters: {
    lotId?: string;
    orderNumber?: number;
    dateFrom?: Date;
    dateTo?: Date;
    truckPlate?: string;
    truckDriver?: string;
    cereal?: string;
  }) {
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
    if (!records || records.length === 0) {
      throw new HttpException('No hay registros para este lote', HttpStatus.NOT_FOUND);
    }
    return records;
  }

  async exportByLotAndDay(lotId: string, date: Date) {
    const records = await this.listByLotAndDay(lotId, date);
    if (!records || records.length === 0) {
      throw new HttpException('No hay registros para este lote y fecha', HttpStatus.NOT_FOUND);
    }
    return records;
  }
}
