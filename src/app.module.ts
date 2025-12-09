import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LotsModule } from './lots/lots.module';
import { RecordsModule } from './records/records.module';
import { AuditModule } from './audit/audit.module';
import { ExportService } from './export/export.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gestorDB'),
    UsersModule,
    AuthModule,
    LotsModule,
    RecordsModule,
    AuditModule,
  ],
  providers: [ExportService],
})
export class AppModule {}


