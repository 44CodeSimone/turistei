/* tools/scan-turistei.js
 * Turistei — Project Scanner (Enterprise)
 * Objetivo: varrer estrutura e arquivos-chave, detectar vazios/pendências,
 * e gerar um relatório objetivo baseado no estado REAL do código.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function safeReadFile(p, maxBytes = 256 * 1024) {
  try {
    const stat = fs.statSync(p);
    const size = stat.size;

    const fd = fs.openSync(p, "r");
    const bytesToRead = Math.min(size, maxBytes);
    const buffer = Buffer.alloc(bytesToRead);

    fs.readSync(fd, buffer, 0, bytesToRead, 0);
    fs.closeSync(fd);

    return { ok: true, size, content: buffer.toString("utf8") };
  } catch (e) {
    return {
      ok: false,
      size: null,
      content: null,
      error: String(e && e.message ? e.message : e),
    };
  }
}

function normalizeRel(p) {
  return path.relative(ROOT, p).replaceAll("\\", "/");
}

function listDirRecursive(dir, options = {}) {
  const ignoreDirs =
    options.ignoreDirs ??
    new Set(["node_modules", ".git", "dist", "build", ".next", ".turbo", "coverage"]);

  const ignoreFiles = options.ignoreFiles ?? new Set([]);
  const maxFiles = options.maxFiles ?? 2000;

  const results = [];
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    let entries;

    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      const full = path.join(current, ent.name);

      if (ent.isDirectory()) {
        if (!ignoreDirs.has(ent.name)) stack.push(full);
        continue;
      }

      if (ent.isFile()) {
        if (ignoreFiles.has(ent.name)) continue;
        results.push(full);
        if (results.length >= maxFiles) return results;
      }
    }
  }

  return results;
}

function countNonWhitespace(content) {
  if (typeof content !== "string") return 0;
  return content.replace(/\s+/g, "").length;
}

function looksEmptyJs(content) {
  if (typeof content !== "string") return true;
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();
  return stripped.length === 0;
}

function probeFile(fileRel) {
  const full = path.join(ROOT, fileRel);

  if (!exists(full)) return { present: false, fileRel };
  if (!isFile(full)) return { present: false, fileRel, note: "exists but is not a file" };

  const r = safeReadFile(full);
  if (!r.ok) return { present: true, fileRel, readOk: false, error: r.error };

  const size = r.size;
  const content = r.content ?? "";
  const nonWs = countNonWhitespace(content);

  const ext = path.extname(full).toLowerCase();
  const emptyByHeuristic =
    size === 0 ||
    nonWs === 0 ||
    ((ext === ".js" || ext === ".mjs" || ext === ".cjs") && looksEmptyJs(content));

  return {
    present: true,
    fileRel,
    readOk: true,
    size,
    nonWs,
    emptyByHeuristic,
    head: content.slice(0, 200).replace(/\r/g, ""),
  };
}

function pickAuthSignals(content) {
  const c = content || "";
  return {
    hasJwtImport: /jsonwebtoken/i.test(c),
    hasSign: /\bjwt\.sign\b/.test(c) || /\bsign\s*\(/.test(c),
    hasVerify: /\bjwt\.verify\b/.test(c) || /\bverify\s*\(/.test(c),
    hasIssuer: /\bissuer\b/.test(c),
    hasAudience: /\baudience\b/.test(c),
    hasSubCheck: /\bsub\b/.test(c) && (/\bpayload\b/.test(c) || /\breq\.user\b/.test(c)),
    hasJwtSecretRef: /JWT_SECRET/.test(c),
    hasNodeEnvRef: /NODE_ENV/.test(c),
    hasFallbackSecret: /fallback|default\s*secret|dev\s*secret/i.test(c),
  };
}

function printHeader(title) {
  console.log("");
  console.log("=".repeat(80));
  console.log(title);
  console.log("=".repeat(80));
}

function main() {
  printHeader("TURISTEI — ENTERPRISE PROJECT SCAN (REAL STATE)");
  console.log(`Root: ${ROOT}`);

  // 1) Estrutura mínima esperada
  printHeader("1) STRUCTURE CHECK");
  const expectedDirs = [
    "src",
    "src/routes",
    "src/controllers",
    "src/services",
    "src/repositories",
    "src/middleware",
    "tools",
  ];

  for (const d of expectedDirs) {
    const ok = exists(path.join(ROOT, d)) && isDirectory(path.join(ROOT, d));
    console.log(`${ok ? "OK  " : "MISS"} ${d}`);
  }

  // 2) Arquivos principais
  printHeader("2) KEY FILES CHECK");
  const keyFiles = [
    "package.json",
    "src/index.js",
    "src/app.js",

    "src/routes/health.routes.js",
    "src/controllers/health.controller.js",
    "src/services/health.service.js",

    "src/routes/services.routes.js",
    "src/controllers/services.controller.js",
    "src/services/services.service.js",

    "src/routes/providers.routes.js",
    "src/controllers/providers.controller.js",
    "src/services/providers.service.js",

    "src/routes/orders.routes.js",
    "src/controllers/orders.controller.js",
    "src/services/orders.service.js",

    "src/repositories/orders.repository.js",
    "src/repositories/orders.file.repository.js",
    "src/repositories/orders.supabase.repository.js",

    "pedido.json",
    "tools/verify-orders-setup.js",

    "src/routes/auth.routes.js",
    "src/controllers/auth.controller.js",
    "src/services/auth.service.js",
    "src/middleware/requireAuth.js",
  ];

  const probes = keyFiles.map(probeFile);

  for (const p of probes) {
    if (!p.present) {
      console.log(`MISS   ${p.fileRel}`);
      continue;
    }
    if (!p.readOk) {
      console.log(`ERR    ${p.fileRel} (${p.error})`);
      continue;
    }
    const tag = p.emptyByHeuristic ? "EMPTY?" : "OK";
    console.log(`${tag.padEnd(6)} ${p.fileRel} (size=${p.size}, nonWs=${p.nonWs})`);
  }

  // 3) Auth signals
  printHeader("3) AUTH SIGNALS (DEEP CHECK)");
  const authFiles = [
    "src/services/auth.service.js",
    "src/middleware/requireAuth.js",
    "src/controllers/auth.controller.js",
    "src/routes/auth.routes.js",
  ];

  for (const rel of authFiles) {
    const p = probeFile(rel);
    if (!p.present || !p.readOk) {
      console.log(`MISS/ERR ${rel}`);
      continue;
    }

    const signals = pickAuthSignals(p.head + "\n");
    console.log(`FILE: ${rel}`);
    console.log(
      `  jwtImport=${signals.hasJwtImport} sign=${signals.hasSign} verify=${signals.hasVerify} issuer=${signals.hasIssuer} audience=${signals.hasAudience}`
    );
    console.log(
      `  subCheck=${signals.hasSubCheck} JWT_SECRET=${signals.hasJwtSecretRef} NODE_ENV=${signals.hasNodeEnvRef} fallbackHint=${signals.hasFallbackSecret}`
    );
  }

  // 4) Arquivos JS vazios em src
  printHeader("4) EMPTY/PENDING FILES (src/**/*.js)");
  const srcDir = path.join(ROOT, "src");

  if (!exists(srcDir) || !isDirectory(srcDir)) {
    console.log("MISS  src/ directory not found.");
  } else {
    const allFiles = listDirRecursive(srcDir);
    const jsFiles = allFiles.filter((f) => f.endsWith(".js"));

    const empties = [];
    for (const f of jsFiles) {
      const r = safeReadFile(f, 64 * 1024);
      if (!r.ok) continue;
      if (looksEmptyJs(r.content ?? "")) {
        empties.push({ fileRel: normalizeRel(f), size: r.size });
      }
    }

    if (empties.length === 0) {
      console.log("OK  No empty JS files detected under src/");
    } else {
      console.log(`WARN  Empty-like JS files detected: ${empties.length}`);
      for (const e of empties.sort((a, b) => a.fileRel.localeCompare(b.fileRel))) {
        console.log(`  EMPTY? ${e.fileRel} (size=${e.size})`);
      }
    }
  }

  // 5) pedido.json sanity
  printHeader("5) STORAGE CHECK (pedido.json)");
  const storagePath = path.join(ROOT, "pedido.json");

  if (!exists(storagePath)) {
    console.log("MISS  pedido.json not found at project root (process.cwd())");
  } else {
    const raw = safeReadFile(storagePath, 512 * 1024);
    if (!raw.ok) {
      console.log(`ERR   pedido.json read error: ${raw.error}`);
    } else {
      try {
        const parsed = JSON.parse(raw.content);
        const hasOrdersArray =
          parsed && typeof parsed === "object" && Array.isArray(parsed.orders);

        console.log(`OK    pedido.json parsed JSON. ordersArray=${hasOrdersArray} size=${raw.size}`);
        if (hasOrdersArray) console.log(`INFO  orders.length=${parsed.orders.length}`);
      } catch (e) {
        console.log(
          `ERR   pedido.json is not valid JSON: ${String(e && e.message ? e.message : e)}`
        );
      }
    }
  }

  // 6) package.json scripts quick view
  printHeader("6) PACKAGE.JSON SCRIPTS (QUICK VIEW)");
  const pkgPath = path.join(ROOT, "package.json");

  if (!exists(pkgPath)) {
    console.log("MISS  package.json not found");
  } else {
    const raw = safeReadFile(pkgPath, 256 * 1024);
    if (!raw.ok) {
      console.log(`ERR   package.json read error: ${raw.error}`);
    } else {
      try {
        const pkg = JSON.parse(raw.content);
        const scripts = (pkg && pkg.scripts) || {};
        const keys = Object.keys(scripts);

        if (keys.length === 0) {
          console.log("INFO  No scripts found in package.json");
        } else {
          for (const k of keys.sort()) console.log(`  ${k}: ${scripts[k]}`);
        }
      } catch (e) {
        console.log(
          `ERR   package.json is not valid JSON: ${String(e && e.message ? e.message : e)}`
        );
      }
    }
  }

  printHeader("SCAN DONE");
  console.log("Next: cole aqui o output completo deste scan para confirmarmos o ponto real de continuidade.");
}

main();
