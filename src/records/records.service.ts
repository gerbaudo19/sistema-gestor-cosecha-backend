import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RecordEntry, RecordDocument } from './schemas/record.schema';
import { Model, Types } from 'mongoose';
import { CreateRecordDto } from './dto/create-record.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RecordsService {
  constructor(
    @InjectModel(RecordEntry.name)
    private readonly recordModel: Model<RecordDocument>,
    private readonly auditService: AuditService,
  ) {}

  // ================== VALIDACIONES ==================
  private async validateDayNotClosed(lotId: string, date: Date): Promise<void> {
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    const isClosed = await this.auditService.isDayClosed(lotId, dayStart);

    if (isClosed) {
      throw new HttpException(
        'Operación no permitida: el día está cerrado',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== CREATE ==================
  async create(dto: CreateRecordDto, lotId: string) {
    const recordDate = new Date(dto.date);

    await this.validateDayNotClosed(lotId, recordDate);

    // Determine orderNumber
    let orderNumber: number;
    if (dto.orderNumber !== undefined) {
      // If client supplied a number, ensure it's unique within the lot
      const existing = await this.recordModel.findOne({
        lotId,
        orderNumber: dto.orderNumber,
      });
      if (existing) {
        throw new HttpException(
          `El número de orden ${dto.orderNumber} ya existe en este lote`,
          HttpStatus.BAD_REQUEST,
        );
      }
      orderNumber = dto.orderNumber;
    } else {
      const lastRecord = await this.recordModel
        .findOne({ lotId })
        .sort({ orderNumber: -1 });

      orderNumber = lastRecord ? lastRecord.orderNumber + 1 : 1;
    }

    const record = new this.recordModel({
      ...dto,
      date: recordDate,
      orderNumber,
      lotId: new Types.ObjectId(lotId),
      createdBy: 'lot_operator',
    });

    const saved = await record.save();

    await this.auditService.createEntry({
      action: 'CREATE',
      recordId: saved._id,
      lotId: new Types.ObjectId(lotId),
      userId: 'lot_operator',
      meta: { orderNumber },
    });

    return saved;
  }

  // ================== UPDATE ==================
  async update(id: string, dto: any, lotId: string) {
    const existing = await this.recordModel.findById(id);

    if (!existing) {
      throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);
    }

    if (existing.lotId.toString() !== lotId) {
      throw new HttpException(
        'La orden no pertenece al lote activo',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.validateDayNotClosed(lotId, existing.date);

    const stateBefore = existing.toObject();

    const { lotId: _, orderNumber: newOrderNumber, ...updateData } = dto;

    // If orderNumber is being updated, check uniqueness
    if (newOrderNumber !== undefined && newOrderNumber !== existing.orderNumber) {
      const duplicate = await this.recordModel.findOne({
        lotId,
        orderNumber: newOrderNumber,
        _id: { $ne: id },
      });
      if (duplicate) {
        throw new HttpException(
          `El número de orden ${newOrderNumber} ya existe en este lote`,
          HttpStatus.BAD_REQUEST,
        );
      }
      existing.orderNumber = newOrderNumber;
    }

    Object.assign(existing, updateData);

    const updated = await existing.save();

    await this.auditService.logUpdate({
      recordId: id,
      lotId,
      userId: 'lot_operator',
      before: stateBefore,
      after: updateData,
    });

    return updated;
  }

  // ================== DELETE (ADMIN) ==================
  async delete(id: string, userId: string) {
    const existing = await this.recordModel.findById(id);

    if (!existing) {
      throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.validateDayNotClosed(
      existing.lotId.toString(),
      existing.date,
    );

    await this.recordModel.deleteOne({ _id: id });

    await this.auditService.createEntry({
      action: 'DELETE',
      recordId: new Types.ObjectId(id),
      lotId: existing.lotId,
      userId,
      meta: { orderNumber: existing.orderNumber },
    });

    return { message: 'Orden eliminada correctamente' };
  }

  // ================== LISTADOS ==================
  async listByLot(lotId: string) {
    return this.recordModel
      .find({ lotId: new Types.ObjectId(lotId) })
      .sort({ orderNumber: 1 })
      .exec();
  }

  async listByLotAndDay(lotId: string, date: Date) {
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const dayEnd = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );

    return this.recordModel
      .find({
        lotId: new Types.ObjectId(lotId),
        date: { $gte: dayStart, $lt: dayEnd },
      })
      .sort({ orderNumber: 1 })
      .exec();
  }

  // ================== SEARCH ==================
  async search(filters: any) {
    const query: any = {};

    if (filters.lotId)
      query.lotId = new Types.ObjectId(filters.lotId);

    if (filters.orderNumber)
      query.orderNumber = filters.orderNumber;

    if (filters.truckPlate)
      query.truckPlate = {
        $regex: filters.truckPlate,
        $options: 'i',
      };

    if (filters.truckDriver)
      query.truckDriver = {
        $regex: filters.truckDriver,
        $options: 'i',
      };

    if (filters.cereal)
      query.cereal = {
        $regex: filters.cereal,
        $options: 'i',
      };

    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = filters.dateFrom;
      if (filters.dateTo) query.date.$lte = filters.dateTo;
    }

    return this.recordModel
      .find(query)
      .sort({ date: -1, orderNumber: -1 })
      .exec();
  }

  // ================== EXPORT ==================
  async exportByLot(lotId: string) {
    const records = await this.listByLot(lotId);

    if (!records.length) {
      throw new HttpException('No hay registros', HttpStatus.NOT_FOUND);
    }

    return records;
  }
}
