import { Router } from 'express';
import db from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();
router.use(authRequired);

// Mesas com o pedido aberto vinculado (se houver)
router.get('/', (req, res) => {
  const tables = db.prepare('SELECT * FROM restaurant_tables ORDER BY id').all();
  const openOrders = db.prepare(`SELECT * FROM orders WHERE status='aberto' AND table_id IS NOT NULL`).all();
  const byTable = Object.fromEntries(openOrders.map(o => [o.table_id, o]));

  // Pedido do totem já vem pago: a mesa fica ocupada SEM comanda aberta.
  // Marca essas para a equipe poder liberar quando o cliente for embora.
  const pagoStmt = db.prepare(
    `SELECT code, total, closed_at FROM orders
      WHERE table_id = ? AND status='fechado'
      ORDER BY id DESC LIMIT 1`
  );

  res.json(tables.map(t => {
    const order = byTable[t.id] || null;
    const pago = (!order && t.status === 'ocupada') ? pagoStmt.get(t.id) : null;
    return { ...t, order, pago };
  }));
});

// Reserva uma mesa livre.
router.post('/:id/reserve', (req, res) => {
  const t = db.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Mesa não encontrada' });
  if (t.status !== 'livre') return res.status(400).json({ error: 'Só é possível reservar mesa livre' });

  const { name, info } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Informe o nome da reserva' });
  db.prepare(`UPDATE restaurant_tables SET status='reservada', reserved_name=?, reserved_info=? WHERE id=?`)
    .run(name, info || null, t.id);
  res.json(db.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(t.id));
});

// Libera a mesa (cancela reserva, ou quando o cliente vai embora do totem).
router.post('/:id/free', (req, res) => {
  const t = db.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Mesa não encontrada' });

  const aberta = db.prepare(
    `SELECT code FROM orders WHERE table_id = ? AND status='aberto' LIMIT 1`
  ).get(t.id);
  if (aberta)
    return res.status(400).json({ error: `A mesa tem a comanda ${aberta.code} em aberto — feche a conta antes` });

  db.prepare(`UPDATE restaurant_tables SET status='livre', reserved_name=NULL, reserved_info=NULL WHERE id=?`)
    .run(t.id);
  res.json({ ok: true });
});

export default router;
