import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'Mateo Gerbaudo',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'usuario@gmail.com',
    description: 'Email único del usuario',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña (mínimo 6 caracteres)',
    minLength: 6,
  })
  @MinLength(6)
  password: string;
}
