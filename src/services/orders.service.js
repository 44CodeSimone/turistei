'use strict';

const servicesService = require('./services.service');
const ordersRepository = require('../repositories/orders.repository');

const ORDER_STATUS = {
  CREATED: 'CREATED',
  PAID: 'PAID',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
};

const ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.CREATED]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

function now() {
  return new Date().toISOString();
}

function generateId() {
  return 'ord_' + Date.now();
}

function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function getPlatformCommissionPercent() {
  const raw = process.env.TURISTEI_PLATFORM_COMMISSION_PERCENT;

  // Se não estiver definido, default seguro: 0 (sem cobrança)
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return 0;
  }

  const percent = Number(raw);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    const err = new Error(
      'Config inválida: TURISTEI_PLATFORM_COMMISSION_PERCENT deve ser um número entre 0 e 100.'
    );
    err.status = 500;
    err.code = 'INVALID_PLATFORM_COMMISSION_PERCENT';
    throw err;
  }

  return percent;
}

function requireUser(user) {
  if (!user || typeof user !== 'object') {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!user.id || !user.email) {
    const err = new Error('Unauthorized');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }
}

function notFoundOrder(id) {
  const err = new Error(`Pedido não encontrado: ${id}`);
  err.status = 404;
  err.code = 'ORDER_NOT_FOUND';
  throw err;
}

function invalidTransition(fromStatus, toStatus) {
  const err = new Error(`Transição inválida: ${fromStatus} -> ${toStatus}`);
  err.status = 409;
  err.code = 'INVALID_ORDER_TRANSITION';
  err.details = { fromStatus, toStatus };
  throw err;
}

function normalizeStatusInput(status) {
  const s = String(status || '').trim().toUpperCase();

  // aceita também "CANCELED" (1 L) como alias, mas salva canonical "CANCELLED"
  if (s === 'CANCELED') return ORDER_STATUS.CANCELLED;

  return s;
}

function appendHistory(order, { type, message, at }) {
  const history = Array.isArray(order && order.history) ? order.history : [];
  return [
    ...history,
    {
      at: at || now(),
      type: String(type || 'ORDER_EVENT'),
      message: String(message || ''),
    },
  ];
}

/**
 * Persistência do update (repository).
 * Ainda não existe no repo? Então retorna 501, sem quebrar o restante do sistema.
 */
function persistOrderUpdate(updatedOrder, { user } = {}) {
  // Preferência 1: updateOrderById({ id, order, user })
  if (typeof ordersRepository.updateOrderById === 'function') {
    return ordersRepository.updateOrderById({ id: updatedOrder.id, order: updatedOrder, user });
  }

  // Preferência 2: updateOrder(order)
  if (typeof ordersRepository.updateOrder === 'function') {
    return ordersRepository.updateOrder(updatedOrder);
  }

  const err = new Error('Repository não implementa update de pedido ainda.');
  err.status = 501;
  err.code = 'NOT_IMPLEMENTED_ORDER_UPDATE';
  throw err;
}

/**
 * Regra Big Tech:
 * - status muda só via máquina de estados
 * - sempre gera evento em history
 * - atualizadoAt sempre muda
 * - nada mexe em financeiro/itens/totals aqui
 */
function transitionOrderStatus({ id, toStatus, user, eventType, eventMessage } = {}) {
  requireUser(user);

  const order = ordersRepository.findOrderById({ id, user });
  if (!order) notFoundOrder(id);

  const from = normalizeStatusInput(order.status);
  const to = normalizeStatusInput(toStatus);

  const allowed = ORDER_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    invalidTransition(from, to);
  }

  const updatedAt = now();

  const updatedOrder = {
    ...order,
    status: to,
    updatedAt,
    history: appendHistory(order, {
      at: updatedAt,
      type: eventType,
      message: eventMessage,
    }),
  };

  return persistOrderUpdate(updatedOrder, { user });
}

function createOrder(payload, { user } = {}) {
  requireUser(user);

  const services = servicesService.listServices();

  const inputItems = Array.isArray(payload && payload.items) ? payload.items : [];

  const acceptedItems = inputItems
    .map((item) => {
      const serviceId = Number(item && item.serviceId);
      if (!Number.isFinite(serviceId)) return null;

      const service = services.find((s) => s.id === serviceId);
      if (!service) return null;

      const quantity = Number(item && item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return null;

      const unitPrice = Number(service.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return null;

      const total = unitPrice * quantity;

      return {
        serviceId: service.id,
        providerId: service.providerId,
        name: service.name,
        unitPrice,
        quantity,
        total,
      };
    })
    .filter(Boolean);

  if (acceptedItems.length === 0) {
    const err = new Error('Nenhum item válido encontrado.');
    err.status = 400;
    err.code = 'NO_VALID_ITEMS';
    throw err;
  }

  const createdAt = now();

  // BLINDAGEM: customer SEMPRE vem do token (req.user), nunca do body
  const customer = {
    id: String(user.id),
    email: String(user.email),
  };

  // FINANCEIRO (marketplace real): comissão por item e repasses por prestador
  const platformCommissionPercent = getPlatformCommissionPercent();

  const itemsWithFinancial = acceptedItems.map((it) => {
    const itemGross = roundMoney(it.total);

    const commissionValue = roundMoney((itemGross * platformCommissionPercent) / 100);
    const providerNetValue = roundMoney(itemGross - commissionValue);

    return {
      ...it,
      total: itemGross,
      platform: {
        commissionPercent: platformCommissionPercent,
        commissionValue,
      },
      provider: {
        netValue: providerNetValue,
      },
    };
  });

  // Agregação por prestador (repasses separados, caixa não mistura)
  const providerMap = new Map();
  let platformCommissionTotal = 0;

  for (const it of itemsWithFinancial) {
    const providerId = Number(it.providerId);
    const gross = roundMoney(it.total);
    const commission = roundMoney(it.platform && it.platform.commissionValue);
    const net = roundMoney(it.provider && it.provider.netValue);

    platformCommissionTotal = roundMoney(platformCommissionTotal + commission);

    if (!providerMap.has(providerId)) {
      providerMap.set(providerId, {
        providerId,
        gross: 0,
        platformCommissionValue: 0,
        net: 0,
      });
    }

    const agg = providerMap.get(providerId);
    agg.gross = roundMoney(agg.gross + gross);
    agg.platformCommissionValue = roundMoney(agg.platformCommissionValue + commission);
    agg.net = roundMoney(agg.net + net);
  }

  const providerPayouts = Array.from(providerMap.values());

  const order = {
    id: generateId(),
    customer,
    items: itemsWithFinancial,
    status: ORDER_STATUS.CREATED,
    history: [
      {
        at: createdAt,
        type: 'ORDER_CREATED',
        message: 'Pedido criado',
      },
    ],
    financial: {
      platformCommissionPercent,
      platformCommissionTotal,
      providerPayouts,
      generatedAt: createdAt,
    },
    createdAt,
    updatedAt: createdAt,
  };

  return ordersRepository.insertOrder(order);
}

function listOrders({ user } = {}) {
  requireUser(user);
  return ordersRepository.readAllOrders({ user });
}

function getOrderById({ id, user } = {}) {
  requireUser(user);
  return ordersRepository.findOrderById({ id, user });
}

// Ações Big Tech (ciclo de vida com eventos)
function payOrder({ id, user } = {}) {
  return transitionOrderStatus({
    id,
    user,
    toStatus: ORDER_STATUS.PAID,
    eventType: 'ORDER_PAID',
    eventMessage: 'Pagamento confirmado',
  });
}

function confirmOrder({ id, user } = {}) {
  return transitionOrderStatus({
    id,
    user,
    toStatus: ORDER_STATUS.CONFIRMED,
    eventType: 'ORDER_CONFIRMED',
    eventMessage: 'Pedido confirmado',
  });
}

function completeOrder({ id, user } = {}) {
  return transitionOrderStatus({
    id,
    user,
    toStatus: ORDER_STATUS.COMPLETED,
    eventType: 'ORDER_COMPLETED',
    eventMessage: 'Pedido concluído',
  });
}

function cancelOrder({ id, user, reason } = {}) {
  const msg = reason ? `Pedido cancelado: ${reason}` : 'Pedido cancelado';

  return transitionOrderStatus({
    id,
    user,
    toStatus: ORDER_STATUS.CANCELLED,
    eventType: 'ORDER_CANCELLED',
    eventMessage: msg,
  });
}

module.exports = {
  ORDER_STATUS,
  createOrder,
  listOrders,
  getOrderById,
  // novos exports (não quebram nada)
  transitionOrderStatus,
  payOrder,
  confirmOrder,
  completeOrder,
  cancelOrder,
};
