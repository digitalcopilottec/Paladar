import { Router } from 'express';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';
import { recipeFor, itemCost, r2 } from '../stock.js';

const router = Router();
router.use(authRequired, requireRole('gerente', 'caixa'));

// --- Insumos --------------------------------------------------
router.get('/ingredients', (req, res) => {
  const rows = db.prepare('SELECT * FROM ingredients WHERE active = 1 ORDER BY name').all();
  res.json(rows.map(i => ({ ...i, baixo: i.stock_qty <= i.min_stock })));
});

router.post('/ingredients', requireRole('gerente'), (req, res) => {
  const { name, unit = 'un', stock_qty = 0, min_stock = 0, cost_per_unit = 0, supplier = '' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const info = db.prepare(
    `INSERT INTO ingredients (name, unit, stock_qty, min_stock, cost_per_unit, supplier)
     VALUES (?,?,?,?,?,?)`
  ).run(name, unit, Number(stock_qty) || 0, Number(min_stock) || 0, Number(cost_per_unit) || 0, supplier);
  res.status(201).json(db.prepare('SELECT * FROM ingredients WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/ingredients/:id', requireRole('gerente'), (req, res) => {
  const cur = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Insumo não encontrado' });
  const { name, unit, min_stock, cost_per_unit, supplier } = req.body || {};
  // Repare: stock_qty NÃO se edita aqui. Estoque só muda por movimento,
  // senão fica impossível auditar para onde foi o insumo.
  db.prepare('UPDATE ingredients SET name=?, unit=?, min_stock=?, cost_per_unit=?, supplier=? WHERE id=?')
    .run(name ?? cur.name, unit ?? cur.unit, min_stock ?? cur.min_stock,
         cost_per_unit ?? cur.cost_per_unit, supplier ?? cur.supplier, cur.id);
  res.json(db.prepare('SELECT * FROM ingredients WHERE id = ?').get(cur.id));
});

router.delete('/ingredients/:id', requireRole('gerente'), (req, res) => {
  db.prepare('UPDATE ingredients SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Movimentações --------------------------------------------
router.get('/movements', (req, res) => {
  const rows = db.prepare(
    `SELECT m.*, i.name AS ingredient_name, i.unit, u.name AS user_name
       FROM stock_movements m
       JOIN ingredients i ON i.id = m.ingredient_id
       LEFT JOIN users u ON u.id = m.user_id
      ORDER BY m.id DESC LIMIT 200`
  ).all();
  res.json(rows);
});

// Entrada (compra), perda ou ajuste
router.post('/movements', (req, res) => {
  const { ingredient_id, type, qty, unit_cost, description = '' } = req.body || {};
  if (!['entrada', 'perda', 'ajuste'].includes(type))
    return res.status(400).json({ error: 'Tipo inválido' });
  const ing = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredient_id);
  if (!ing) return res.status(404).json({ error: 'Insumo não encontrado' });

  const q = Number(qty) || 0;
  if (q === 0) return res.status(400).json({ error: 'Informe a quantidade' });

  // entrada soma; perda subtrai; ajuste define o saldo contado no inventário.
  const delta = type === 'entrada' ? Math.abs(q)
              : type === 'perda' ? -Math.abs(q)
              : Number((q - ing.stock_qty).toFixed(3));

  const tx = db.transaction(() => {
    db.prepare('UPDATE ingredients SET stock_qty = stock_qty + ? WHERE id = ?').run(delta, ing.id);
    // Compra com preço novo atualiza o custo do insumo (e, por tabela, o CMV daqui pra frente).
    if (type === 'entrada' && Number(unit_cost) > 0) {
      db.prepare('UPDATE ingredients SET cost_per_unit = ? WHERE id = ?').run(Number(unit_cost), ing.id);
    }
    db.prepare(
      `INSERT INTO stock_movements (ingredient_id, type, qty, unit_cost, description, user_id)
       VALUES (?,?,?,?,?,?)`
    ).run(ing.id, type, delta, Number(unit_cost) || ing.cost_per_unit, description, req.user.id);
  });
  tx();
  res.status(201).json(db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ing.id));
});

// --- Ficha técnica --------------------------------------------
router.get('/recipe', (req, res) => {
  const { product_id, option_id } = req.query;
  if (!product_id && !option_id) return res.status(400).json({ error: 'Informe product_id ou option_id' });
  const items = recipeFor({ productId: product_id || null, optionId: option_id || null });
  const custo = r2(items.reduce((s, r) => s + r.cost, 0));

  let venda = 0;
  if (product_id) venda = db.prepare('SELECT price FROM products WHERE id = ?').get(product_id)?.price || 0;
  else venda = db.prepare('SELECT price_delta FROM options WHERE id = ?').get(option_id)?.price_delta || 0;

  const margem = venda > 0 ? r2(((venda - custo) / venda) * 100) : 0;
  res.json({ items, custo, venda, lucro: r2(venda - custo), margem });
});

router.post('/recipe', requireRole('gerente'), (req, res) => {
  const { product_id = null, option_id = null, ingredient_id, qty } = req.body || {};
  if (!!product_id === !!option_id)
    return res.status(400).json({ error: 'Informe product_id OU option_id' });
  if (!ingredient_id || !(Number(qty) > 0))
    return res.status(400).json({ error: 'Informe o insumo e a quantidade' });
  db.prepare(
    'INSERT INTO recipe_items (product_id, option_id, ingredient_id, qty) VALUES (?,?,?,?)'
  ).run(product_id || null, option_id || null, ingredient_id, Number(qty));
  res.status(201).json(recipeFor({ productId: product_id, optionId: option_id }));
});

router.delete('/recipe/:id', requireRole('gerente'), (req, res) => {
  db.prepare('DELETE FROM recipe_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Custo/margem de todos os produtos (curva de rentabilidade)
router.get('/margins', (req, res) => {
  const prods = db.prepare('SELECT id, name, price FROM products WHERE active = 1 ORDER BY name').all();
  res.json(prods.map(p => {
    const custo = itemCost(p.id, []);
    const temFicha = recipeFor({ productId: p.id }).length > 0;
    return {
      ...p, custo, temFicha,
      lucro: r2(p.price - custo),
      margem: p.price > 0 && temFicha ? r2(((p.price - custo) / p.price) * 100) : null,
    };
  }));
});

export default router;
