#!/usr/bin/env node
// ==============================================================================
// bootstrap_workspace.mjs
// Unified Scaffolding Engine Delegator (Topology-Aware & Emergent Architecture)
// ==============================================================================
import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const selfDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(selfDir, "../../../..");

async function getBootstrapModule() {
  const candidates = [
    path.join(root, "lib", "index.js"),
    path.join(root, "src", "index.ts")
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        return await import(pathToFileURL(c).href);
      } catch {}
    }
  }
  throw new Error("Unable to resolve azcodr bootstrap module.");
}

async function main() {
  const targetDir = process.argv[2] || process.cwd();
  const topology = process.argv[3] || "backend";
  const language = process.argv[4] || "generic";

  const { bootstrapWorkspace } = await getBootstrapModule();
  const result = bootstrapWorkspace(targetDir, {
    topology,
    language,
    out: console.log,
    err: console.error
  });

  if (!result.success) {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("❌ Fatal bootstrap error:", err.message);
  process.exit(2);
});
