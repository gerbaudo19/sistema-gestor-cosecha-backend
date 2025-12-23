import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LotLoginDto {
  @ApiProperty({ example: 'UR33LR' })
  @IsString()
  @Length(6, 6)
  code: string;
}
