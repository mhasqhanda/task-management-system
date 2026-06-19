import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, AddDependencyDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateTaskDto, creatorId: string) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        assignedToId: dto.assignedToId,
        status: dto.status ?? TaskStatus.TODO,
        isClientVisible: dto.isClientVisible ?? false,
      },
      include: {
        assignedTo: { select: { id: true, name: true, role: true, department: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  // ─── Find All (role-filtered) ───────────────────────────────────────────────

  async findAll(user: { id: string; role: Role }, projectId?: string) {
    const baseWhere: any = { isDeleted: false };
    if (projectId) baseWhere.projectId = projectId;

    if (user.role === Role.INTERNAL_TEAM) {
      baseWhere.assignedToId = user.id;
    }

    if (user.role === Role.CLIENT_GUEST) {
      // Only visible tasks in projects belonging to this client
      baseWhere.isClientVisible = true;
      baseWhere.project = { clientId: user.id };
    }

    const tasks = await this.prisma.task.findMany({
      where: baseWhere,
      include: {
        assignedTo: { select: { id: true, name: true, role: true, department: true } },
        project: { select: { id: true, name: true } },
        dependsOn: {
          include: { dependsOn: { select: { id: true, title: true, status: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Client data masking
    if (user.role === Role.CLIENT_GUEST) {
      return tasks.map((task) => this.maskForClient(task));
    }

    return tasks;
  }

  // ─── Find One ──────────────────────────────────────────────────────────────

  async findOne(id: string, user: { id: string; role: Role }) {
    const task = await this.prisma.task.findFirst({
      where: { id, isDeleted: false },
      include: {
        assignedTo: { select: { id: true, name: true, role: true, department: true } },
        project: { select: { id: true, name: true, clientId: true } },
        dependsOn: {
          include: { dependsOn: { select: { id: true, title: true, status: true } } },
        },
        blockedBy: {
          include: { task: { select: { id: true, title: true, status: true } } },
        },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    this.enforceReadAccess(task, user);

    if (user.role === Role.CLIENT_GUEST) return this.maskForClient(task);
    return task;
  }

  // ─── Update (with all business logic) ──────────────────────────────────────

  async update(id: string, dto: UpdateTaskDto, user: { id: string; role: Role }) {
    const task = await this.prisma.task.findFirst({
      where: { id, isDeleted: false },
      include: {
        dependsOn: {
          include: { dependsOn: { select: { id: true, title: true, status: true } } },
        },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    // ── RBAC checks ──
    if (user.role === Role.CLIENT_GUEST) {
      throw new ForbiddenException('Clients cannot modify tasks');
    }

    if (user.role === Role.INTERNAL_TEAM) {
      // Can only update tasks assigned to them
      if (task.assignedToId !== user.id) {
        throw new ForbiddenException('You can only update tasks assigned to you');
      }
      // Internal team cannot change title/description/assignedTo/isClientVisible
      if (dto.title !== undefined || dto.description !== undefined) {
        throw new ForbiddenException('You cannot modify the task title or description');
      }
      if (dto.assignedToId !== undefined) {
        throw new ForbiddenException('You cannot reassign tasks');
      }
      if (dto.isClientVisible !== undefined) {
        throw new ForbiddenException('You cannot change client visibility');
      }
      // Internal team can move between TODO and IN_PROGRESS only (never DONE)
      if (dto.status) {
        if (dto.status === TaskStatus.DONE) {
          throw new ForbiddenException(
            'Only Product Managers can mark tasks as DONE. This requires PM review and approval.',
          );
        }
        // Allow TODO <-> IN_PROGRESS
        if (dto.status !== TaskStatus.TODO && dto.status !== TaskStatus.IN_PROGRESS) {
          throw new ForbiddenException('Invalid status transition');
        }
      }
    }

    // ── Optimistic locking ──
    if (dto.version !== undefined && dto.version !== task.version) {
      throw new ConflictException(
        'Data conflict detected. Someone else has updated this task. Please refresh and try again.',
      );
    }

    // ── Dependency check (with descriptive task titles) ──
    if (dto.status === TaskStatus.IN_PROGRESS || dto.status === TaskStatus.DONE) {
      const blockedDeps = task.dependsOn.filter(
        (dep) => dep.dependsOn.status !== TaskStatus.DONE,
      );
      if (blockedDeps.length > 0) {
        const blockingNames = blockedDeps
          .map((d) => `"${d.dependsOn.title}"`)
          .join(', ');
        throw new BadRequestException(
          `This task is locked because it depends on ${blockingNames} which ${blockedDeps.length === 1 ? 'is' : 'are'} not yet DONE.`,
        );
      }
    }

    const updateData: any = { version: { increment: 1 } };
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.assignedToId !== undefined) updateData.assignedToId = dto.assignedToId;
    if (dto.isClientVisible !== undefined) updateData.isClientVisible = dto.isClientVisible;

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, role: true, department: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  // ─── Soft Delete ───────────────────────────────────────────────────────────

  async remove(id: string, user: { id: string; role: Role }) {
    if (user.role !== Role.PRODUCT_MANAGER) {
      throw new ForbiddenException('Only Product Managers can delete tasks');
    }
    const task = await this.prisma.task.findFirst({ where: { id, isDeleted: false } });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.task.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  // ─── Task Dependencies ─────────────────────────────────────────────────────

  async addDependency(taskId: string, dto: AddDependencyDto, user: { role: Role }) {
    if (user.role !== Role.PRODUCT_MANAGER) {
      throw new ForbiddenException('Only Product Managers can set dependencies');
    }
    if (taskId === dto.dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }
    // Check both tasks exist
    const [task, dependsOnTask] = await Promise.all([
      this.prisma.task.findFirst({ where: { id: taskId, isDeleted: false } }),
      this.prisma.task.findFirst({ where: { id: dto.dependsOnTaskId, isDeleted: false } }),
    ]);
    if (!task) throw new NotFoundException('Task not found');
    if (!dependsOnTask) throw new NotFoundException('Dependency task not found');

    return this.prisma.taskDependency.upsert({
      where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId: dto.dependsOnTaskId } },
      create: { taskId, dependsOnTaskId: dto.dependsOnTaskId },
      update: {},
    });
  }

  async removeDependency(taskId: string, dependsOnTaskId: string, user: { role: Role }) {
    if (user.role !== Role.PRODUCT_MANAGER) {
      throw new ForbiddenException('Only Product Managers can remove dependencies');
    }
    return this.prisma.taskDependency.deleteMany({ where: { taskId, dependsOnTaskId } });
  }

  // ─── Audit Log ─────────────────────────────────────────────────────────────

  async getAuditLog(taskId: string, user: { role: Role }) {
    if (user.role !== Role.PRODUCT_MANAGER) {
      throw new ForbiddenException('Only Product Managers can view audit logs');
    }
    return this.prisma.auditLog.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllAuditLogs(user: { role: Role }) {
    if (user.role !== Role.PRODUCT_MANAGER) {
      throw new ForbiddenException('Only Product Managers can view audit logs');
    }
    return this.prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private enforceReadAccess(task: any, user: { id: string; role: Role }) {
    if (user.role === Role.INTERNAL_TEAM && task.assignedToId !== user.id) {
      throw new ForbiddenException('You can only view tasks assigned to you');
    }
    if (user.role === Role.CLIENT_GUEST) {
      if (!task.isClientVisible) throw new ForbiddenException('Task not accessible');
      if (task.project?.clientId !== user.id) throw new ForbiddenException('Access denied');
    }
  }

  private maskForClient(task: any) {
    return {
      ...task,
      assignedTo: task.assignedTo
        ? { id: 'hidden', name: 'Internal Member', role: undefined, department: undefined }
        : null,
    };
  }
}
