import { Router } from 'express';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';
import { r2 } from '../stock.js';

const router = Router();
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;

// ---- config (tara) -------------------------------------------
function config() {
  let c = db.prepare('SELECT * FROM buffet_config WHERE id = 1').get();
  if (!c) {
    db.prepare('INSERT INTO buffet_config (id) VALUES (1)').run();
    c = db.prepare('SELECT * FROM buffet_config WHERE id = 1').get();
  }
  return c;
}

// ---- planos --------------------------------------------------
// Cria os planos padrão do Paladar na primeira vez.
function ensurePlans() {
  const n = db.prepare('SELECT COUNT(*) c FROM buffet_plans').get().c;
  if (n > 0) return;
  const ins = db.prepare(
    'INSERT INTO buffet_plans (name, kind, price, price_saturday, sort) VALUES (?,?,?,?,?)'
  );
  ins.run('Buffet Livre',    'pessoa',  35.00, 50.00, 0);  // R$35 seg-sex, R$50 sáb
  ins.run('Marmita do Dia',  'unidade', 22.00, 0,     1);
  ins.run('Marmita a Peso',  'kg',      50.00, 0,     2);
  ins.run('Marmita Carne',   'kg',     100.00, 0,     3);
}

// Preço válido HOJE (sábado troca quando price_saturday > 0).
function precoHoje(plan) {
  const sabado = new Date().getDay() === 6;
  return (sabado && plan.price_saturday > 0) ? plan.price_saturday : plan.price;
}

function listaPlanos() {
  ensurePlans();
  return db.prepare('SELECT * FROM buffet_plans WHERE active = 1 ORDER BY sort, id').all()
    .map(p => ({ ...p, preco_hoje: r2(precoHoje(p)) }));
}

// ---- display (espelho do cliente) ----------------------------
function display() {
  let d = db.prepare('SELECT * FROM display_state WHERE id = 1').get();
  if (!d) {
    db.prepare('INSERT INTO display_state (id) VALUES (1)').run();
    d = db.prepare('SELECT * FROM display_state WHERE id = 1').get();
  }
  return d;
}
function setDisplay(campos) {
  display();
  const chaves = Object.keys(campos);
  db.prepare(
    `UPDATE display_state SET ${chaves.map(k => `${k}=?`).join(', ')},
            updated_at = datetime('now','localtime') WHERE id = 1`
  ).run(...chaves.map(k => campos[k]));
  return display();
}

// Calcula o total a partir do plano + quantidade (peso, pessoas ou unidades).
function calcular(plan, { gross_kg, count }) {
  const preco = precoHoje(plan);
  if (plan.kind === 'kg') {
    const bruto = r3(Math.max(0, Number(gross_kg) || 0));
    const liquido = r3(Math.max(0, bruto - (config().tare_kg || 0)));
    return { qty: liquido, net_kg: liquido, total: r2(liquido * preco), unidade: 'kg' };
  }
  const q = Math.max(1, Math.round(Number(count) || 1));
  return { qty: q, net_kg: 0, total: r2(q * preco), unidade: plan.kind === 'pessoa' ? 'pessoa' : 'un' };
}

// ==== rotas do atendente / gerente ============================
router.use(authRequired);

router.get('/config', (req, res) => res.json(config()));
router.get('/plans', (req, res) => res.json(listaPlanos()));

router.get('/state', (req, res) => {
  res.json({ display: display(), config: config(), plans: listaPlanos() });
});

// Pesagem / cotação: atualiza o espelho do cliente em tempo real (não cobra ainda).
router.post('/quote', (req, res) => {
  const plan = db.prepare('SELECT * FROM buffet_plans WHERE id = ? AND active = 1').get(req.body?.plan_id);
  if (!plan) return res.status(400).json({ error: 'Escolha um plano' });
  const calc = calcular(plan, req.body || {});
  res.json(setDisplay({
    status: 'ativo',
    plan_name: plan.name, kind: plan.kind, qty: calc.qty,
    net_kg: calc.net_kg, price_per_kg: r2(precoHoje(plan)), total: calc.total,
    order_code: null, payment_method: null,
  }));
});

// Fecha a venda: gera comanda paga e mostra o agradecimento no display.
router.post('/confirm', (req, res) => {
  const d = display();
  if (d.status !== 'ativo' || d.total <= 0) return res.status(400).json({ error: 'Nada para cobrar' });
  const { payment_method } = req.body || {};
  if (!['dinheiro', 'credito', 'debito', 'pix'].includes(payment_method))
    return res.status(400).json({ error: 'Forma de pagamento inválida' });

  const detalhe = d.kind === 'kg' ? `${d.net_kg.toFixed(3)} kg`
                : d.kind === 'pessoa' ? `${d.qty} pessoa(s)` : `${d.qty} un`;

  const tx = db.transaction(() => {
    const code = 'B' + Date.now().toString().slice(-6);
    const oi = db.prepare(
      `INSERT INTO orders (code, type, customer_name, opened_by, subtotal, total, status, closed_at)
       VALUES (?, 'buffet', NULL, ?, ?, ?, 'fechado', datetime('now','localtime'))`
    ).run(code, req.user.id, d.total, d.total);
    const orderId = oi.lastInsertRowid;

    db.prepare(
      `INSERT INTO order_items (order_id, product_id, name, qty, unit_price, total, status)
       VALUES (?, NULL, ?, ?, ?, ?, 'entregue')`
    ).run(orderId, `${d.plan_name} (${detalhe})`, d.qty || 1, d.price_per_kg, d.total);

    db.prepare(
      `INSERT INTO payments (order_id, method, amount, received, change, user_id)
       VALUES (?,?,?,?,0,?)`
    ).run(orderId, payment_method, d.total, d.total, req.user.id);

    const sess = db.prepare(`SELECT * FROM cash_sessions WHERE status='aberto' ORDER BY id DESC LIMIT 1`).get();
    if (sess) {
      db.prepare(
        `INSERT INTO cash_movements (session_id, type, amount, description, user_id)
         VALUES (?, 'venda', ?, ?, ?)`
      ).run(sess.id, d.total, `${d.plan_name} ${code} (${payment_method})`, req.user.id);
    }
    return code;
  });

  const code = tx();
  res.json(setDisplay({ status: 'pago', order_code: code, payment_method }));
});

router.post('/reset', (req, res) => {
  res.json(setDisplay({
    status: 'ocioso', plan_name: null, kind: 'kg', qty: 0,
    net_kg: 0, total: 0, order_code: null, payment_method: null,
  }));
});

// ---- gerência dos planos e da tara (gerente) -----------------
router.put('/config', requireRole('gerente'), (req, res) => {
  const c = config();
  const tare = req.body?.tare_kg;
  db.prepare(`UPDATE buffet_config SET tare_kg=?, updated_at=datetime('now','localtime') WHERE id=1`)
    .run(tare ?? c.tare_kg);
  res.json(config());
});

router.put('/plans/:id', requireRole('gerente'), (req, res) => {
  const p = db.prepare('SELECT * FROM buffet_plans WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Plano não encontrado' });
  const b = req.body || {};
  db.prepare(
    `UPDATE buffet_plans SET name=?, kind=?, price=?, price_saturday=?, active=? WHERE id=?`
  ).run(b.name ?? p.name, b.kind ?? p.kind, b.price ?? p.price,
        b.price_saturday ?? p.price_saturday, b.active ?? p.active, p.id);
  res.json(db.prepare('SELECT * FROM buffet_plans WHERE id = ?').get(p.id));
});

router.post('/plans', requireRole('gerente'), (req, res) => {
  const { name, kind = 'kg', price = 0, price_saturday = 0 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const sort = (db.prepare('SELECT MAX(sort) m FROM buffet_plans').get().m || 0) + 1;
  const info = db.prepare(
    'INSERT INTO buffet_plans (name, kind, price, price_saturday, sort) VALUES (?,?,?,?,?)'
  ).run(name, kind, Number(price) || 0, Number(price_saturday) || 0, sort);
  res.status(201).json(db.prepare('SELECT * FROM buffet_plans WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/plans/:id', requireRole('gerente'), (req, res) => {
  db.prepare('UPDATE buffet_plans SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;

// ---- display do cliente (público, sem login) ------------------
export const publicDisplay = Router();
publicDisplay.get('/display', (req, res) => {
  const d = display();
  res.json({
    status: d.status, plan_name: d.plan_name, kind: d.kind,
    qty: d.qty, net_kg: d.net_kg, total: d.total, updated_at: d.updated_at,
  });
});
