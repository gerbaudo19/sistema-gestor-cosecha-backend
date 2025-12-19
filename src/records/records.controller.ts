import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { AuditService } from '../audit/audit.service';
import { ExportService } from '../export/export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('records')
export class RecordsController {
  constructor(
    private readonly recordsService: RecordsService,
    private readonly auditService: AuditService,
    private readonly exportService: ExportService,
  ) {}

  // ===================== ADMIN / SISTEMA =====================

  // Asignar lote activo (solo usuario logueado)
  @UseGuards(JwtAuthGuard)
  @Post('assign-lot')
  assignLot(@Body('lotCode') lotCode: string) {
    return this.recordsService.assignActiveLot(lotCode);
  }

  // Update registro (solo usuario)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.recordsService.update(id, dto);
  }

  // Delete registro (solo usuario)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recordsService.delete(id);
  }

  // ===================== PUBLICO POR LOTE =====================

  // Crear registro (tolveros / controladores)
  @Post()
  async create(@Body() dto: CreateRecordDto) {
    return this.recordsService.create(dto);
  }

  // Listar registros por lote
  @Get('lot/:lotId')
  listByLot(@Param('lotId') lotId: string) {
    return this.recordsService.listByLot(lotId);
  }

  // Listar por lote y día
  @Get('lot/:lotId/day')
  listByLotAndDay(
    @Param('lotId') lotId: string,
    @Query('date') date: string,
  ) {
    return this.recordsService.listByLotAndDay(lotId, new Date(date));
  }

  // Búsqueda avanzada
  @Get('search')
  search(
    @Query('lotId') lotId?: string,
    @Query('orderNumber') orderNumber?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('truckPlate') truckPlate?: string,
    @Query('truckDriver') truckDriver?: string,
    @Query('cereal') cereal?: string,
  ) {
    return this.recordsService.search({
      lotId,
      orderNumber: orderNumber ? Number(orderNumber) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      truckPlate,
      truckDriver,
      cereal,
    });
  }

  // ===================== CIERRES (ADMIN) =====================

  @UseGuards(JwtAuthGuard)
  @Post('close-day/:lotId')
  async closeDay(
    @Param('lotId') lotId: string,
    @Body('date') dateStr: string,
  ) {
    const day = new Date(dateStr);

    await this.auditService.closeDay(lotId, day, 'system');

    const records = await this.recordsService.listByLotAndDay(lotId, day);

    return {
      message: 'Día cerrado',
      totalRecords: records.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reopen-day/:lotId')
  async reopenDay(
    @Param('lotId') lotId: string,
    @Body('date') dateStr: string,
    @Body('reason') reason: string,
  ) {
    const day = new Date(dateStr);

    await this.auditService.reopenDay(lotId, day, 'system', reason);

    return { message: 'Día reabierto' };
  }

  // ===================== EXPORTS (ADMIN) =====================

  @UseGuards(JwtAuthGuard)
  @Get('export/lot/:lotId')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportLot(
    @Param('lotId') lotId: string,
    @Res() res: Response,
  ) {
    const records = await this.recordsService.exportByLot(lotId);

    const buffer = await this.exportService.exportRecordsToExcel(
      records,
      `lot_${lotId}.xlsx`,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lot_${lotId}.xlsx"`,
    );

    return res.send(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Get('export/lot/:lotId/day')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportLotDay(
    @Param('lotId') lotId: string,
    @Query('date') date: string,
    @Res() res: Response,
  ) {
    const records = await this.recordsService.exportByLotAndDay(
      lotId,
      new Date(date),
    );

    const buffer = await this.exportService.exportRecordsToExcel(
      records,
      `lot_${lotId}_${date}.xlsx`,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lot_${lotId}_${date}.xlsx"`,
    );

    return res.send(buffer);
  }
}

