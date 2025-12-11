import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Lot, LotDocument } from './schemas/lot.schema';
import { Model } from 'mongoose';
import { CreateLotDto } from './dto/create-lot.dto';
import { generateCode } from '../utils/generateCode';
import { UpdateLotDto } from './dto/update-lot.dto';

@Injectable()
export class LotsService {
  constructor(@InjectModel(Lot.name) private lotModel: Model<LotDocument>) {}

  // =======================
  // LOTE ACTIVO EN MEMORIA
  // =======================
  private activeLotCode: string | null = null;

  async setActiveLot(code: string) {
    // Desactivar todos
    await this.lotModel.updateMany({}, { active: false });

    // Buscar el lote por código
    const lot = await this.lotModel.findOneAndUpdate(
      { code },
      { active: true },
      { new: true },
    );

    if (!lot) {
      throw new Error('Lote no encontrado');
    }

    return lot;
  }

  async getActiveLot() {
    if (!this.activeLotCode) return null;
    return this.findByCode(this.activeLotCode);
  }

  // =======================
  // CRUD
  // =======================
  async create(dto: CreateLotDto) {
    const code = generateCode();
    const lot = new this.lotModel({ ...dto, code, active: true });
    return lot.save();
  }

  async update(id: string, dto: UpdateLotDto) {
    return this.lotModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deactivate(id: string) {
    return this.lotModel.findByIdAndUpdate(id, { active: false }, { new: true });
  }

  async restore(id: string) {
    return this.lotModel.findByIdAndUpdate(id, { active: true }, { new: true });
  }

  // =======================
  // BUSCAR POR CÓDIGO
  // =======================
  async findByCode(code: string) {
    return this.lotModel.findOne({ code, active: true }).exec();
  }

  // =======================
  // SEARCH
  // =======================
  async search(filters: {
    code?: string;
    name?: string;
    cereal?: string;
    page: number;
    limit: number;
    sortBy: string;
    order: 'asc' | 'desc';
    showDeleted: boolean;
  }) {
    const query: any = {};

    if (!filters.showDeleted) {
      query.active = true;
    }

    if (filters.code) {
      query.code = filters.code;
    }

    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }

    if (filters.cereal) {
      query.cereal = { $regex: filters.cereal, $options: 'i' };
    }

    const skip = (filters.page - 1) * filters.limit;
    const sortOrder = filters.order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.lotModel
        .find(query)
        .sort({ [filters.sortBy]: sortOrder })
        .skip(skip)
        .limit(filters.limit)
        .exec(),

      this.lotModel.countDocuments(query),
    ]);

    return {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
      data,
    };
  }

  
}
