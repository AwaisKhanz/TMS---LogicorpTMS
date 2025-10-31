import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create default roles
  const administratorRole = await prisma.role.upsert({
    where: { name: "ADMINISTRATOR" },
    update: {},
    create: {
      name: "ADMINISTRATOR",
      description: "Administrator - Full access to all features",
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "MANAGER" },
    update: {},
    create: {
      name: "MANAGER",
      description:
        "Manager - Manage loads and carriers, see assigned customers",
      isSystem: true,
    },
  });

  const dispatcherRole = await prisma.role.upsert({
    where: { name: "DISPATCHER" },
    update: {},
    create: {
      name: "DISPATCHER",
      description:
        "Dispatcher - Create and manage loads, see assigned customers",
      isSystem: true,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: "VIEWER" },
    update: {},
    create: {
      name: "VIEWER",
      description: "Viewer - View-only access",
      isSystem: true,
    },
  });

  const invoicesRole = await prisma.role.upsert({
    where: { name: "INVOICES" },
    update: {},
    create: {
      name: "INVOICES",
      description:
        "Invoices (Accounting) - Full invoice permissions, view all customers/carriers/shippings/consignees",
      isSystem: true,
    },
  });

  console.log("✅ Roles created:", {
    administratorRole,
    managerRole,
    dispatcherRole,
    viewerRole,
    invoicesRole,
  });

  // Create permissions
  const permissions = [
    // Load permissions
    {
      name: "load:view:all",
      resource: "load",
      action: "view:all",
      description: "View all loads",
    },
    {
      name: "load:view:own",
      resource: "load",
      action: "view:own",
      description: "View own loads",
    },
    {
      name: "load:create",
      resource: "load",
      action: "create",
      description: "Create loads",
    },
    {
      name: "load:edit",
      resource: "load",
      action: "edit",
      description: "Edit loads",
    },
    {
      name: "load:delete",
      resource: "load",
      action: "delete",
      description: "Delete loads",
    },

    // Carrier permissions
    {
      name: "carrier:view",
      resource: "carrier",
      action: "view",
      description: "View carriers",
    },
    {
      name: "carrier:create",
      resource: "carrier",
      action: "create",
      description: "Create carriers",
    },
    {
      name: "carrier:edit",
      resource: "carrier",
      action: "edit",
      description: "Edit carriers",
    },
    {
      name: "carrier:delete",
      resource: "carrier",
      action: "delete",
      description: "Delete carriers",
    },

    // Customer permissions
    {
      name: "customer:view",
      resource: "customer",
      action: "view",
      description: "View customers",
    },
    {
      name: "customer:create",
      resource: "customer",
      action: "create",
      description: "Create customers",
    },
    {
      name: "customer:edit",
      resource: "customer",
      action: "edit",
      description: "Edit customers",
    },
    {
      name: "customer:delete",
      resource: "customer",
      action: "delete",
      description: "Delete customers",
    },

    // Invoice permissions
    {
      name: "invoice:view",
      resource: "invoice",
      action: "view",
      description: "View invoices",
    },
    {
      name: "invoice:create",
      resource: "invoice",
      action: "create",
      description: "Create invoices",
    },
    {
      name: "invoice:send",
      resource: "invoice",
      action: "send",
      description: "Send invoices",
    },
    {
      name: "invoice:void",
      resource: "invoice",
      action: "void",
      description: "Void invoices",
    },
    {
      name: "invoice:edit",
      resource: "invoice",
      action: "edit",
      description: "Edit invoices",
    },
    {
      name: "invoice:delete",
      resource: "invoice",
      action: "delete",
      description: "Delete invoices",
    },

    // Report permissions
    {
      name: "report:view",
      resource: "report",
      action: "view",
      description: "View reports",
    },
    {
      name: "report:export",
      resource: "report",
      action: "export",
      description: "Export reports",
    },
    {
      name: "report:create",
      resource: "report",
      action: "create",
      description: "Create reports",
    },
    {
      name: "report:edit",
      resource: "report",
      action: "edit",
      description: "Edit reports",
    },
    {
      name: "report:delete",
      resource: "report",
      action: "delete",
      description: "Delete reports",
    },

    // Document permissions
    {
      name: "document:view",
      resource: "document",
      action: "view",
      description: "View documents",
    },
    {
      name: "document:create",
      resource: "document",
      action: "create",
      description: "Create/upload documents",
    },
    {
      name: "document:edit",
      resource: "document",
      action: "edit",
      description: "Edit documents",
    },
    {
      name: "document:delete",
      resource: "document",
      action: "delete",
      description: "Delete documents",
    },

    // Consignee permissions
    {
      name: "consignee:view",
      resource: "consignee",
      action: "view",
      description: "View consignees",
    },
    {
      name: "consignee:create",
      resource: "consignee",
      action: "create",
      description: "Create consignees",
    },
    {
      name: "consignee:edit",
      resource: "consignee",
      action: "edit",
      description: "Edit consignees",
    },
    {
      name: "consignee:delete",
      resource: "consignee",
      action: "delete",
      description: "Delete consignees",
    },

    // Shipper permissions
    {
      name: "shipper:view",
      resource: "shipper",
      action: "view",
      description: "View shippers",
    },
    {
      name: "shipper:create",
      resource: "shipper",
      action: "create",
      description: "Create shippers",
    },
    {
      name: "shipper:edit",
      resource: "shipper",
      action: "edit",
      description: "Edit shippers",
    },
    {
      name: "shipper:delete",
      resource: "shipper",
      action: "delete",
      description: "Delete shippers",
    },

    // User permissions
    {
      name: "user:view",
      resource: "user",
      action: "view",
      description: "View users",
    },
    {
      name: "user:create",
      resource: "user",
      action: "create",
      description: "Create users",
    },
    {
      name: "user:edit",
      resource: "user",
      action: "edit",
      description: "Edit users",
    },
    {
      name: "user:delete",
      resource: "user",
      action: "delete",
      description: "Delete users",
    },

    // Settings permissions
    {
      name: "settings:view",
      resource: "settings",
      action: "view",
      description: "View settings",
    },
    {
      name: "settings:edit",
      resource: "settings",
      action: "edit",
      description: "Edit settings",
    },
  ];

  const createdPermissions: Awaited<
    ReturnType<typeof prisma.permission.upsert>
  >[] = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
  }

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // Assign all permissions to administrator role
  const allPermissions = await prisma.permission.findMany();
  await prisma.role.update({
    where: { id: administratorRole.id },
    data: {
      permissions: {
        connect: allPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // Assign manager permissions (manage loads and carriers, see assigned customers)
  const managerPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: "load" },
        { resource: "carrier" },
        { resource: "consignee" },
        { resource: "shipper" },
        { resource: "document" },
        { name: "customer:view" },
        { name: "user:view" },
        {
          name: {
            in: [
              "report:view",
              "report:create",
              "report:edit",
              "report:delete",
              "settings:view",
            ],
          },
        },
      ],
    },
  });

  await prisma.role.update({
    where: { id: managerRole.id },
    data: {
      permissions: {
        connect: managerPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // Assign dispatcher permissions (create and manage loads, see assigned customers, view carriers)
  const dispatcherPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: "load" },
        { resource: "carrier" },
        { resource: "consignee" },
        { resource: "shipper" },
        { resource: "document" },
        { name: "customer:view" },
        {
          name: {
            in: ["report:view", "settings:view"],
          },
        },
      ],
    },
  });

  await prisma.role.update({
    where: { id: dispatcherRole.id },
    data: {
      permissions: {
        connect: dispatcherPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // Assign viewer permissions (view-only access to loads, carriers, customers, reports, settings)
  const viewerPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { action: { in: ["view", "view:all", "view:own"] } },
        { name: { in: ["report:view", "report:export", "settings:view"] } },
        { resource: "document", action: "view" },
      ],
    },
  });

  await prisma.role.update({
    where: { id: viewerRole.id },
    data: {
      permissions: {
        connect: viewerPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // Assign invoices role permissions (full invoice permissions, view all customers/carriers/loads/shippings/consignees)
  const invoicesPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: "invoice" },
        { name: "customer:view" },
        { name: "carrier:view" },
        { name: "load:view" },
        { name: "load:view:own" },
        { resource: "document" },
        {
          name: {
            in: ["report:view", "report:export", "settings:view"],
          },
        },
      ],
    },
  });

  await prisma.role.update({
    where: { id: invoicesRole.id },
    data: {
      permissions: {
        connect: invoicesPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  console.log("✅ Permissions assigned to roles");

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
