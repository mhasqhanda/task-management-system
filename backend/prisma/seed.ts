import { PrismaClient, Role, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with massive dummy data...');

  // ─── Clean up ──────────────────────────────────────────────────────────────
  await prisma.comment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ─── Users ─────────────────────────────────────────────────────────────────
  const pm = await prisma.user.create({
    data: { email: 'pm@demo.com', passwordHash, name: 'Sarah Chen', role: Role.PRODUCT_MANAGER, department: 'Product' },
  });

  const devFrontend1 = await prisma.user.create({
    data: { email: 'dev@demo.com', passwordHash, name: 'Alex Kumar', role: Role.INTERNAL_TEAM, department: 'Frontend' },
  });
  const devFrontend2 = await prisma.user.create({
    data: { email: 'dev2@demo.com', passwordHash, name: 'Emma Wilson', role: Role.INTERNAL_TEAM, department: 'Frontend' },
  });

  const devBackend1 = await prisma.user.create({
    data: { email: 'backend@demo.com', passwordHash, name: 'James Park', role: Role.INTERNAL_TEAM, department: 'Backend' },
  });
  const devBackend2 = await prisma.user.create({
    data: { email: 'backend2@demo.com', passwordHash, name: 'David Lee', role: Role.INTERNAL_TEAM, department: 'Backend' },
  });

  const designer = await prisma.user.create({
    data: { email: 'designer@demo.com', passwordHash, name: 'Maya Torres', role: Role.INTERNAL_TEAM, department: 'UI/UX' },
  });

  const qaEngineer = await prisma.user.create({
    data: { email: 'qa@demo.com', passwordHash, name: 'Priya Sharma', role: Role.INTERNAL_TEAM, department: 'QA' },
  });

  const devOps = await prisma.user.create({
    data: { email: 'devops@demo.com', passwordHash, name: 'Carlos Ruiz', role: Role.INTERNAL_TEAM, department: 'DevOps' },
  });

  const client1 = await prisma.user.create({
    data: { email: 'client@demo.com', passwordHash, name: 'John Smith (Acme Corp)', role: Role.CLIENT_GUEST },
  });
  const client2 = await prisma.user.create({
    data: { email: 'client2@demo.com', passwordHash, name: 'Alice Johnson (Stark Ind.)', role: Role.CLIENT_GUEST },
  });
  const client3 = await prisma.user.create({
    data: { email: 'client3@demo.com', passwordHash, name: 'Bob Brown (Wayne Ent.)', role: Role.CLIENT_GUEST },
  });

  console.log('✅ Users created');

  // ─── Projects ──────────────────────────────────────────────────────────────
  const project1 = await prisma.project.create({ data: { name: 'Acme E-Commerce Redesign', clientId: client1.id } });
  const project2 = await prisma.project.create({ data: { name: 'Acme Mobile App MVP', clientId: client1.id } });
  const project3 = await prisma.project.create({ data: { name: 'Stark Internal CRM', clientId: client2.id } });
  const project4 = await prisma.project.create({ data: { name: 'Stark Security Dashboard', clientId: client2.id } });
  const project5 = await prisma.project.create({ data: { name: 'Wayne Logistics Platform', clientId: client3.id } });

  console.log('✅ Projects created');

  // ─── Tasks Helper ──────────────────────────────────────────────────────────
  const tasksData = [
    // Project 1 (Acme E-Commerce)
    { t: 'Design System Setup', d: 'Set up Figma design system', s: TaskStatus.DONE, p: project1.id, a: designer.id, cv: true },
    { t: 'Homepage Wireframes', d: 'Create low-fi wireframes', s: TaskStatus.DONE, p: project1.id, a: designer.id, cv: true },
    { t: 'Homepage Implementation', d: 'Implement in Next.js', s: TaskStatus.IN_PROGRESS, p: project1.id, a: devFrontend1.id, cv: true },
    { t: 'Product Listing Page', d: 'Filters, sorting, pagination', s: TaskStatus.TODO, p: project1.id, a: devFrontend2.id, cv: true },
    { t: 'Checkout Flow', d: 'Multi-step checkout (INTERNAL ONLY)', s: TaskStatus.TODO, p: project1.id, a: devBackend1.id, cv: false },
    { t: 'Payment Gateway Integration', d: 'Stripe integration', s: TaskStatus.TODO, p: project1.id, a: devBackend2.id, cv: false },
    { t: 'User Profile Page', d: 'Order history, settings', s: TaskStatus.TODO, p: project1.id, a: devFrontend1.id, cv: true },
    { t: 'Admin Dashboard UI', d: 'Order management UI', s: TaskStatus.IN_PROGRESS, p: project1.id, a: devFrontend2.id, cv: false },
    { t: 'Database Optimization', d: 'Index product tables', s: TaskStatus.DONE, p: project1.id, a: devBackend1.id, cv: false },
    { t: 'Load Testing', d: 'Run k6 scripts on checkout', s: TaskStatus.TODO, p: project1.id, a: qaEngineer.id, cv: false },

    // Project 2 (Acme Mobile App)
    { t: 'React Native Setup', d: 'Init RN project', s: TaskStatus.DONE, p: project2.id, a: devFrontend1.id, cv: false },
    { t: 'Auth Screens UI', d: 'Login/Signup UI', s: TaskStatus.DONE, p: project2.id, a: designer.id, cv: true },
    { t: 'Auth Integration', d: 'Connect to JWT backend', s: TaskStatus.IN_PROGRESS, p: project2.id, a: devFrontend2.id, cv: true },
    { t: 'Biometric Login', d: 'FaceID/TouchID setup', s: TaskStatus.TODO, p: project2.id, a: devBackend2.id, cv: true },
    { t: 'Push Notifications', d: 'FCM setup', s: TaskStatus.TODO, p: project2.id, a: devOps.id, cv: false },

    // Project 3 (Stark CRM)
    { t: 'Requirements Gathering', d: 'Meet with Stark team', s: TaskStatus.DONE, p: project3.id, a: pm.id, cv: true },
    { t: 'Database Schema Design', d: 'Plan tables for CRM', s: TaskStatus.DONE, p: project3.id, a: devBackend1.id, cv: false },
    { t: 'API Scaffolding', d: 'NestJS init', s: TaskStatus.DONE, p: project3.id, a: devBackend2.id, cv: false },
    { t: 'Leads Module Backend', d: 'CRUD for leads', s: TaskStatus.IN_PROGRESS, p: project3.id, a: devBackend1.id, cv: true },
    { t: 'Leads Module UI', d: 'Data table for leads', s: TaskStatus.IN_PROGRESS, p: project3.id, a: devFrontend1.id, cv: true },
    { t: 'Sales Pipeline UI', d: 'Kanban board for sales', s: TaskStatus.TODO, p: project3.id, a: devFrontend2.id, cv: true },

    // Project 4 & 5
    { t: 'Security Audit', d: 'Pen testing dashboard', s: TaskStatus.IN_PROGRESS, p: project4.id, a: qaEngineer.id, cv: true },
    { t: 'Kubernetes Cluster Setup', d: 'AWS EKS provisioning', s: TaskStatus.IN_PROGRESS, p: project5.id, a: devOps.id, cv: false },
    { t: 'Logistics API Integration', d: 'Connect to DHL/FedEx', s: TaskStatus.TODO, p: project5.id, a: devBackend1.id, cv: true },
    { t: 'Fleet Tracking Map', d: 'Google Maps integration', s: TaskStatus.TODO, p: project5.id, a: devFrontend1.id, cv: true },
  ];

  const createdTasks: any[] = [];
  for (const t of tasksData) {
    const task = await prisma.task.create({
      data: {
        title: t.t,
        description: t.d,
        status: t.s,
        projectId: t.p,
        assignedToId: t.a,
        isClientVisible: t.cv,
        version: 1,
      },
    });
    createdTasks.push(task);
  }

  console.log(`✅ ${createdTasks.length} Tasks created`);

  // ─── Dependencies ──────────────────────────────────────────────────────────
  // Make "Homepage Impl" depend on "Design System" and "Wireframes"
  await prisma.taskDependency.create({ data: { taskId: createdTasks[2].id, dependsOnTaskId: createdTasks[0].id } });
  await prisma.taskDependency.create({ data: { taskId: createdTasks[2].id, dependsOnTaskId: createdTasks[1].id } });
  // "Checkout Flow" depends on "Product Listing"
  await prisma.taskDependency.create({ data: { taskId: createdTasks[4].id, dependsOnTaskId: createdTasks[3].id } });
  // "Payment Gateway" depends on "Checkout Flow"
  await prisma.taskDependency.create({ data: { taskId: createdTasks[5].id, dependsOnTaskId: createdTasks[4].id } });
  
  // App dependencies
  await prisma.taskDependency.create({ data: { taskId: createdTasks[12].id, dependsOnTaskId: createdTasks[11].id } });

  console.log('✅ Dependencies created');

  // ─── Comments ──────────────────────────────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      { taskId: createdTasks[2].id, userId: client1.id, content: 'Can we make the logo slightly bigger on the homepage?' },
      { taskId: createdTasks[2].id, userId: pm.id, content: 'Sure, I will ask the design team to review.' },
      { taskId: createdTasks[2].id, userId: devFrontend1.id, content: 'Updated the padding, logo should be more prominent now.' },
      
      { taskId: createdTasks[4].id, userId: devBackend1.id, content: 'Which payment provider are we using for this?' },
      { taskId: createdTasks[4].id, userId: pm.id, content: 'We are going with Stripe for MVP.' },
      
      { taskId: createdTasks[19].id, userId: client2.id, content: 'The leads table looks great. Can we add export to CSV?' },
      { taskId: createdTasks[19].id, userId: devFrontend1.id, content: 'Adding export feature to the backlog for next sprint.' },
      
      { taskId: createdTasks[21].id, userId: devOps.id, content: 'Started the pen testing. Will share report by EOD.' }
    ]
  });

  console.log('✅ Comments created');

  // ─── Audit Logs ────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { taskId: createdTasks[0].id, userId: pm.id, action: 'PATCH', oldValue: { status: 'IN_PROGRESS' }, newValue: { status: 'DONE' } },
      { taskId: createdTasks[1].id, userId: pm.id, action: 'PATCH', oldValue: { status: 'IN_PROGRESS' }, newValue: { status: 'DONE' } },
      { taskId: createdTasks[2].id, userId: devFrontend1.id, action: 'PATCH', oldValue: { status: 'TODO' }, newValue: { status: 'IN_PROGRESS' } },
      { taskId: createdTasks[10].id, userId: devFrontend1.id, action: 'PATCH', oldValue: { status: 'IN_PROGRESS' }, newValue: { status: 'DONE' } },
      { taskId: createdTasks[16].id, userId: devBackend1.id, action: 'PATCH', oldValue: { status: 'IN_PROGRESS' }, newValue: { status: 'DONE' } },
      { taskId: createdTasks[21].id, userId: qaEngineer.id, action: 'PATCH', oldValue: { status: 'TODO' }, newValue: { status: 'IN_PROGRESS' } },
      { taskId: createdTasks[3].id, userId: pm.id, action: 'PATCH', oldValue: { assignedToId: null }, newValue: { assignedToId: devFrontend2.id, assignedToName: 'Emma Wilson' } },
    ],
  });

  console.log('✅ Audit logs created');
  console.log('\n🎉 Massive seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
