import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRecordDto {
  @IsDateString()
  date: string;

  @IsNumber()
  kilograms: number;

  @IsOptional()
  @IsNumber()
  bolsonNumber?: number;


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
}
