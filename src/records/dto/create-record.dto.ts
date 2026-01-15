import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecordDto {
  @ApiProperty({
    example: '2025-01-10',
    description: 'Fecha del registro (ISO 8601)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 24500,
    description: 'Cantidad de kilogramos',
  })
  @IsNumber()
  kilograms: number;

  @ApiProperty({
    example: 12,
    required: false,
    description: 'Número de bolsón',
  })
  @IsOptional()
  @IsNumber()
  bolsonNumber?: number;

  @ApiProperty({
    example: 'L-2025-01',
    description: 'Número o código de lote',
  })
  @IsOptional()
  @IsString()
  loteNumber?: string;

  @ApiProperty({
    example: 'AA123BB',
    required: false,
    description: 'Patente del camión',
  })
  @IsOptional()
  @IsString()
  truckPlate?: string;

  @ApiProperty({
    example: 'Juan Pérez',
    required: false,
    description: 'Nombre del chofer',
  })
  @IsOptional()
  @IsString()
  truckDriver?: string;

  @ApiProperty({
    example: 'Tolva 1',
    required: false,
    description: 'Operario de tolva',
  })
  @IsOptional()
  @IsString()
  tolvero?: string;

  @ApiProperty({
    example: 'Controlador A',
    required: false,
    description: 'Controlador responsable',
  })
  @IsOptional()
  @IsString()
  controller?: string;

  @ApiProperty({
    example: 'Maíz',
    required: false,
    description: 'Tipo de cereal',
  })
  @IsOptional()
  @IsString()
  cereal?: string;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Número de orden (opcional, se autogenera si no se envía)',
  })
  @IsOptional()
  @IsNumber()
  orderNumber?: number;
}
