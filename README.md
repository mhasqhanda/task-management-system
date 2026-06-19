# TaskFlow - Enterprise Task Management System

TaskFlow is an enterprise-grade Task Management System built with a modern architecture. This system is designed for both internal teams and external clients, featuring strict Role-Based Access Control (RBAC) and real-time collaborative capabilities.

## 🚀 Key Features

- **Role-Based Access Control (RBAC) & Multi-tenancy**
  - **Product Manager**: Has full control to create, edit, and delete tasks/comments. Can view all projects and manage all dependencies.
  - **Internal Team (Developer/Designer/QA)**: Can only view internal tasks and move tasks assigned to them across the Kanban board. Cannot mark tasks as "Done".
  - **Client Guest**: Restricted access to their respective projects only. Can only view tasks explicitly marked as `isClientVisible: true`.
  - **Identity Masking**: Clients will not see the real names or departments of internal team members on tasks or in the comment thread (names are masked as "Internal Member").

- **Interactive Kanban Board**
  - Smooth, native HTML5 drag-and-drop Kanban board interface.
  - Client-side and server-side validation to ensure users can only move tasks according to their assigned roles and permissions.

- **Dependency Guard**
  - Tasks can block one another. If a task depends on other prerequisite tasks, it cannot be moved to the `IN_PROGRESS` or `DONE` status until all of its dependencies are marked as `DONE`.

- **Optimistic Locking (Data Conflict Prevention)**
  - Every task is tracked with a `version` number. If two users attempt to update the same task simultaneously, the system will reject the second update with a `409 Conflict` status to prevent data overwriting.

- **Collaborative Comment Thread**
  - Interactive side-drawer on the task details view displaying the conversation history.
  - Enables seamless collaboration between PMs, Internal Teams, and Clients.
  - Restricted comment deletion (only the author or a PM can delete comments).

- **Immutable Audit Trail**
  - The system automatically logs every modification to tasks (POST, PATCH, DELETE) using a Backend Global Interceptor. It records both the previous and new values, serving as a permanent audit log.

## 💻 Tech Stack

**Frontend (Client)**
- [Next.js 15 (App Router)](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query (React Query)](https://tanstack.com/query/latest)
- [Axios](https://axios-http.com/)
- [React Hot Toast](https://react-hot-toast.com/)

**Backend (API)**
- [NestJS](https://nestjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [JWT Authentication](https://jwt.io/) & [Bcrypt](https://www.npmjs.com/package/bcrypt)

**Infrastructure**
- Docker & Docker Compose (for local database environment)

## 🛠 Local Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (to run PostgreSQL)

### 2. Start the Database (Docker)
In the project root directory, run:
```bash
docker-compose up -d
```

### 3. Backend Setup
Open a new terminal:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts  # Populates initial dummy data
npm run start:dev
```
The backend will run on `http://localhost:3001`

### 4. Frontend Setup
Open another new terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`

---
*Built with ❤️ by your team.*
