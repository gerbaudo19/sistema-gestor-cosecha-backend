import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as jwt from 'jsonwebtoken';

import { LotsService } from '../lots/lots.service';
import { LotLoginDto } from './dto/lot-login.dto';

@ApiTags('Lot Auth')
@Controller('lot-auth')
export class LotAuthController {
  constructor(private readonly lotsService: LotsService) {}

  @Post('login')
  @ApiOperation({ summary: 'Ingreso a un lote mediante código' })
  @ApiResponse({ status: 200, description: 'Acceso concedido al lote' })
  @ApiResponse({ status: 401, description: 'Código inválido o lote inactivo' })
  async login(@Body() dto: LotLoginDto) {
    const lot = await this.lotsService.findByCode(dto.code);

    if (!lot || !lot.active) {
      throw new UnauthorizedException('Código inválido o lote inactivo');
    }

    const token = jwt.sign(
      {
        lotId: lot._id.toString(),
        type: 'LOT',
      },
      process.env.LOT_SECRET!,
      { expiresIn: '12h' },
    );

    return {
      lotToken: token,
      lotId: lot._id,
      expiresIn: '12h',
    };
  }
}
