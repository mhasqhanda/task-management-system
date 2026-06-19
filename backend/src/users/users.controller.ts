import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'List all users (PM only)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('team')
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'List INTERNAL_TEAM users for assignee dropdown (PM only)' })
  findTeamMembers() {
    return this.usersService.findByRole(Role.INTERNAL_TEAM);
  }

  @Get(':id')
  @Roles(Role.PRODUCT_MANAGER)
  @ApiOperation({ summary: 'Get user by ID (PM only)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
