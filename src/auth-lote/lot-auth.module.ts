// src/auth-lote/lot-auth.module.ts
import { Module } from '@nestjs/common';
import { LotAuthController } from './lot-auth.controller';
import { LotAuthGuard } from './lot-auth.guard';
import { LotsModule } from '../lots/lots.module';

@Module({
  imports: [LotsModule],
  controllers: [LotAuthController],
  providers: [LotAuthGuard],
  exports: [LotAuthGuard],
})
export class LotAuthModule {}
