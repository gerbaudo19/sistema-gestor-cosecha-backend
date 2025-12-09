import { Body, Controller, Get, Param, Post, Put, Query, Delete, Patch } from '@nestjs/common';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';

@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Post()
  create(@Body() dto: CreateLotDto) {
    return this.lotsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLotDto) {
    return this.lotsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.lotsService.deactivate(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.lotsService.restore(id);
  }

  @Get()
  list(
    @Query('code') code?: string,
    @Query('name') name?: string,
    @Query('cereal') cereal?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('sortBy') sortBy = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('showDeleted') showDeleted = 'false',
  ) {
    return this.lotsService.search({
      code,
      name,
      cereal,
      page: Number(page),
      limit: Number(limit),
      sortBy,
      order,
      showDeleted: showDeleted === 'true',
    });
  }
}
