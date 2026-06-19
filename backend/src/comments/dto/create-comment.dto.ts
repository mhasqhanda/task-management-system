import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'This task is ready for review.', description: 'Comment text content' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;
}
