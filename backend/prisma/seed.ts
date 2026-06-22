import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  const url = new URL(dbUrl);
  const config = {
    host: url.hostname,
    port: url.port ? parseInt(url.port) : 3306,
    user: url.username,
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.substring(1),
    connectionLimit: 5,
  };

  const adapter = new PrismaMariaDb(config);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Seed Roles
  const roles = [
    {
      id: 1,
      name: 'ADMIN',
      description: 'System Administrator - Full control over the system',
      permissions: {
        all: true,
      },
    },
    {
      id: 2,
      name: 'PROJECT_MANAGER',
      description: 'Project Manager - Manage reports and view logs',
      permissions: {
        projects: ['read', 'update'],
        reports: ['create', 'read', 'update', 'approve', 'export'],
        auditLogs: ['read'],
      },
    },
    {
      id: 3,
      name: 'REPORTER',
      description: 'Reporter - Create and input data for daily reports',
      permissions: {
        reports: ['create', 'read', 'update'],
        images: ['create', 'read', 'update', 'delete'],
      },
    },
    {
      id: 4,
      name: 'REVIEWER',
      description: 'Reviewer - View and comment/review reports',
      permissions: {
        reports: ['read', 'review', 'approve'],
      },
    },
    {
      id: 5,
      name: 'VIEWER',
      description: 'Viewer - Read-only access',
      permissions: {
        reports: ['read'],
        exports: ['read'],
      },
    },
  ];

  for (const role of roles) {
    const upsertedRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        permissions: role.permissions,
      },
      create: role,
    });
    console.log(`Role upserted: ${upsertedRole.name}`);
  }

  // 2. Seed default Admin User
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Password123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      name: 'Admin User',
      email: adminEmail,
      passwordHash: hashedPassword,
      status: 'ACTIVE',
      roleId: 1, // ADMIN
    },
  });

  console.log(`Admin User upserted: ${adminUser.email}`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
