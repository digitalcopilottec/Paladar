import { Router } from 'express';
import db from '../db.js';
import { priceItem, saveItemOptions, attachOptions, groupsForProduct } from '../options.js';
import { consumeForOrder, freezeCosts } from '../stock.js';
import { getUploadedUrls } from './upload.js';

// Rotas públicas para o TABLET DO CLIENTE (sem login).
// Escopo restrito: ler cardápio e enviar pedidos para a comanda da própria mesa.
const router = Router();

const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

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
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;
  order.items = attachOptions(
    db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(id)
  );
  return order;
}

// Logo/fundo enviados em Marca — a tela do cliente não tem login para pedir com auth.
router.get('/marca', (req, res) => res.json(getUploadedUrls()));

// Cardápio (categorias + produtos ativos, cada produto já com seus grupos de opções)
router.get('/menu', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE active = 1 ORDER BY sort, name').all();
  const products = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort, name').all();
  for (const p of products) p.groups = groupsForProduct(p.id);
  res.json({ categories, products });
});

// Lista de mesas (para o cliente/atendente escolher onde está sentado)
router.get('/tables', (req, res) => {
  res.json(db.prepare('SELECT id, name, status FROM restaurant_tables ORDER BY id').all());
});

// O totem precisa saber, ANTES de o cliente escolher, se ainda há mesa livre.
router.get('/totem/status', (req, res) => {
  const livres = db.prepare(`SELECT COUNT(*) n FROM restaurant_tables WHERE status='livre'`).get().n;
  res.json({ mesas_livres: livres, aceita_local: livres > 0 });
});

/**
 * Pedido do TOTEM: cliente monta, escolhe comer no local ou marmita, e PAGA na hora.
 * Como já vem pago, a comanda nasce fechada — a cozinha enxerga pelo status do item.
 */
router.post('/totem/order', (req, res) => {
  const { items = [], mode, payment_method, customer_name = null } = req.body || {};

  if (!['local', 'viagem'].includes(mode))
    return res.status(400).json({ error: 'Escolha comer no local ou marmita para viagem' });
  if (!['credito', 'debito', 'pix'].includes(payment_method))
    return res.status(400).json({ error: 'Forma de pagamento inválida' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Pedido sem itens' });

  // Valida e precifica no servidor — o totem fica exposto ao público.
  let priced;
  try {
    priced = items.map(it => ({
      ...priceItem(it.product_id, it.options),
      qty: Math.max(1, Number(it.qty) || 1),
      notes: it.notes || '',
    }));
  } catch (e) { return res.status(400).json({ error: e.message }); }

  const tx = db.transaction(() => {
    // Comer no local: o sistema escolhe a mesa. Se lotou, só marmita.
    let table = null;
    if (mode === 'local') {
      table = db.prepare(`SELECT * FROM restaurant_tables WHERE status='livre' ORDER BY id LIMIT 1`).get();
      if (!table) throw new Error('SEM_MESA');
      db.prepare(`UPDATE restaurant_tables SET status='ocupada' WHERE id=?`).run(table.id);
    }

    const code = 'T' + Date.now().toString().slice(-6);
    const oi = db.prepare(
      `INSERT INTO orders (code, type, table_id, customer_name)
       VALUES (?,?,?,?)`
    ).run(code, mode === 'local' ? 'mesa' : 'viagem', table?.id || null, customer_name);
    const orderId = oi.lastInsertRowid;

    for (const it of priced) {
      const ii = db.prepare(
        `INSERT INTO order_items (order_id, product_id, name, qty, unit_price, total, notes)
         VALUES (?,?,?,?,?,?,?)`
      ).run(orderId, it.product.id, it.product.name, it.qty, it.unitPrice,
            r2(it.unitPrice * it.qty), it.notes);
      saveItemOptions(ii.lastInsertRowid, it.chosen);
    }

    recalc(orderId);
    const total = db.prepare('SELECT total FROM orders WHERE id = ?').get(orderId).total;

    // Pago no ato. user_id fica nulo: quem operou foi o cliente, não um funcionário.
    db.prepare(
      `INSERT INTO payments (order_id, method, amount, received, change, user_id)
       VALUES (?,?,?,?,0,NULL)`
    ).run(orderId, payment_method, total, total);

    const session = db.prepare(`SELECT * FROM cash_sessions WHERE status='aberto' ORDER BY id DESC LIMIT 1`).get();
    if (session) {
      db.prepare(
        `INSERT INTO cash_movements (session_id, type, amount, description, user_id)
         VALUES (?, 'venda', ?, ?, NULL)`
      ).run(session.id, total, `Totem ${code} (${payment_method})`);
    }

    freezeCosts(orderId);
    consumeForOrder(orderId, null);

    db.prepare(
      `UPDATE orders SET status='fechado', closed_at=datetime('now','localtime') WHERE id=?`
    ).run(orderId);

    return { orderId, code, total, table };
  });

  let out;
  try { out = tx(); }
  catch (e) {
    if (e.message === 'SEM_MESA')
      return res.status(409).json({ error: 'SEM_MESA', message: 'Todas as mesas estão ocupadas no momento' });
    return res.status(400).json({ error: e.message });
  }

  res.status(201).json({
    code: out.code,
    total: out.total,
    mode,
    table_name: out.table?.name || null,
    payment_method,
  });
});

// Comanda aberta da mesa (o que já foi pedido)
router.get('/table/:id/order', (req, res) => {
  const order = db.prepare(`SELECT * FROM orders WHERE table_id = ? AND status='aberto' ORDER BY id DESC LIMIT 1`)
    .get(req.params.id);
  res.json(order ? fullOrder(order.id) : null);
});

// Cliente envia um pedido: cria a comanda se não existir e adiciona os itens.
router.post('/table/:id/order', (req, res) => {
  const table = db.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(req.params.id);
  if (!table) return res.status(404).json({ error: 'Mesa não encontrada' });
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) return res.status(400).json({ error: 'Nenhum item no pedido' });

  // Valida e precifica tudo ANTES de gravar: o preço nunca vem do tablet.
  let priced;
  try {
    priced = items.map(it => ({
      ...priceItem(it.product_id, it.options),
      qty: Math.max(1, Number(it.qty) || 1),
      notes: it.notes || '',
    }));
  } catch (e) { return res.status(400).json({ error: e.message }); }

  const tx = db.transaction(() => {
    let order = db.prepare(`SELECT * FROM orders WHERE table_id = ? AND status='aberto' ORDER BY id DESC LIMIT 1`)
      .get(table.id);
    if (!order) {
      const code = 'M' + Date.now().toString().slice(-6);
      const info = db.prepare(
        `INSERT INTO orders (code, type, table_id, customer_name) VALUES (?, 'mesa', ?, ?)`
      ).run(code, table.id, req.body?.customer_name || null);
      db.prepare(`UPDATE restaurant_tables SET status='ocupada' WHERE id=?`).run(table.id);
      order = db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
    }
    for (const it of priced) {
      const info = db.prepare(
        `INSERT INTO order_items (order_id, product_id, name, qty, unit_price, total, notes)
         VALUES (?,?,?,?,?,?,?)`
      ).run(order.id, it.product.id, it.product.name, it.qty, it.unitPrice,
            r2(it.unitPrice * it.qty), it.notes);
      saveItemOptions(info.lastInsertRowid, it.chosen);
    }
    recalc(order.id);
    return order.id;
  });
  const orderId = tx();
  res.status(201).json(fullOrder(orderId));
});

export default router;
