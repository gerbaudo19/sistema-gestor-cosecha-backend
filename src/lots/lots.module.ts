import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lot, LotSchema } from './schemas/lot.schema';
import { LotsService } from './lots.service';
import { LotsController } from './lots.controller';


@Module({
  imports: [MongooseModule.forFeature([{ name: Lot.name, schema: LotSchema }])],
  providers: [LotsService],
  controllers: [LotsController],
  exports: [LotsService],
})
export class LotsModule {}
