import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LotsModule } from './lots/lots.module';
import { RecordsModule } from './records/records.module';
import { AuditModule } from './audit/audit.module';
import { ExportService } from './export/export.service';

@Module({
  imports: [
    // CARGA .env GLOBAL (OBLIGATORIO)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Mongo
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gestorDB',
    ),

    // Módulos
    UsersModule,
    AuthModule,
    LotsModule,
    RecordsModule,
    AuditModule,
  ],
  providers: [ExportService],
})
export class AppModule {}



