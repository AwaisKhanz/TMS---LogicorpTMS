#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

const packages = [
  { name: "shared-constants", path: "packages/shared-constants" },
  { name: "shared-types", path: "packages/shared-types" },
  { name: "database", path: "packages/database" },
  { name: "api", path: "apps/api" },
  { name: "web", path: "apps/web" },
];

console.log("🚀 Starting TMS Platform Build...\n");

let successCount = 0;
let errorCount = 0;

for (const pkg of packages) {
  try {
    console.log(`📦 Building ${pkg.name}...`);
    execSync("npm run build", {
      cwd: path.join(__dirname, "..", pkg.path),
      stdio: "inherit",
    });
    console.log(`✅ ${pkg.name} built successfully\n`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to build ${pkg.name}`);
    console.error(error.message);
    errorCount++;
    console.log("");
  }
}

console.log("📊 Build Summary:");
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${errorCount}`);

if (errorCount > 0) {
  console.log("\n💥 Build failed! Please fix the errors above.");
  process.exit(1);
} else {
  console.log("\n🎉 All packages built successfully!");
}
