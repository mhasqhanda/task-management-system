import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, AddDependencyDto } from './dto/update-task.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'Create a task (PM only)' })
  create(@Body() dto: CreateTaskDto, @CurrentUser('id') userId: string) {
    return this.tasksService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks (role-filtered)' })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(@CurrentUser() user: any, @Query('projectId') projectId?: string) {
    return this.tasksService.findAll(user, projectId);
  }

  @Get('audit')
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'Get all audit logs (PM only)' })
  getAllAuditLogs(@CurrentUser() user: any) {
    return this.tasksService.getAllAuditLogs(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID (role-filtered)' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task (role-aware, dependency + optimistic locking check)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'Soft delete task (PM only)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.remove(id, user);
  }

  @Post(':id/dependencies')
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'Add task dependency (PM only)' })
  addDependency(
    @Param('id') id: string,
    @Body() dto: AddDependencyDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.addDependency(id, dto, user);
  }

  @Delete(':id/dependencies/:depId')
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'Remove task dependency (PM only)' })
  removeDependency(
    @Param('id') id: string,
    @Param('depId') depId: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.removeDependency(id, depId, user);
  }

  @Get(':id/audit')
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'Get audit log for a task (PM only)' })
  getAuditLog(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.getAuditLog(id, user);
  }
}
