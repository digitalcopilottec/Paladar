import { Router } from 'express';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';
import { priceItem, saveItemOptions, attachOptions } from '../options.js';
import { r2 } from '../stock.js';

const router = Router();
router.use(authRequired);

// Só dígitos: o atendente digita (11) 98888-7777 e o banco guarda 11988887777.
const normPhone = (p) => String(p || '').replace(/\D/g, '');

function fullDelivery(orderId) {
  const d = db.prepare(
    `SELECT d.*, o.code, o.subtotal, o.total, o.delivery_fee, o.status AS order_status,
            o.opened_at, o.closed_at, c.name AS courier_name
       FROM deliveries d
       JOIN orders o ON o.id = d.order_id
       LEFT JOIN couriers c ON c.id = d.courier_id
      WHERE d.order_id = ?`
  ).get(orderId);
  if (!d) return null;
  d.items = attachOptions(
    db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(orderId)
  );
  return d;
}

// --- Clientes -------------------------------------------------
// Busca pelo telefone: repetiu o cliente, o endereço já vem preenchido.
router.get('/customer', (req, res) => {
  const phone = normPhone(req.query.phone);
  if (!phone) return res.status(400).json({ error: 'Informe o telefone' });
  const c = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  if (!c) return res.json(null);
  c.pedidos = db.prepare(
    `SELECT COUNT(*) n FROM deliveries WHERE customer_id = ?`
  ).get(c.id).n;
  res.json(c);
});

router.get('/customers', (req, res) => {
  res.json(db.prepare(
    `SELECT c.*, COUNT(d.id) pedidos
       FROM customers c LEFT JOIN deliveries d ON d.customer_id = c.id
      GROUP BY c.id ORDER BY c.name`
  ).all());
});

// --- Entregadores ---------------------------------------------
router.get('/couriers', (req, res) => {
  res.json(db.prepare('SELECT * FROM couriers WHERE active = 1 ORDER BY name').all());
});

router.post('/couriers', requireRole('gerente'), (req, res) => {
  const { name, phone = '' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const info = db.prepare('INSERT INTO couriers (name, phone) VALUES (?,?)').run(name, phone);
  res.status(201).json(db.prepare('SELECT * FROM couriers WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/couriers/:id', requireRole('gerente'), (req, res) => {
  db.prepare('UPDATE couriers SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Pedidos de delivery --------------------------------------
router.get('/', (req, res) => {
  // Painel: tudo que ainda não foi entregue, mais as entregas de hoje.
  const rows = db.prepare(
    `SELECT d.order_id FROM deliveries d
       JOIN orders o ON o.id = d.order_id
      WHERE o.status != 'cancelado'
        AND (d.status != 'entregue' OR date(d.delivered_at) = date('now','localtime'))
      ORDER BY d.id DESC`
  ).all();
  res.json(rows.map(r => fullDelivery(r.order_id)));
});

router.get('/:orderId', (req, res) => {
  const d = fullDelivery(req.params.orderId);
  if (!d) return res.status(404).json({ error: 'Entrega não encontrada' });
  res.json(d);
});

// Cria o pedido de delivery inteiro numa tacada (cliente + endereço + itens).
router.post('/', (req, res) => {
  const {
    customer_name, phone, street = '', number = '', complement = '',
    district = '', city = '', reference = '', notes = '',
    delivery_fee = 0, items = [], save_customer = true,
  } = req.body || {};

  if (!customer_name || !normPhone(phone))
    return res.status(400).json({ error: 'Informe nome e telefone do cliente' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'O pedido está sem itens' });
  if (!street) return res.status(400).json({ error: 'Informe o endereço de entrega' });

  // Valida e precifica antes de gravar — mesmo princípio do tablet.
  let priced;
  try {
    priced = items.map(it => ({
      ...priceItem(it.product_id, it.options),
      qty: Math.max(1, Number(it.qty) || 1),
      notes: it.notes || '',
    }));
  } catch (e) { return res.status(400).json({ error: e.message }); }

  const ph = normPhone(phone);
  const fee = r2(Number(delivery_fee) || 0);

  const tx = db.transaction(() => {
    // Cadastro do cliente: cria ou atualiza o último endereço usado.
    let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(ph);
    if (save_customer) {
      if (customer) {
        db.prepare(
          `UPDATE customers SET name=?, street=?, number=?, complement=?,
                  district=?, city=?, reference=? WHERE id=?`
        ).run(customer_name, street, number, complement, district, city, reference, customer.id);
      } else {
        const ci = db.prepare(
          `INSERT INTO customers (name, phone, street, number, complement, district, city, reference)
           VALUES (?,?,?,?,?,?,?,?)`
        ).run(customer_name, ph, street, number, complement, district, city, reference);
        customer = { id: ci.lastInsertRowid };
      }
    }

    const code = 'D' + Date.now().toString().slice(-6);
    const oi = db.prepare(
      `INSERT INTO orders (code, type, customer_name, opened_by, delivery_fee, notes)
       VALUES (?, 'delivery', ?, ?, ?, ?)`
    ).run(code, customer_name, req.user.id, fee, notes);
    const orderId = oi.lastInsertRowid;

    for (const it of priced) {
      const ii = db.prepare(
        `INSERT INTO order_items (order_id, product_id, name, qty, unit_price, total, notes)
         VALUES (?,?,?,?,?,?,?)`
      ).run(orderId, it.product.id, it.product.name, it.qty, it.unitPrice,
            r2(it.unitPrice * it.qty), it.notes);
      saveItemOptions(ii.lastInsertRowid, it.chosen);
    }

    db.prepare(
      `INSERT INTO deliveries (order_id, customer_id, customer_name, phone, street, number,
                               complement, district, city, reference, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).run(orderId, customer?.id || null, customer_name, ph, street, number,
          complement, district, city, reference, notes);

    // Recalcula com a taxa de entrega inclusa.
    const items2 = db.prepare('SELECT total FROM order_items WHERE order_id = ?').all(orderId);
    const subtotal = r2(items2.reduce((s, i) => s + i.total, 0));
    db.prepare('UPDATE orders SET subtotal = ?, total = ? WHERE id = ?')
      .run(subtotal, r2(subtotal + fee), orderId);

    return orderId;
  });

  const orderId = tx();
  res.status(201).json(fullDelivery(orderId));
});

// Despacha: entrega sai para a rota com um entregador.
router.post('/:orderId/dispatch', (req, res) => {
  const d = db.prepare('SELECT * FROM deliveries WHERE order_id = ?').get(req.params.orderId);
  if (!d) return res.status(404).json({ error: 'Entrega não encontrada' });
  if (d.status !== 'pendente') return res.status(400).json({ error: 'Esta entrega já saiu' });
  const { courier_id } = req.body || {};
  if (!courier_id) return res.status(400).json({ error: 'Escolha o entregador' });

  db.prepare(
    `UPDATE deliveries SET status='saiu', courier_id=?, dispatched_at=datetime('now','localtime')
      WHERE order_id=?`
  ).run(courier_id, d.order_id);
  res.json(fullDelivery(d.order_id));
});

router.post('/:orderId/delivered', (req, res) => {
  const d = db.prepare('SELECT * FROM deliveries WHERE order_id = ?').get(req.params.orderId);
  if (!d) return res.status(404).json({ error: 'Entrega não encontrada' });
  db.prepare(
    `UPDATE deliveries SET status='entregue', delivered_at=datetime('now','localtime') WHERE order_id=?`
  ).run(d.order_id);
  res.json(fullDelivery(d.order_id));
});

export default router;
