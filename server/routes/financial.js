import { Router } from 'express';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';

const router = Router();
router.use(authRequired, requireRole('gerente', 'caixa'));

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM financial_entries ORDER BY COALESCE(due_date, created_at) DESC').all();
  const receitas = rows.filter(r => r.type === 'receita').reduce((s, r) => s + r.amount, 0);
  const despesas = rows.filter(r => r.type === 'despesa').reduce((s, r) => s + r.amount, 0);
  res.json({ entries: rows, receitas, despesas, saldo: receitas - despesas });
});

router.post('/', (req, res) => {
  const { type, category = '', description, amount = 0, due_date = null, paid = 0 } = req.body || {};
  if (!['receita', 'despesa'].includes(type)) return res.status(400).json({ error: 'Tipo inválido' });
  if (!description) return res.status(400).json({ error: 'Descrição obrigatória' });
  // paid_at em hora local, igual ao resto do sistema (datetime('now','localtime')).
  const info = db.prepare(
    `INSERT INTO financial_entries (type, category, description, amount, due_date, paid, paid_at)
     VALUES (?,?,?,?,?,?, CASE WHEN ? THEN datetime('now','localtime') ELSE NULL END)`
  ).run(type, category, description, Number(amount) || 0, due_date, paid ? 1 : 0, paid ? 1 : 0);
  res.status(201).json(db.prepare('SELECT * FROM financial_entries WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id/pay', (req, res) => {
  db.prepare(`UPDATE financial_entries SET paid=1, paid_at=datetime('now','localtime') WHERE id=?`).run(req.params.id);
  res.json(db.prepare('SELECT * FROM financial_entries WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM financial_entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
