import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Delete,
  Patch,
} from '@nestjs/common';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth('user-jwt')
@ApiTags('Lots')
@UseGuards(JwtAuthGuard)
@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  // ===================== CREATE =====================
  @ApiResponse({ status: 201, description: 'Lot created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiOperation({ summary: 'Create a new lot' })
  @Post()
  create(@Body() dto: CreateLotDto) {
    return this.lotsService.create(dto);
  }

  // ===================== UPDATE =====================
  @ApiResponse({ status: 200, description: 'Lot updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Lot not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiOperation({ summary: 'Update an existing lot by ID' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLotDto) {
    return this.lotsService.update(id, dto);
  }

  // ===================== SOFT DELETE =====================
  @ApiResponse({ status: 200, description: 'Lot deactivated successfully.' })
  @ApiResponse({ status: 404, description: 'Lot not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiOperation({ summary: 'Deactivate (soft delete) a lot by ID' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.lotsService.deactivate(id);
  }

  // ===================== RESTORE =====================
  @ApiResponse({ status: 200, description: 'Lot restored successfully.' })
  @ApiResponse({ status: 404, description: 'Lot not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiOperation({ summary: 'Restore a deactivated lot by ID' })
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.lotsService.restore(id);
  }

  // NUEVO: Activar lote por código
  @ApiResponse({ status: 200, description: 'Lot activated successfully.' })
  @ApiResponse({ status: 404, description: 'Lot not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiOperation({ summary: 'Set a lot as active by its code' })
  @Post('set-active/:code')
  setActiveLot(@Param('code') code: string) {
    return this.lotsService.setActiveLot(code);
  }

  // ===================== LIST / SEARCH =====================
  @ApiResponse({ status: 200, description: 'Lots retrieved successfully.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiOperation({ summary: 'List and search lots with filters' })
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
