import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System Administrator - Full access to all features',
      isSystem: true,
    },
  });

  const dispatcherRole = await prisma.role.upsert({
    where: { name: 'DISPATCHER' },
    update: {},
    create: {
      name: 'DISPATCHER',
      description: 'Dispatcher - Manage loads, carriers, and dispatch operations',
      isSystem: true,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'VIEWER' },
    update: {},
    create: {
      name: 'VIEWER',
      description: 'Viewer - Read-only access to loads and reports',
      isSystem: true,
    },
  });

  console.log('✅ Roles created:', { adminRole, dispatcherRole, viewerRole });

  // Create permissions
  const permissions = [
    // Load permissions
    { name: 'load:view:all', resource: 'load', action: 'view:all', description: 'View all loads' },
    { name: 'load:view:own', resource: 'load', action: 'view:own', description: 'View own loads' },
    { name: 'load:create', resource: 'load', action: 'create', description: 'Create loads' },
    { name: 'load:edit', resource: 'load', action: 'edit', description: 'Edit loads' },
    { name: 'load:delete', resource: 'load', action: 'delete', description: 'Delete loads' },
    
    // Carrier permissions
    { name: 'carrier:view', resource: 'carrier', action: 'view', description: 'View carriers' },
    { name: 'carrier:create', resource: 'carrier', action: 'create', description: 'Create carriers' },
    { name: 'carrier:edit', resource: 'carrier', action: 'edit', description: 'Edit carriers' },
    { name: 'carrier:delete', resource: 'carrier', action: 'delete', description: 'Delete carriers' },
    
    // Customer permissions
    { name: 'customer:view', resource: 'customer', action: 'view', description: 'View customers' },
    { name: 'customer:create', resource: 'customer', action: 'create', description: 'Create customers' },
    { name: 'customer:edit', resource: 'customer', action: 'edit', description: 'Edit customers' },
    { name: 'customer:delete', resource: 'customer', action: 'delete', description: 'Delete customers' },
    
    // Invoice permissions
    { name: 'invoice:view', resource: 'invoice', action: 'view', description: 'View invoices' },
    { name: 'invoice:create', resource: 'invoice', action: 'create', description: 'Create invoices' },
    { name: 'invoice:send', resource: 'invoice', action: 'send', description: 'Send invoices' },
    { name: 'invoice:void', resource: 'invoice', action: 'void', description: 'Void invoices' },
    
    // Report permissions
    { name: 'report:view', resource: 'report', action: 'view', description: 'View reports' },
    { name: 'report:export', resource: 'report', action: 'export', description: 'Export reports' },
    
    // User permissions
    { name: 'user:view', resource: 'user', action: 'view', description: 'View users' },
    { name: 'user:create', resource: 'user', action: 'create', description: 'Create users' },
    { name: 'user:edit', resource: 'user', action: 'edit', description: 'Edit users' },
    { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users' },
    
    // Settings permissions
    { name: 'settings:view', resource: 'settings', action: 'view', description: 'View settings' },
    { name: 'settings:edit', resource: 'settings', action: 'edit', description: 'Edit settings' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
  }

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // Assign all permissions to admin role
  const allPermissions = await prisma.permission.findMany();
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: allPermissions.map(p => ({ id: p.id })),
      },
    },
  });

  // Assign dispatcher permissions
  const dispatcherPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: 'load' },
        { resource: 'carrier' },
        { resource: 'customer' },
        { name: { in: ['report:view', 'settings:view'] } },
      ],
    },
  });

  await prisma.role.update({
    where: { id: dispatcherRole.id },
    data: {
      permissions: {
        connect: dispatcherPermissions.map(p => ({ id: p.id })),
      },
    },
  });

  // Assign viewer permissions
  const viewerPermissions = await prisma.permission.findMany({
    where: {
      action: { in: ['view', 'view:all', 'view:own'] },
    },
  });

  await prisma.role.update({
    where: { id: viewerRole.id },
    data: {
      permissions: {
        connect: viewerPermissions.map(p => ({ id: p.id })),
      },
    },
  });

  console.log('✅ Permissions assigned to roles');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

