import { Router } from 'express';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';

const router = Router();
router.use(authRequired);

function currentSession() {
  return db.prepare(`SELECT * FROM cash_sessions WHERE status='aberto' ORDER BY id DESC LIMIT 1`).get();
}

function summary(session) {
  if (!session) return null;
  const movs = db.prepare('SELECT * FROM cash_movements WHERE session_id = ? ORDER BY id').all(session.id);
  const sum = (type) => movs.filter(m => m.type === type).reduce((s, m) => s + m.amount, 0);
  const vendas = sum('venda'), suprimentos = sum('suprimento') + sum('entrada');
  const sangrias = sum('sangria') + sum('saida');
  const esperado = session.opening_amount + vendas + suprimentos - sangrias;
  return { ...session, movements: movs, vendas, suprimentos, sangrias, esperado };
}

router.get('/current', (req, res) => {
  res.json(summary(currentSession()));
});

router.post('/open', requireRole('caixa', 'gerente'), (req, res) => {
  if (currentSession()) return res.status(400).json({ error: 'Já existe um caixa aberto' });
  const opening = Number(req.body?.opening_amount) || 0;
  const info = db.prepare(`INSERT INTO cash_sessions (opened_by, opening_amount) VALUES (?,?)`)
    .run(req.user.id, opening);
  res.status(201).json(summary(db.prepare('SELECT * FROM cash_sessions WHERE id = ?').get(info.lastInsertRowid)));
});

router.post('/movement', requireRole('caixa', 'gerente'), (req, res) => {
  const session = currentSession();
  if (!session) return res.status(400).json({ error: 'Nenhum caixa aberto' });
  const { type, amount, description = '' } = req.body || {};
  if (!['sangria', 'suprimento', 'entrada', 'saida'].includes(type))
    return res.status(400).json({ error: 'Tipo inválido' });
  db.prepare(`INSERT INTO cash_movements (session_id, type, amount, description, user_id) VALUES (?,?,?,?,?)`)
    .run(session.id, type, Number(amount) || 0, description, req.user.id);
  res.json(summary(currentSession()));
});

router.post('/close', requireRole('caixa', 'gerente'), (req, res) => {
  const session = currentSession();
  if (!session) return res.status(400).json({ error: 'Nenhum caixa aberto' });
  const closing = Number(req.body?.closing_amount) || 0;
  db.prepare(`UPDATE cash_sessions SET status='fechado', closing_amount=?, closed_at=datetime('now','localtime') WHERE id=?`)
    .run(closing, session.id);
  res.json(summary(db.prepare('SELECT * FROM cash_sessions WHERE id = ?').get(session.id)));
});

export default router;
