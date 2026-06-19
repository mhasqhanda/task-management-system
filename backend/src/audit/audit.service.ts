import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    taskId: string;
    userId: string;
    action: string;
    oldValue?: any;
    newValue?: any;
  }) {
    try {
      return await this.prisma.auditLog.create({ data });
    } catch {
      // Silently fail — audit logging should never break the main flow
    }
  }

  async getByTask(taskId: string) {
    return this.prisma.auditLog.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
