import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  cereal: string;

  startDate?: Date;
}
