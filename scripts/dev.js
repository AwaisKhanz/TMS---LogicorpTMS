#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting TMS Platform Development...\n");

// Start API server
console.log("📦 Starting API server...");
const apiProcess = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, "..", "apps", "api"),
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NODE_ENV: "development" },
});

// Start Web server
console.log("📦 Starting Web server...");
const webProcess = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, "..", "apps", "web"),
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NODE_ENV: "development" },
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down development servers...");
  apiProcess.kill("SIGINT");
  webProcess.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down development servers...");
  apiProcess.kill("SIGTERM");
  webProcess.kill("SIGTERM");
  process.exit(0);
});
