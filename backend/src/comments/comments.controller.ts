import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({ summary: 'Add a comment to a task' })
  @Post('tasks/:taskId/comments')
  async create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.commentsService.create(taskId, dto.content, user);
  }

  @ApiOperation({ summary: 'List all comments for a task' })
  @Get('tasks/:taskId/comments')
  async findAll(
    @Param('taskId') taskId: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.commentsService.findAll(taskId, user);
  }

  @ApiOperation({ summary: 'Delete a comment' })
  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    await this.commentsService.remove(id, user);
  }
}
