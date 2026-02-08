// migrar_pedido_json.js
const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "pedido.json");

function nowIso() {
  return new Date().toISOString();
}

function toNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function migrateOne(old) {
  // Já está no formato novo?
  if (old && typeof old === "object" && Array.isArray(old.items) && old.totals && old.status) {
    return old;
  }

  // Formato antigo: { id, status, totalBruto, totalFinal, itens: [] }
  const oldId = old?.id;
  const legacyItems = Array.isArray(old?.itens) ? old.itens : [];

  const items = legacyItems.map((it) => ({
    serviceId: toNumber(it.serviceId),
    providerId: toNumber(it.providerId),
    name: it.nome ?? it.name ?? "",
    unitPrice: toNumber(it.unitPrice),
    quantity: toNumber(it.quantity, 1),
    total: toNumber(it.total),
  }));

  const gross =
    items.length > 0
      ? items.reduce((sum, i) => sum + toNumber(i.total), 0)
      : toNumber(old?.totalBruto);

  const providersMap = new Map();
  for (const it of items) {
    const pid = String(it.providerId ?? "");
    if (!pid) continue;
    providersMap.set(pid, (providersMap.get(pid) ?? 0) + toNumber(it.total));
  }

  const providers = Array.from(providersMap.entries()).map(([providerId, subtotal]) => ({
    providerId: toNumber(providerId),
    subtotal: toNumber(subtotal),
  }));

  const at = "2026-01-29T00:00:00.000Z"; // marca migração de legado
  const createdAt = at;

  return {
    id: `ord_${oldId}`,
    customer: null,
    items,
    totals: {
      gross: toNumber(gross),
      final: toNumber(old?.totalFinal ?? gross),
    },
    providers,
    status: "CREATED",
    history: [
      {
        at,
        type: "ORDER_MIGRATED",
        message: "Pedido antigo migrado para o formato novo",
      },
    ],
    createdAt,
    updatedAt: createdAt,
  };
}

function main() {
  if (!fs.existsSync(FILE)) {
    console.log("pedido.json não existe. Nada a migrar.");
    process.exit(0);
  }

  const raw = fs.readFileSync(FILE, "utf-8");
  const db = JSON.parse(raw);

  const orders = Array.isArray(db?.orders) ? db.orders : [];
  const migrated = orders.map(migrateOne);

  fs.writeFileSync(FILE, JSON.stringify({ orders: migrated }, null, 2), "utf-8");
  console.log(`OK: Migrados ${migrated.length} pedidos para o formato novo.`);
}

main();
