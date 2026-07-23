import { Router } from 'express';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';

const router = Router();
router.use(authRequired, requireRole('gerente', 'caixa'));

// Data de HOJE no fuso local. Não usar toISOString(): ele devolve UTC e, à noite
// (UTC-3), viraria o dia seguinte — zerando o faturamento no pico do restaurante.
// Os campos closed_at são gravados com datetime('now','localtime').
function todayLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Somas de REAL acumulam ruído de ponto flutuante — arredonda para centavos.
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

// Resumo do dashboard (dia atual por padrão)
router.get('/summary', (req, res) => {
  const from = req.query.from || todayLocal();
  const to = req.query.to || from;
  const range = [`${from} 00:00:00`, `${to} 23:59:59`];

  const closed = db.prepare(
    `SELECT * FROM orders WHERE status='fechado' AND closed_at BETWEEN ? AND ?`
  ).all(...range);
  const faturamento = closed.reduce((s, o) => s + o.total, 0);
  const ticket = closed.length ? faturamento / closed.length : 0;

  const byMethod = db.prepare(
    `SELECT p.method, SUM(p.amount) total, COUNT(*) qtd
       FROM payments p JOIN orders o ON o.id = p.order_id
      WHERE o.closed_at BETWEEN ? AND ? GROUP BY p.method`
  ).all(...range);

  const topProducts = db.prepare(
    `SELECT i.name, SUM(i.qty) qtd, SUM(i.total) total
       FROM order_items i JOIN orders o ON o.id = i.order_id
      WHERE o.status='fechado' AND o.closed_at BETWEEN ? AND ?
      GROUP BY i.name ORDER BY qtd DESC LIMIT 10`
  ).all(...range);

  // CMV: custo da mercadoria vendida, usando o custo congelado na venda.
  const cmvRow = db.prepare(
    `SELECT COALESCE(SUM(i.unit_cost * i.qty), 0) cmv
       FROM order_items i JOIN orders o ON o.id = i.order_id
      WHERE o.status='fechado' AND o.closed_at BETWEEN ? AND ?`
  ).get(...range);
  const cmv = r2(cmvRow.cmv);
  const lucroBruto = r2(faturamento - cmv);
  // CMV% sobre o faturamento — no setor, costuma-se mirar entre 25% e 35%.
  const cmvPerc = faturamento > 0 ? r2((cmv / faturamento) * 100) : 0;

  // Rentabilidade por produto (só os que têm ficha técnica)
  const porProduto = db.prepare(
    `SELECT i.name, SUM(i.qty) qtd, SUM(i.total) receita,
            SUM(i.unit_cost * i.qty) custo
       FROM order_items i JOIN orders o ON o.id = i.order_id
      WHERE o.status='fechado' AND o.closed_at BETWEEN ? AND ? AND i.unit_cost > 0
      GROUP BY i.name ORDER BY (SUM(i.total) - SUM(i.unit_cost * i.qty)) DESC`
  ).all(...range).map(p => ({
    name: p.name, qtd: p.qtd,
    receita: r2(p.receita), custo: r2(p.custo),
    lucro: r2(p.receita - p.custo),
    margem: p.receita > 0 ? r2(((p.receita - p.custo) / p.receita) * 100) : 0,
  }));

  const byDay = db.prepare(
    `SELECT date(closed_at) dia, SUM(total) total, COUNT(*) pedidos
       FROM orders WHERE status='fechado' AND closed_at BETWEEN ? AND ?
      GROUP BY date(closed_at) ORDER BY dia`
  ).all(...range);

  res.json({
    from, to,
    faturamento: r2(faturamento), pedidos: closed.length, ticketMedio: r2(ticket),
    cmv, cmvPerc, lucroBruto, porProduto,
    byMethod: byMethod.map(m => ({ ...m, total: r2(m.total) })),
    topProducts: topProducts.map(p => ({ ...p, total: r2(p.total) })),
    byDay: byDay.map(d => ({ ...d, total: r2(d.total) })),
  });
});

export default router;
