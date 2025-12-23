import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLotDto {
  @ApiProperty({
    example: 'Lote Norte 01',
    description: 'Nombre descriptivo del lote',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Maíz',
    description: 'Tipo de cereal del lote',
  })
  @IsString()
  @IsNotEmpty()
  cereal: string;

  @ApiProperty({
    example: '2025-01-01',
    required: false,
    description: 'Fecha de inicio del lote (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
