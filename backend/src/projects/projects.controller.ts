import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'Create a project (PM only)' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects (role-filtered)' })
  findAll(@CurrentUser() user: any) {
    return this.projectsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID (role-filtered)' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.findOne(id, user);
  }

  @Get(':id/progress')
  @Roles(Role.CLIENT_GUEST)
  @ApiOperation({ summary: 'Get project progress (Client only)' })
  getProgress(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.getClientProgress(id, userId);
  }
}
