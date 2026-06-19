import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url: string = request.url;

    // Only audit mutating calls on /tasks
    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
    const isTaskRoute = url.includes('/tasks');

    if (!isMutation || !isTaskRoute) return next.handle();

    const user = request.user;
    const taskId: string | undefined = request.params?.id;
    const oldBody = request.body ? { ...request.body } : null;

    return next.handle().pipe(
      tap(async (responseData) => {
        if (!user || !taskId) return;
        try {
          await this.prisma.auditLog.create({
            data: {
              taskId,
              userId: user.id,
              action: method,
              oldValue: oldBody as any,
              newValue: responseData ?? null,
            },
          });
        } catch {
          // Don't throw — audit failure shouldn't break the response
        }
      }),
    );
  }
}
