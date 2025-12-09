import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRecordDto {
  @IsNumber()
  orderNumber: number;

  @IsDateString()
  date: string;

  @IsNumber()
  kilograms: number;

  @IsOptional()
  @IsNumber()
  bolsonNumber?: number;

  @IsOptional()
  @IsString()
  loteNumber?: string;

  @IsOptional()
  @IsString()
  truckPlate?: string;

  @IsOptional()
  @IsString()
  truckDriver?: string;

  @IsOptional()
  @IsString()
  tolvero?: string;

  @IsOptional()
  @IsString()
  controller?: string;

  @IsOptional()
  @IsString()
  cereal?: string;

  @IsString()
  lotCode: string; // code que ingresa el operario
}
