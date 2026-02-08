'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'pedido.json');

function fail(message, code = 1) {
  process.stderr.write(String(message) + '\n');
  process.exit(code);
}

function loadDb() {
  if (!fs.existsSync(DATA_FILE)) {
    fail(`Arquivo não encontrado: ${DATA_FILE}`);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  if (!raw) return { orders: [] };

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return { orders: parsed };

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.orders)) {
      return parsed;
    }

    fail('pedido.json com estrutura inválida (esperado array ou { orders: [] }).');
  } catch {
    fail('pedido.json com JSON inválido.');
  }
}

function main() {
  const id = process.argv[2] ? String(process.argv[2]).trim() : '';

  if (!id) {
    fail('Uso: node tools/print-order.js <orderId>');
  }

  const db = loadDb();
  const orders = Array.isArray(db.orders) ? db.orders : [];

  const found = orders.find((o) => o && typeof o === 'object' && o.id === id);

  if (!found) {
    fail(`Order not found: ${id}`, 2);
  }

  process.stdout.write(JSON.stringify(found, null, 2) + '\n');
}

main();
