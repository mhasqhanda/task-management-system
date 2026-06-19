import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  // ─── Create Comment ────────────────────────────────────────────────────────
  async create(taskId: string, content: string, user: { id: string; role: Role }) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
      include: { project: { select: { clientId: true } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    this.enforceReadAccess(task, user);

    return this.prisma.comment.create({
      data: {
        taskId,
        userId: user.id,
        content,
      },
      include: {
        user: { select: { id: true, name: true, role: true, department: true } },
      },
    });
  }

  // ─── List Comments ─────────────────────────────────────────────────────────
  async findAll(taskId: string, user: { id: string; role: Role }) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, isDeleted: false },
      include: { project: { select: { clientId: true } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    this.enforceReadAccess(task, user);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, role: true, department: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Client data masking for comments
    if (user.role === Role.CLIENT_GUEST) {
      return comments.map((comment) => {
        if (comment.user.role === Role.INTERNAL_TEAM) {
          return {
            ...comment,
            user: {
              id: 'hidden',
              name: 'Internal Member',
              role: undefined,
              department: undefined,
            },
          };
        }
        return comment;
      });
    }

    return comments;
  }

  // ─── Delete Comment ─────────────────────────────────────────────────────────
  async remove(id: string, user: { id: string; role: Role }) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Authorization: Only the author or PM can delete comments
    const isAuthor = comment.userId === user.id;
    const isPM = user.role === Role.PRODUCT_MANAGER;

    if (!isAuthor && !isPM) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────
  private enforceReadAccess(task: any, user: { id: string; role: Role }) {
    if (user.role === Role.INTERNAL_TEAM && task.assignedToId !== user.id) {
      throw new ForbiddenException('You can only access tasks assigned to you');
    }
    if (user.role === Role.CLIENT_GUEST) {
      if (!task.isClientVisible) {
        throw new ForbiddenException('Task not accessible');
      }
      if (task.project?.clientId !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    }
  }
}
