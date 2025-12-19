import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Se ejecuta al iniciar la app
  async ensureAdminUser() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios');
    }

    const exists = await this.userModel.findOne({ isAdmin: true });
    if (exists) return;

    const hashed = await bcrypt.hash(password, 10);

    await this.userModel.create({
      name: 'SYSTEM',
      email,
      password: hashed,
      isAdmin: true,
    });

    console.log('Usuario ADMIN creado');
  }

  // SOLO ADMIN CREA USUARIOS
  async createByAdmin(admin: UserDocument, dto: CreateUserDto) {
    if (!admin.isAdmin) {
      throw new HttpException('No autorizado', HttpStatus.FORBIDDEN);
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    return this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      isAdmin: false,
    });
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }
}
