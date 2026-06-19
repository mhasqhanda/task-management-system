export type UserRole = 'PRODUCT_MANAGER' | 'INTERNAL_TEAM' | 'CLIENT_GUEST';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  client?: User;
  createdAt: string;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedToId?: string;
  assignedTo?: { id: string; name: string; role: string; department?: string } | null;
  projectId: string;
  project?: { id: string; name: string };
  isClientVisible: boolean;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  dependsOn?: Array<{ dependsOn: { id: string; title: string; status: TaskStatus } }>;
}

export interface AuditLog {
  id: string;
  taskId: string;
  task?: { id: string; title: string };
  userId: string;
  user?: { id: string; name: string; email: string; role: string };
  action: string;
  oldValue?: any;
  newValue?: any;
  createdAt: string;
}

export interface ProjectProgress {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  percentComplete: number;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    role?: UserRole;
    department?: string;
  };
}

