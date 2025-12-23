import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';

import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { AuditService } from '../audit/audit.service';
import { ExportService } from '../export/export.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LotAuthGuard } from '../auth-lote/lot-auth.guard';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Records')
@Controller('records')
export class RecordsController {
  constructor(
    private readonly recordsService: RecordsService,
    private readonly auditService: AuditService,
    private readonly exportService: ExportService,
  ) {}

  // ================== AUDITORÍA (ADMIN) ==================
  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Historial de auditoría de un lote' })
  @Get('lot/:lotId/history')
  getHistory(@Param('lotId') lotId: string) {
    return this.auditService.getHistoryByLot(lotId);
  }

  // ================== CREATE (OPERARIO) ==================
  @ApiSecurity('lot-token')
  @UseGuards(LotAuthGuard)
  @ApiOperation({ summary: 'Crear orden de carga para el lote activo' })
  @ApiResponse({ status: 201, description: 'Orden creada correctamente' })
  @ApiResponse({ status: 401, description: 'Token de lote inválido o inexistente' })
  @Post()
  create(@Body() dto: CreateRecordDto, @Request() req) {
    return this.recordsService.create(dto, req.lot.lotId);
  }

  // ================== UPDATE (OPERARIO) ==================
  @ApiSecurity('lot-token')
  @UseGuards(LotAuthGuard)
  @ApiOperation({ summary: 'Actualizar una orden del lote activo' })
  @ApiResponse({ status: 200, description: 'Orden actualizada correctamente' })
  @ApiResponse({ status: 403, description: 'La orden no pertenece al lote activo' })
  @ApiBody({ type: CreateRecordDto }) // <-- esto hace que Swagger muestre todos los campos
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateRecordDto, // antes estaba any
    @Request() req,
  ) {
    return this.recordsService.update(id, dto, req.lot.lotId);
  }


  // ================== DELETE (ADMIN) ==================
  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar una orden (admin)' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.recordsService.delete(id, req.user.userId);
  }

  // ================== LISTADOS (OPERARIO) ==================
  @ApiSecurity('lot-token')
  @UseGuards(LotAuthGuard)
  @ApiOperation({ summary: 'Listar órdenes del lote activo' })
  @Get('lot')
  listMyLot(@Request() req) {
    return this.recordsService.listByLot(req.lot.lotId);
  }

  @ApiSecurity('lot-token')
  @UseGuards(LotAuthGuard)
  @ApiOperation({ summary: 'Listar órdenes del lote activo por día' })
  @Get('lot/day')
  listMyLotByDay(
    @Request() req,
    @Query('date') date: string,
  ) {
    return this.recordsService.listByLotAndDay(
      req.lot.lotId,
      new Date(date),
    );
  }

  // ================== SEARCH (OPERARIO) ==================
  @ApiSecurity('lot-token')
  @UseGuards(LotAuthGuard)
  @ApiOperation({ summary: 'Buscar órdenes dentro del lote activo' })
  @Get('search')
  search(@Query() filters: any, @Request() req) {
    return this.recordsService.search({
      ...filters,
      lotId: req.lot.lotId, // 🔐 forzado desde el token
      orderNumber: filters.orderNumber
        ? Number(filters.orderNumber)
        : undefined,
      dateFrom: filters.dateFrom
        ? new Date(filters.dateFrom)
        : undefined,
      dateTo: filters.dateTo
        ? new Date(filters.dateTo)
        : undefined,
    });
  }

  // ================== EXPORT (ADMIN) ==================
  @ApiBearerAuth('user-jwt')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Exportar órdenes de un lote a Excel' })
  @Get('export/lot/:lotId')
  async exportLot(@Param('lotId') lotId: string, @Res() res: Response) {
    const records = await this.recordsService.exportByLot(lotId);

    const buffer = await this.exportService.exportRecordsToExcel(
      records,
      `lot_${lotId}.xlsx`,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lot_${lotId}.xlsx"`,
    );

    return res.send(buffer);
  }
}
