import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Lot, LotDocument } from './schemas/lot.schema';
import { Model } from 'mongoose';
import { CreateLotDto } from './dto/create-lot.dto';
import { generateCode } from '../utils/generateCode';

@Injectable()
export class LotsService {
  constructor(@InjectModel(Lot.name) private lotModel: Model<LotDocument>) {}

  async create(dto: CreateLotDto) {
    const code = generateCode();
    const lot = new this.lotModel({ ...dto, code, active: true });
    return lot.save();
  }

  async findByCode(code: string) {
    return this.lotModel.findOne({ code, active: true }).exec();
  }

  async findById(id: string) {
    return this.lotModel.findById(id).exec();
  }

  async deactivate(id: string) {
    return this.lotModel.findByIdAndUpdate(id, { active: false }, { new: true });
  }

  async listAll() {
    return this.lotModel.find().exec();
  }
}
