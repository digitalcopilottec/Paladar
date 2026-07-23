import { Router } from 'express';
import db from '../db.js';
import { authRequired } from '../auth.js';

// KDS — tela da cozinha. Mostra as comandas abertas com itens ainda não entregues.
const router = Router();
router.use(authRequired);

const FLOW = ['novo', 'preparando', 'pronto', 'entregue'];

// Tickets (comandas) com itens pendentes, mais antigos primeiro.
router.get('/tickets', (req, res) => {
  // O tempo de espera é calculado no banco, em hora local, para não depender do fuso do cliente.
  const items = db.prepare(
    `SELECT i.id, i.order_id, i.name, i.qty, i.notes, i.status, i.created_at,
            CAST((julianday('now','localtime') - julianday(i.created_at)) * 1440 AS INTEGER) AS minutos,
            o.code, o.type, o.customer_name, t.name AS table_name
       FROM order_items i
       JOIN orders o ON o.id = i.order_id
       LEFT JOIN restaurant_tables t ON t.id = o.table_id
      WHERE o.status != 'cancelado'
        AND i.status != 'entregue'
        -- Filtra por status do ITEM, não da comanda: pedido do totem já nasce PAGO
        -- (comanda fechada) e mesmo assim a cozinha precisa produzir.
        AND i.created_at >= datetime('now','localtime','-12 hours')
      ORDER BY i.created_at`
  ).all();

  // Agrupa por comanda
  const map = new Map();
  for (const it of items) {
    if (!map.has(it.order_id)) {
      map.set(it.order_id, {
        order_id: it.order_id,
        code: it.code,
        type: it.type,
        table_name: it.table_name,
        customer_name: it.customer_name,
        minutos: it.minutos,          // idade do item mais antigo (lista já vem ordenada)
        items: [],
      });
    }
    const t = map.get(it.order_id);
    t.items.push({
      id: it.id, name: it.name, qty: it.qty, notes: it.notes,
      status: it.status, minutos: it.minutos,
      // A cozinha precisa ver os adicionais, senão o prato sai errado.
      options: db.prepare('SELECT name, price_delta FROM order_item_options WHERE order_item_id = ?').all(it.id),
    });
  }
  res.json([...map.values()]);
});

// Avança/define o status de um item.
router.put('/items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM order_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });

  let status = req.body?.status;
  if (!status) {
    // Sem status explícito: avança um passo no fluxo.
    const ix = FLOW.indexOf(item.status);
    status = FLOW[Math.min(ix + 1, FLOW.length - 1)];
  }
  if (!FLOW.includes(status)) return res.status(400).json({ error: 'Status inválido' });

  db.prepare('UPDATE order_items SET status = ? WHERE id = ?').run(status, item.id);
  res.json(db.prepare('SELECT * FROM order_items WHERE id = ?').get(item.id));
});

// Marca todos os itens pendentes de uma comanda com um status.
router.put('/tickets/:orderId', (req, res) => {
  const status = req.body?.status;
  if (!FLOW.includes(status)) return res.status(400).json({ error: 'Status inválido' });
  const info = db.prepare(
    `UPDATE order_items SET status = ? WHERE order_id = ? AND status != 'entregue'`
  ).run(status, req.params.orderId);
  res.json({ ok: true, atualizados: info.changes });
});

export default router;
