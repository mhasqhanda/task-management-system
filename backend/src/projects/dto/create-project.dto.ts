import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'E-Commerce Redesign' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'client-user-id-here', description: 'ID of the CLIENT_GUEST user' })
  @IsString()
  @IsNotEmpty()
  clientId: string;
}
