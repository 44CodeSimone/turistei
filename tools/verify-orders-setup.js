/* tools/verify-orders-setup.js
 * Turistei — Orders Setup Verifier (Enterprise)
 * Objetivo: validar estado REAL da persistência Orders (repositories + storage).
 *
 * Regras:
 * - não altera dados (somente leitura)
 * - falha com exitCode=1 se algo crítico estiver errado
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function abs(rel) {
  return path.join(ROOT, rel);
}

function fileExists(rel) {
  try {
    const p = abs(rel);
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function readText(rel) {
  const p = abs(rel);
  return fs.readFileSync(p, "utf8");
}

function fail(msg) {
  console.error(`❌ FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✅ OK: ${msg}`);
}

function warn(msg) {
  console.warn(`⚠️ WARN: ${msg}`);
}

function section(title) {
  console.log("");
  console.log("=".repeat(80));
  console.log(title);
  console.log("=".repeat(80));
}

function safeJsonParse(text, relForMsg) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return {
      ok: false,
      error: `Invalid JSON in ${relForMsg}: ${String(e && e.message ? e.message : e)}`,
    };
  }
}

function verifyRequiredFiles() {
  section("1) REQUIRED FILES");

  const required = [
    "pedido.json",
    "src/repositories/orders.repository.js",
    "src/repositories/orders.file.repository.js",
    "src/repositories/orders.supabase.repository.js",
    "src/services/orders.service.js",
  ];

  for (const rel of required) {
    if (!fileExists(rel)) fail(`Missing required file: ${rel}`);
    else ok(`Found: ${rel}`);
  }
}

function verifyPedidoJson() {
  section("2) STORAGE (pedido.json)");

  if (!fileExists("pedido.json")) {
    fail("pedido.json not found at project root (process.cwd())");
    return;
  }

  const raw = readText("pedido.json");
  const parsed = safeJsonParse(raw, "pedido.json");

  if (!parsed.ok) {
    fail(parsed.error);
    return;
  }

  const obj = parsed.value;

  if (!obj || typeof obj !== "object") {
    fail("pedido.json must contain a JSON object");
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(obj, "orders")) {
    fail('pedido.json must have top-level key "orders"');
    return;
  }

  if (!Array.isArray(obj.orders)) {
    fail('pedido.json key "orders" must be an array');
    return;
  }

  ok(`pedido.json structure OK (orders.length=${obj.orders.length})`);
}

function verifyRepositorySelector() {
  section("3) REPOSITORY SELECTOR (orders.repository.js)");

  const rel = "src/repositories/orders.repository.js";
  const content = readText(rel);

  // Heurística mínima: precisa referenciar o file repo.
  const mentionsFileRepo =
    content.includes("orders.file.repository") ||
    content.includes("orders.file.repository.js") ||
    content.includes("ordersFileRepository") ||
    content.includes("file.repository") ||
    content.includes("fileRepo");

  if (!mentionsFileRepo) {
    warn(
      `${rel} does not clearly reference the file repository. Ensure it is selecting the JSON repository as active.`
    );
  } else {
    ok(`${rel} appears to select/mention the file repository (JSON active).`);
  }

  // Heurística adicional: não deve exportar algo vazio.
  const hasModuleExports = /module\.exports\s*=/.test(content);
  if (!hasModuleExports) {
    warn(`${rel} does not appear to use module.exports. If using ESM, ignore this warning.`);
  } else {
    ok(`${rel} exports something (module.exports detected).`);
  }
}

function verifyFileRepositoryReadsStorage() {
  section("4) FILE REPOSITORY (orders.file.repository.js)");

  const rel = "src/repositories/orders.file.repository.js";
  const content = readText(rel);

  // Deve referenciar pedido.json ou path para storage.
  const mentionsPedidoJson = content.includes("pedido.json");

  if (!mentionsPedidoJson) {
    warn(
      `${rel} does not explicitly mention "pedido.json". Ensure storage path uses process.cwd() and points to pedido.json.`
    );
  } else {
    ok(`${rel} references pedido.json (storage path hint OK).`);
  }

  const hasFs = /require\(["']fs["']\)/.test(content);
  if (!hasFs) warn(`${rel} does not appear to require fs (unexpected for file storage).`);
  else ok(`${rel} uses fs (expected for JSON storage).`);
}

function verifySupabasePlaceholder() {
  section("5) SUPABASE PLACEHOLDER (orders.supabase.repository.js)");

  const rel = "src/repositories/orders.supabase.repository.js";
  const content = readText(rel);

  // Placeholder deve existir e exportar algo — sem precisar funcionar ainda.
  const hasExports = /module\.exports\s*=/.test(content) || /export\s+default/.test(content);
  if (!hasExports) {
    warn(`${rel} does not appear to export anything (placeholder should export the same interface).`);
  } else {
    ok(`${rel} exports something (placeholder present).`);
  }

  // Evitar placeholder vazio total.
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();

  if (stripped.length < 50) {
    warn(`${rel} looks too small; confirm it keeps the same interface as the active repository.`);
  } else {
    ok(`${rel} has non-trivial content (placeholder likely OK).`);
  }
}

function main() {
  section("TURISTEI — VERIFY ORDERS SETUP (ENTERPRISE)");
  console.log(`Root: ${ROOT}`);

  verifyRequiredFiles();
  verifyPedidoJson();
  verifyRepositorySelector();
  verifyFileRepositoryReadsStorage();
  verifySupabasePlaceholder();

  section("RESULT");
  if (process.exitCode === 1) {
    console.log("❌ Verification finished with FAIL status.");
    process.exit(process.exitCode);
  } else {
    console.log("✅ PASS: Orders persistence setup appears consistent.");
  }
}

main();
