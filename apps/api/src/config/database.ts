import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

// Store current tenant context
const tenantContext = new Map<string, string>();

export const setTenantContext = (requestId: string, organizationId: string) => {
  tenantContext.set(requestId, organizationId);
};

export const getTenantContext = (requestId: string): string | undefined => {
  return tenantContext.get(requestId);
};

export const clearTenantContext = (requestId: string) => {
  tenantContext.delete(requestId);
};

// Note: Multi-tenant filtering is enforced at the repository level
// All queries explicitly include organizationId for security

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
