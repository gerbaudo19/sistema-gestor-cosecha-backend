import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateLotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  cereal?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
