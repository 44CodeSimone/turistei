'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'pedido.json');

// Root onde ficam as subpastas por dia: ./backups/pedido/YYYY-MM-DD/
const BACKUP_ROOT = path.join(process.cwd(), 'backups', 'pedido');

// Observabilidade (desligado por padrão):
// Ative com TURISTEI_BACKUP_DEBUG=1
const BACKUP_DEBUG = (() => {
  const v = String(process.env.TURISTEI_BACKUP_DEBUG || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
})();

function dbg(message, meta) {
  if (!BACKUP_DEBUG) return;
  try {
    const base = `[turistei][backup] ${message}`;
    if (meta !== undefined) console.log(base, meta);
    else console.log(base);
  } catch {
    // nunca quebrar fluxo por log
  }
}

// Quantos backups manter (default 30). Pode sobrescrever via env:
// TURISTEI_BACKUP_KEEP=30
const BACKUP_KEEP = (() => {
  const n = Number(process.env.TURISTEI_BACKUP_KEEP);
  if (!Number.isFinite(n)) return 30;
  if (n <= 0) return 30;
  return Math.floor(n);
})();

function now() {
  return new Date().toISOString();
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureBackupRoot() {
  ensureDir(BACKUP_ROOT);
}

function sanitizeReason(reason) {
  const r = String(reason || 'backup').trim() || 'backup';
  return r.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 40) || 'backup';
}

function isoDayFromIsoTs(isoTs) {
  // "2026-02-07T18:39:47.384Z" -> "2026-02-07"
  if (!isoTs || typeof isoTs !== 'string') return null;
  if (isoTs.length < 10) return null;
  const day = isoTs.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return day;
}

function dayFromBackupFilename(filename) {
  // pedido.backup.2026-02-07T17-50-44-696Z.normal.json
  const prefix = 'pedido.backup.';
  if (!filename || typeof filename !== 'string') return null;
  if (!filename.startsWith(prefix)) return null;

  const rest = filename.slice(prefix.length);
  const day = rest.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return day;
}

function safeMoveFile(from, to) {
  try {
    fs.renameSync(from, to);
  } catch {
    try {
      fs.copyFileSync(from, to);
      fs.unlinkSync(from);
    } catch {
      // ignora
    }
  }
}

function listBackupFilesRecursive(rootDir) {
  // Coleta todos os backups em rootDir e subpastas (apenas "pedido.backup.*.json")
  const out = [];
  if (!fs.existsSync(rootDir)) return out;

  const stack = [rootDir];

  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!e.isFile()) continue;
      if (!e.name.startsWith('pedido.backup.')) continue;
      if (!e.name.endsWith('.json')) continue;

      out.push({ name: e.name, fullPath: full });
    }
  }

  return out;
}

function removeEmptyDayDirs() {
  if (!fs.existsSync(BACKUP_ROOT)) return;

  let entries = [];
  try {
    entries = fs.readdirSync(BACKUP_ROOT, { withFileTypes: true });
  } catch {
    return;
  }

  let removed = 0;

  for (const e of entries) {
    if (!e.isDirectory()) continue;

    const isDay = /^\d{4}-\d{2}-\d{2}$/.test(e.name) || e.name === 'unknown-date';
    if (!isDay) continue;

    const dayDir = path.join(BACKUP_ROOT, e.name);

    let inner = [];
    try {
      inner = fs.readdirSync(dayDir);
    } catch {
      continue;
    }

    if (inner.length === 0) {
      try {
        fs.rmdirSync(dayDir);
        removed += 1;
      } catch {
        // ignora
      }
    }
  }

  if (removed > 0) dbg('removed empty day dirs', { removed });
}

function sweepRootBackupsToDayDirs() {
  // 1) Se backups forem parar na raiz do projeto, recolhe e joga em BACKUP_ROOT/<dia>
  // 2) Se backups ficarem direto em BACKUP_ROOT, também recolhe e joga em BACKUP_ROOT/<dia>
  try {
    ensureBackupRoot();

    let moved = 0;

    // (1) raiz do projeto
    try {
      const root = process.cwd();
      const files = fs.readdirSync(root);

      for (const f of files) {
        if (!f.startsWith('pedido.backup.')) continue;
        if (!f.endsWith('.json')) continue;

        const from = path.join(root, f);
        let stat;
        try {
          stat = fs.statSync(from);
        } catch {
          continue;
        }
        if (!stat.isFile()) continue;

        const day = dayFromBackupFilename(f) || 'unknown-date';
        const dayDir = path.join(BACKUP_ROOT, day);
        ensureDir(dayDir);

        const to = path.join(dayDir, f);
        safeMoveFile(from, to);
        moved += 1;
      }
    } catch {
      // ignora
    }

    // (2) arquivos soltos diretamente em BACKUP_ROOT
    let files2 = [];
    try {
      files2 = fs.readdirSync(BACKUP_ROOT, { withFileTypes: true });
    } catch {
      return;
    }

    for (const e of files2) {
      if (!e.isFile()) continue;
      const f = e.name;
      if (!f.startsWith('pedido.backup.')) continue;
      if (!f.endsWith('.json')) continue;

      const from = path.join(BACKUP_ROOT, f);
      const day = dayFromBackupFilename(f) || 'unknown-date';
      const dayDir = path.join(BACKUP_ROOT, day);
      ensureDir(dayDir);

      const to = path.join(dayDir, f);
      safeMoveFile(from, to);
      moved += 1;
    }

    if (moved > 0) dbg('sweep moved backups into day dirs', { moved });
  } catch {
    // ignora — backup nunca pode quebrar o fluxo do sistema
  }
}

function cleanupBackupsKeepLast(keep) {
  try {
    ensureBackupRoot();

    // Antes de limpar, recolhe possíveiss backups soltos
    sweepRootBackupsToDayDirs();

    const all = listBackupFilesRecursive(BACKUP_ROOT);

    // Ordena do mais novo para o mais antigo.
    // Preferência: timestamp no nome (quando possível). Fallback: mtime.
    const parsed = all.map((x) => {
      const prefix = 'pedido.backup.';
      const after = x.name.startsWith(prefix) ? x.name.slice(prefix.length) : '';
      const tsPart = after.split('.')[0] || ''; // "2026-02-07T18-39-47-384Z"
      let isoGuess = null;

      if (tsPart && tsPart.length >= 20 && tsPart.includes('T')) {
        try {
          const d = tsPart.slice(0, 10);
          const t = tsPart
            .slice(11)
            .replace(/-/g, ':')
            .replace(/:(\d{3})Z$/, '.$1Z');
          const guess = `${d}T${t}`;
          const dt = new Date(guess);
          if (!Number.isNaN(dt.getTime())) isoGuess = dt.getTime();
        } catch {
          // ignora
        }
      }

      let mtime = 0;
      try {
        const st = fs.statSync(x.fullPath);
        mtime = st.mtimeMs || 0;
      } catch {
        mtime = 0;
      }

      return { ...x, isoGuess, mtime };
    });

    parsed.sort((a, b) => {
      const ta = a.isoGuess ?? 0;
      const tb = b.isoGuess ?? 0;
      if (tb !== ta) return tb - ta;
      return (b.mtime ?? 0) - (a.mtime ?? 0);
    });

    if (keep <= 0) {
      let deleted = 0;
      for (const f of parsed) {
        try {
          fs.unlinkSync(f.fullPath);
          deleted += 1;
        } catch {
          // ignora
        }
      }
      if (deleted > 0) dbg('cleanup deleted backups (keep<=0)', { deleted });
      removeEmptyDayDirs();
      return;
    }

    const toKeep = parsed.slice(0, keep);
    const keepSet = new Set(toKeep.map((x) => x.fullPath));

    let deleted = 0;
    for (const f of parsed) {
      if (keepSet.has(f.fullPath)) continue;
      try {
        fs.unlinkSync(f.fullPath);
        deleted += 1;
      } catch {
        // ignora
      }
    }

    if (deleted > 0) dbg('cleanup pruned old backups', { keep, total: parsed.length, deleted });
    removeEmptyDayDirs();
  } catch {
    // ignora — backup nunca pode quebrar o fluxo do sistema
  }
}

function backupDb(reason = 'backup') {
  try {
    if (!fs.existsSync(DATA_FILE)) return;

    ensureBackupRoot();

    // recolhe qualquer backup solto (root do projeto ou BACKUP_ROOT)
    sweepRootBackupsToDayDirs();

    const nowIso = new Date().toISOString(); // "2026-02-07T18:39:47.384Z"
    const safeReason = sanitizeReason(reason);

    // ts compatível com Windows (sem ":" e ".")
    const ts = nowIso.replace(/:/g, '-').replace(/\./g, '-');
    const backupName = `pedido.backup.${ts}.${safeReason}.json`;

    const day = isoDayFromIsoTs(nowIso) || 'unknown-date';
    const dayDir = path.join(BACKUP_ROOT, day);
    ensureDir(dayDir);

    const backupPath = path.join(dayDir, backupName);
    fs.copyFileSync(DATA_FILE, backupPath);

    dbg('backup created', { reason: safeReason, day, file: backupName });

    cleanupBackupsKeepLast(BACKUP_KEEP);
  } catch {
    // nunca falhar o sistema por causa de backup
  }
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampPercent(v) {
  const n = toNumber(v, 0);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function getDefaultCommissionPercent() {
  return clampPercent(process.env.TURISTEI_PLATFORM_COMMISSION_PERCENT);
}

function recalcDerivedFromItems(itemsInput) {
  const items = asArray(itemsInput).map((i) => {
    const unitPrice = toNumber(i && i.unitPrice, 0);
    const quantity = toNumber(i && i.quantity, 0);
    const total = toNumber(i && i.total, unitPrice * quantity);

    return {
      serviceId: toNumber(i && i.serviceId, i && i.serviceId),
      providerId: toNumber(i && i.providerId, i && i.providerId),
      name: (i && i.name) ?? null,
      unitPrice,
      quantity,
      total,
      platform: (i && i.platform) ?? undefined,
      provider: (i && i.provider) ?? undefined,
    };
  });

  const gross = items.reduce((sum, i) => sum + toNumber(i.total, 0), 0);

  const providersMap = {};
  for (const i of items) {
    const pid = toNumber(i.providerId, NaN);
    if (!Number.isFinite(pid)) continue;
    providersMap[pid] = (providersMap[pid] || 0) + toNumber(i.total, 0);
  }

  const providers = Object.entries(providersMap).map(([providerId, subtotal]) => ({
    providerId: Number(providerId),
    subtotal,
  }));

  const totals = { gross, final: gross };
  return { items, providers, totals };
}

function enrichFinancial(orderLike) {
  const o = orderLike && typeof orderLike === 'object' ? orderLike : {};
  const items = asArray(o.items);

  const defaultPercent = getDefaultCommissionPercent();
  let platformCommissionTotal = 0;

  const enrichedItems = items.map((it) => {
    const total = toNumber(it && it.total, 0);

    const existingPercent =
      it && it.platform && Number.isFinite(Number(it.platform.commissionPercent))
        ? clampPercent(it.platform.commissionPercent)
        : null;

    const percent = existingPercent !== null ? existingPercent : defaultPercent;

    const commissionValue = (total * percent) / 100;
    const netValue = total - commissionValue;

    platformCommissionTotal += commissionValue;

    return {
      ...it,
      platform: { commissionPercent: percent, commissionValue },
      provider: { netValue },
    };
  });

  const payoutsMap = {};
  for (const it of enrichedItems) {
    const pid = toNumber(it && it.providerId, NaN);
    if (!Number.isFinite(pid)) continue;

    const gross = toNumber(it && it.total, 0);
    const commissionValue = toNumber(it && it.platform && it.platform.commissionValue, 0);
    const net = toNumber(it && it.provider && it.provider.netValue, gross - commissionValue);

    if (!payoutsMap[pid]) {
      payoutsMap[pid] = { providerId: pid, gross: 0, platformCommissionValue: 0, net: 0 };
    }

    payoutsMap[pid].gross += gross;
    payoutsMap[pid].platformCommissionValue += commissionValue;
    payoutsMap[pid].net += net;
  }

  const providerPayouts = Object.values(payoutsMap);

  const financial = {
    platformCommissionPercent: defaultPercent,
    platformCommissionTotal,
    providerPayouts,
    generatedAt: now(),
  };

  return { items: enrichedItems, financial };
}

function normalizeOrder(order) {
  const o = order && typeof order === 'object' ? order : {};

  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : now();
  const updatedAt = typeof o.updatedAt === 'string' ? o.updatedAt : createdAt;

  const derived = recalcDerivedFromItems(o.items);
  const enriched = enrichFinancial({ items: derived.items });

  return {
    id: typeof o.id === 'string' ? o.id : `ord_${Date.now()}`,
    customer: o.customer ?? null,
    status: typeof o.status === 'string' ? o.status : 'CREATED',
    history: asArray(o.history),
    createdAt,
    updatedAt,
    items: enriched.items,
    totals: derived.totals,
    providers: derived.providers,
    financial: enriched.financial,
  };
}

function loadDb() {
  if (!fs.existsSync(DATA_FILE)) return { orders: [] };

  const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  if (!raw) return { orders: [] };

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { orders: parsed };
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.orders)) return parsed;

    backupDb('invalid-structure');
    return { orders: [] };
  } catch {
    backupDb('invalid-json');
    return { orders: [] };
  }
}

function saveDb(db, reason = 'save') {
  const safeDb = { orders: Array.isArray(db && db.orders) ? db.orders : [] };
  backupDb(reason);
  fs.writeFileSync(DATA_FILE, JSON.stringify(safeDb, null, 2), 'utf-8');
}

function isAdmin(user) {
  return !!(user && typeof user === 'object' && String(user.role || '').toLowerCase() === 'admin');
}

function getUserId(user) {
  if (!user || typeof user !== 'object') return '';
  if (!user.id) return '';
  return String(user.id);
}

function isOwnedByUser(order, user) {
  const uid = getUserId(user);
  if (!uid) return false;

  const customer = order && order.customer;
  const customerId =
    customer && typeof customer === 'object' && customer.id !== undefined && customer.id !== null
      ? String(customer.id)
      : '';

  return customerId === uid;
}

function readAllOrders(opts = undefined) {
  const user =
    opts && typeof opts === 'object' && opts.user && typeof opts.user === 'object' ? opts.user : null;

  const db = loadDb();
  const orders = asArray(db.orders);

  const normalized = orders.map(normalizeOrder);

  const changed =
    orders.length !== normalized.length ||
    orders.some((o, idx) => JSON.stringify(o) !== JSON.stringify(normalized[idx]));

  if (changed) saveDb({ orders: normalized }, 'normalized-on-read');

  if (!user) return [];
  if (isAdmin(user)) return normalized;

  return normalized.filter((o) => isOwnedByUser(o, user));
}

function findOrderById(arg) {
  const id =
    typeof arg === 'string'
      ? arg
      : arg && typeof arg === 'object' && typeof arg.id === 'string'
        ? arg.id
        : '';

  const user =
    arg && typeof arg === 'object' && arg.user && typeof arg.user === 'object' ? arg.user : null;

  if (!id || !user) return null;

  const orders = readAllOrders({ user });
  return orders.find((o) => o.id === id) || null;
}

function insertOrder(order) {
  const db = loadDb();
  const orders = asArray(db.orders).map(normalizeOrder);

  const normalized = normalizeOrder(order);
  orders.push(normalized);

  saveDb({ orders }, 'insert');
  return normalized;
}

/**
 * Update controlado (ownership):
 * - admin pode atualizar qualquer pedido
 * - usuário comum só pode atualizar se for dono
 *
 * Compat:
 * - updateOrderById({ id, order, user })
 */
function updateOrderById({ id, order, user } = {}) {
  if (typeof id !== 'string' || !id) return null;
  if (!user || typeof user !== 'object') return null;

  const db = loadDb();
  const orders = asArray(db.orders).map(normalizeOrder);

  const idx = orders.findIndex((o) => o && o.id === id);
  if (idx < 0) return null;

  const current = orders[idx];

  if (!isAdmin(user) && !isOwnedByUser(current, user)) {
    return null;
  }

  const merged = {
    ...current,
    ...(order && typeof order === 'object' ? order : {}),
    id: current.id,
  };

  const normalized = normalizeOrder(merged);
  orders[idx] = normalized;

  saveDb({ orders }, 'update');
  return normalized;
}

module.exports = {
  readAllOrders,
  findOrderById,
  insertOrder,
  updateOrderById,
};
