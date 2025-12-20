// src/records/records.controller.ts
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
  Request,
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

  // ============ AUDITORÍA / HISTORIAL ============

  @UseGuards(JwtAuthGuard)
  @Get('lot/:lotId/history')
  async getHistory(@Param('lotId') lotId: string) {
    // Este método devuelve todos los cambios, creaciones y cierres del lote
    return this.auditService.getHistoryByLot(lotId);
  }

  // ============ ACCIONES ADMIN ============

  @UseGuards(JwtAuthGuard)
  @Post('assign-lot')
  assignLot(@Body('lotCode') lotCode: string) {
    return this.recordsService.assignActiveLot(lotCode);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.recordsService.update(id, dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.recordsService.delete(id, req.user.userId);
  }

  // ============ PUBLICO / REGISTROS ============

  @Post()
  async create(@Body() dto: CreateRecordDto) {
    return this.recordsService.create(dto, 'public_user');
  }

  @Get('lot/:lotId')
  listByLot(@Param('lotId') lotId: string) {
    return this.recordsService.listByLot(lotId);
  }

  @Get('lot/:lotId/day')
  listByLotAndDay(@Param('lotId') lotId: string, @Query('date') date: string) {
    return this.recordsService.listByLotAndDay(lotId, new Date(date));
  }

  @Get('search')
  search(@Query() filters: any) {
    return this.recordsService.search({
      ...filters,
      orderNumber: filters.orderNumber ? Number(filters.orderNumber) : undefined,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    });
  }

  // ============ GESTIÓN DE JORNADA ============

  @UseGuards(JwtAuthGuard)
  @Post('close-day/:lotId')
  async closeDay(@Param('lotId') lotId: string, @Body('date') date: string, @Request() req) {
    await this.auditService.closeDay(lotId, new Date(date), req.user.userId);
    return { message: 'Día cerrado' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('reopen-day/:lotId')
  async reopenDay(@Param('lotId') lotId: string, @Body('date') date: string, @Body('reason') reason: string, @Request() req) {
    await this.auditService.reopenDay(lotId, new Date(date), req.user.userId, reason);
    return { message: 'Día reabierto' };
  }

  // ============ EXPORTS ============

  @UseGuards(JwtAuthGuard)
  @Get('export/lot/:lotId')
  async exportLot(@Param('lotId') lotId: string, @Res() res: Response) {
    const records = await this.recordsService.exportByLot(lotId);
    const buffer = await this.exportService.exportRecordsToExcel(records, `lot_${lotId}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="lot_${lotId}.xlsx"`);
    return res.send(buffer);
  }
}