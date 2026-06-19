import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { name: dto.name, clientId: dto.clientId },
      include: { client: { select: { id: true, email: true, name: true } } },
    });
  }

  async findAll(user: { id: string; role: Role }) {
    if (user.role === Role.CLIENT_GUEST) {
      // Multi-tenant: only show projects where this user is the client
      return this.prisma.project.findMany({
        where: { clientId: user.id },
        include: {
          _count: { select: { tasks: { where: { isDeleted: false, isClientVisible: true } } } },
        },
      });
    }

    if (user.role === Role.INTERNAL_TEAM) {
      // Internal team sees projects that have tasks assigned to them
      return this.prisma.project.findMany({
        where: {
          tasks: { some: { assignedToId: user.id, isDeleted: false } },
        },
        include: { _count: { select: { tasks: { where: { isDeleted: false } } } } },
      });
    }

    // PM sees all
    return this.prisma.project.findMany({
      include: {
        client: { select: { id: true, email: true, name: true } },
        _count: { select: { tasks: { where: { isDeleted: false } } } },
      },
    });
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, email: true, name: true } },
        tasks: {
          where: { isDeleted: false },
          include: { assignedTo: { select: { id: true, name: true, department: true } } },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    if (user.role === Role.CLIENT_GUEST && project.clientId !== user.id) {
      throw new ForbiddenException('Access denied to this project');
    }

    return project;
  }

  async getClientProgress(projectId: string, clientId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, clientId },
    });
    if (!project) throw new ForbiddenException('Access denied');

    const tasks = await this.prisma.task.findMany({
      where: { projectId, isDeleted: false, isClientVisible: true },
      select: { status: true },
    });

    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;

    return {
      total,
      done,
      inProgress,
      todo: total - done - inProgress,
      percentComplete: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  }
}
