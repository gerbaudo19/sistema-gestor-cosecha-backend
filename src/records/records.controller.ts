import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { AuditService } from '../audit/audit.service';
import { ExportService } from '../export/export.service';



@Controller('records')
export class RecordsController {
  constructor(
    private readonly recordsService: RecordsService,
    private readonly auditService: AuditService,
    private readonly exportService: ExportService,
  ) {}

  // operario crea registro enviando lotCode
  @Post()
  async create(
    @Body() dto: CreateRecordDto,
    @Body('userId') userId: string,
  ) {
    return this.recordsService.create(dto, userId || 'anon');
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @Body('userId') userId: string,
  ) {
    return this.recordsService.update(id, dto, userId || 'anon');
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body('userId') userId: string) {
    return this.recordsService.delete(id, userId || 'anon');
  }

  @Get('lot/:lotId')
  listByLot(@Param('lotId') lotId: string) {
    return this.recordsService.listByLot(lotId);
  }

  @Get('lot/:lotId/day')
  listByLotAndDay(
    @Param('lotId') lotId: string,
    @Query('date') date: string,
  ) {
    return this.recordsService.listByLotAndDay(lotId, new Date(date));
  }

  // ===================== NUEVAS FUNCIONALIDADES =====================

  @Post('close-day/:lotId')
  async closeDay(
    @Param('lotId') lotId: string,
    @Body('date') dateStr: string,
    @Body('userId') userId: string,
  ) {
    const day = new Date(dateStr);

    // marcar cierre
    await this.auditService.closeDay(lotId, day, userId || 'admin');

    // generar excel automáticamente
    const records = await this.recordsService.listByLotAndDay(lotId, day);
    const buffer = await this.exportService.exportRecordsToExcel(
      records,
      `lot_${lotId}_day_${dateStr}.xlsx`,
    );

    // devolvemos el archivo en base64
    return {
      message: 'Día cerrado',
      file: buffer.toString('base64'),
    };
  }

  @Post('reopen-day/:lotId')
  async reopenDay(
    @Param('lotId') lotId: string,
    @Body('date') dateStr: string,
    @Body('userId') userId: string,
    @Body('reason') reason: string,
  ) {
    const day = new Date(dateStr);
    await this.auditService.reopenDay(
      lotId,
      day,
      userId || 'admin',
      reason,
    );

    return { message: 'Día reabierto' };
  }

  @Get('export/lot/:lotId')
  async exportLot(@Param('lotId') lotId: string) {
    const records = await this.recordsService.listByLot(lotId);
    const buffer =
      await this.exportService.exportRecordsToExcel(
        records,
        `lot_${lotId}.xlsx`,
      );

    return { file: buffer.toString('base64') };
  }

  @Get('export/lot/:lotId/day')
  async exportLotDay(
    @Param('lotId') lotId: string,
    @Query('date') date: string,
  ) {
    const records =
      await this.recordsService.listByLotAndDay(
        lotId,
        new Date(date),
      );

    const buffer =
      await this.exportService.exportRecordsToExcel(
        records,
        `lot_${lotId}_${date}.xlsx`,
      );

    return { file: buffer.toString('base64') };
  }
}
