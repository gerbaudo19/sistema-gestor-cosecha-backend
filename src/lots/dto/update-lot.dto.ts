import { IsBoolean, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLotDto {
  @ApiProperty({
    example: 'Lote Norte Actualizado',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Soja',
    required: false,
  })
  @IsOptional()
  @IsString()
  cereal?: string;

  @ApiProperty({
    example: '2025-02-01',
    required: false,
    description: 'Nueva fecha de inicio del lote',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Indica si el lote está activo',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
