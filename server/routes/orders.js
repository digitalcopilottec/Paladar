import { Router } from 'express';
import db from '../db.js';
import { authRequired } from '../auth.js';
import { priceItem, saveItemOptions, attachOptions } from '../options.js';
import { consumeForOrder, freezeCosts } from '../stock.js';

const router = Router();
router.use(authRequired);

// Arredonda para centavos — evita lixo de ponto flutuante (ex.: 89.97999999999999).
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

// Recalcula subtotal/total de um pedido.
function recalc(orderId) {
  const items = db.prepare('SELECT total FROM order_items WHERE order_id = ?').all(orderId);
  const subtotal = r2(items.reduce((s, i) => s + i.total, 0));
  const o = db.prepare('SELECT service_fee, discount, delivery_fee FROM orders WHERE id = ?').get(orderId);
  const total = r2(Math.max(
    0, subtotal + (o.service_fee || 0) + (o.delivery_fee || 0) - (o.discount || 0)
  ));
  db.prepare('UPDATE orders SET subtotal = ?, total = ? WHERE id = ?').run(subtotal, total, orderId);
}

function fullOrder(id) {
  const order = db.prepare(
    `SELECT o.*, t.name AS table_name FROM orders o
       LEFT JOIN restaurant_tables t ON t.id = o.table_id
      WHERE o.id = ?`
  ).get(id);
  if (!order) return null;
  order.items = attachOptions(
    db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(id)
  );
  order.payments = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id').all(id);
  return order;
}

// Lista pedidos abertos (para o PDV / salão)
router.get('/', (req, res) => {
  const status = req.query.status || 'aberto';
  const rows = db.prepare(
    `SELECT o.*, t.name AS table_name, u.name AS waiter_name
       FROM orders o
       LEFT JOIN restaurant_tables t ON t.id = o.table_id
       LEFT JOIN users u ON u.id = o.waiter_id
      WHERE o.status = ? ORDER BY o.opened_at DESC`
  ).all(status);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const order = fullOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(order);
});

// Abre um novo pedido
router.post('/', (req, res) => {
  const { type = 'mesa', table_id = null, customer_name = null } = req.body || {};
  const code = 'P' + Date.now().toString().slice(-6);
  const info = db.prepare(
    `INSERT INTO orders (code, type, table_id, customer_name, waiter_id, opened_by)
     VALUES (?,?,?,?,?,?)`
  ).run(code, type, table_id, customer_name, req.user.id, req.user.id);
  if (table_id) db.prepare(`UPDATE restaurant_tables SET status='ocupada' WHERE id=?`).run(table_id);
  res.status(201).json(fullOrder(info.lastInsertRowid));
});

// Adiciona item ao pedido (com adicionais/opções)
router.post('/:id/items', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order || order.status !== 'aberto') return res.status(400).json({ error: 'Pedido indisponível' });
  const { product_id, qty = 1, notes = '', options = [] } = req.body || {};

  let priced;
  try { priced = priceItem(product_id, options); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  const q = Math.max(1, Number(qty) || 1);
  const total = r2(priced.unitPrice * q);
  const info = db.prepare(
    `INSERT INTO order_items (order_id, product_id, name, qty, unit_price, total, notes)
     VALUES (?,?,?,?,?,?,?)`
  ).run(order.id, priced.product.id, priced.product.name, q, priced.unitPrice, total, notes);
  saveItemOptions(info.lastInsertRowid, priced.chosen);

  recalc(order.id);
  res.status(201).json(fullOrder(order.id));
});

// Altera quantidade de um item
router.put('/:id/items/:itemId', (req, res) => {
  const item = db.prepare('SELECT * FROM order_items WHERE id = ? AND order_id = ?').get(req.params.itemId, req.params.id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });
  const qty = Number(req.body?.qty ?? item.qty);
  if (qty <= 0) {
    db.prepare('DELETE FROM order_items WHERE id = ?').run(item.id);
  } else {
    db.prepare('UPDATE order_items SET qty = ?, total = ? WHERE id = ?').run(qty, r2(qty * item.unit_price), item.id);
  }
  recalc(req.params.id);
  res.json(fullOrder(req.params.id));
});

router.delete('/:id/items/:itemId', (req, res) => {
  db.prepare('DELETE FROM order_items WHERE id = ? AND order_id = ?').run(req.params.itemId, req.params.id);
  recalc(req.params.id);
  res.json(fullOrder(req.params.id));
});

// Ajusta taxa de serviço / desconto
router.put('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  const { service_fee, discount, customer_name, notes } = req.body || {};
  db.prepare('UPDATE orders SET service_fee=?, discount=?, customer_name=?, notes=? WHERE id=?')
    .run(service_fee ?? order.service_fee, discount ?? order.discount,
         customer_name ?? order.customer_name, notes ?? order.notes, order.id);
  recalc(order.id);
  res.json(fullOrder(order.id));
});

// Fecha o pedido com pagamentos e lança no caixa
router.post('/:id/close', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order || order.status !== 'aberto') return res.status(400).json({ error: 'Pedido indisponível' });
  const payments = Array.isArray(req.body?.payments) ? req.body.payments : [];
  if (payments.length === 0) return res.status(400).json({ error: 'Informe ao menos uma forma de pagamento' });

  const tx = db.transaction(() => {
    const session = db.prepare(`SELECT * FROM cash_sessions WHERE status='aberto' ORDER BY id DESC LIMIT 1`).get();
    for (const pay of payments) {
      // Arredonda tudo: 150 - 102.90 dá 47.099999999999994 em float, e isso ia gravado.
      const amount = r2(pay.amount);
      const received = r2(pay.received) || amount;
      const change = pay.method === 'dinheiro' ? r2(Math.max(0, received - amount)) : 0;
      db.prepare(
        `INSERT INTO payments (order_id, method, amount, received, change, user_id)
         VALUES (?,?,?,?,?,?)`
      ).run(order.id, pay.method, amount, received, change, req.user.id);
      if (session) {
        db.prepare(
          `INSERT INTO cash_movements (session_id, type, amount, description, user_id)
           VALUES (?, 'venda', ?, ?, ?)`
        ).run(session.id, amount, `Venda ${order.code} (${pay.method})`, req.user.id);
      }
    }
    // Congela o custo e dá baixa no estoque DENTRO da transação:
    // se algo falhar, venda e estoque voltam juntos e não divergem.
    freezeCosts(order.id);
    consumeForOrder(order.id, req.user.id);

    // Mesa e delivery pagam DEPOIS de consumir: se está pagando, já comeu/recebeu.
    // Tira os itens do KDS. (Totem/balcão pagam antes e não passam por aqui.)
    if (order.type === 'mesa' || order.type === 'delivery') {
      db.prepare(
        `UPDATE order_items SET status='entregue' WHERE order_id=? AND status!='entregue'`
      ).run(order.id);
    }

    db.prepare(`UPDATE orders SET status='fechado', closed_at=datetime('now','localtime') WHERE id=?`).run(order.id);
    if (order.table_id) db.prepare(`UPDATE restaurant_tables SET status='livre' WHERE id=?`).run(order.table_id);
  });
  tx();
  res.json(fullOrder(order.id));
});

router.post('/:id/cancel', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  db.prepare(`UPDATE orders SET status='cancelado', closed_at=datetime('now','localtime') WHERE id=?`).run(order.id);
  if (order.table_id) db.prepare(`UPDATE restaurant_tables SET status='livre' WHERE id=?`).run(order.table_id);
  res.json(fullOrder(order.id));
});

export default router;
