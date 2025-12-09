import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordEntry, RecordSchema } from './schemas/record.schema';
import { LotsModule } from '../lots/lots.module';
import { AuditModule } from '../audit/audit.module';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { ExportService } from '../export/export.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RecordEntry.name, schema: RecordSchema }]),
    LotsModule,
    AuditModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService, ExportService],
  exports: [RecordsService],
})
export class RecordsModule {}
