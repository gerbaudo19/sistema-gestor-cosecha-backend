import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';

@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Post()
  create(@Body() dto: CreateLotDto) {
    return this.lotsService.create(dto);
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.lotsService.findByCode(code);
  }

  @Get()
  list() {
    return this.lotsService.listAll();
  }
}
