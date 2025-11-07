import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateAddresses() {
  console.log("Starting address migration...");

  // Migrate Shippers
  const shippers = await prisma.shipper.findMany({
    where: {
      // Only migrate shippers that don't have address JSON yet or have old format
      OR: [
        { address: null },
        { address: {} },
      ],
    },
  });

  console.log(`Found ${shippers.length} shippers to migrate`);

  for (const shipper of shippers) {
    const address = shipper.address as any;
    
    // If address is already a proper JSON object, skip
    if (address && address.street && typeof address.street === 'string') {
      continue;
    }

    // Get old column values (they might still exist in the DB)
    const oldData = shipper as any;
    
    const newAddress = {
      street: oldData.streetAddress || address?.street || "",
      city: oldData.city || address?.city || "",
      state: oldData.state || address?.state || "",
      zip: oldData.zipCode || address?.zip || "",
      country: oldData.country || address?.country || "USA",
      ...(address?.formattedAddress && { formattedAddress: address.formattedAddress }),
      ...(address?.latitude && { latitude: address.latitude }),
      ...(address?.longitude && { longitude: address.longitude }),
      ...(address?.placeId && { placeId: address.placeId }),
    };

    await prisma.shipper.update({
      where: { id: shipper.id },
      data: { address: newAddress },
    });

    console.log(`Migrated shipper ${shipper.id}`);
  }

  // Migrate Consignees
  const consignees = await prisma.consignee.findMany({
    where: {
      OR: [
        { address: null },
        { address: {} },
      ],
    },
  });

  console.log(`Found ${consignees.length} consignees to migrate`);

  for (const consignee of consignees) {
    const address = consignee.address as any;
    
    // If address is already a proper JSON object, skip
    if (address && address.street && typeof address.street === 'string') {
      continue;
    }

    // Get old column values (they might still exist in the DB)
    const oldData = consignee as any;
    
    const newAddress = {
      street: oldData.streetAddress || address?.street || "",
      city: oldData.city || address?.city || "",
      state: oldData.state || address?.state || "",
      zip: oldData.zipCode || address?.zip || "",
      country: oldData.country || address?.country || "USA",
      ...(address?.formattedAddress && { formattedAddress: address.formattedAddress }),
      ...(address?.latitude && { latitude: address.latitude }),
      ...(address?.longitude && { longitude: address.longitude }),
      ...(address?.placeId && { placeId: address.placeId }),
    };

    await prisma.consignee.update({
      where: { id: consignee.id },
      data: { address: newAddress },
    });

    console.log(`Migrated consignee ${consignee.id}`);
  }

  console.log("Migration completed!");
}

migrateAddresses()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

