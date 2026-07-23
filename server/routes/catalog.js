import { Router } from 'express';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';
import { groupsForProduct } from '../options.js';

const router = Router();
router.use(authRequired);

// --- Categorias ---
router.get('/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories WHERE active = 1 ORDER BY sort, name').all());
});

router.post('/categories', requireRole('gerente'), (req, res) => {
  const { name, color = '#B01E28' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const info = db.prepare('INSERT INTO categories (name, color) VALUES (?,?)').run(name, color);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid));
});

// --- Produtos ---
router.get('/products', (req, res) => {
  const { category } = req.query;
  const rows = category
    ? db.prepare('SELECT * FROM products WHERE active = 1 AND category_id = ? ORDER BY sort, name').all(category)
    : db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort, name').all();
  for (const p of rows) p.groups = groupsForProduct(p.id);
  res.json(rows);
});

router.post('/products', requireRole('gerente'), (req, res) => {
  const { category_id, name, description = '', price = 0, cost = 0 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const info = db.prepare(
    'INSERT INTO products (category_id, name, description, price, cost) VALUES (?,?,?,?,?)'
  ).run(category_id || null, name, description, price, cost);
  res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid));
});

// --- Grupos de opções / adicionais ---
router.get('/option-groups', (req, res) => {
  const groups = db.prepare('SELECT * FROM option_groups WHERE active = 1 ORDER BY sort, name').all();
  const stmt = db.prepare('SELECT * FROM options WHERE group_id = ? AND active = 1 ORDER BY sort, name');
  const usage = db.prepare('SELECT product_id FROM product_option_groups WHERE group_id = ?');
  res.json(groups.map(g => ({
    ...g,
    options: stmt.all(g.id),
    product_ids: usage.all(g.id).map(r => r.product_id),
  })));
});

router.post('/option-groups', requireRole('gerente'), (req, res) => {
  const { name, min_select = 0, max_select = 1 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  if (Number(max_select) < Number(min_select))
    return res.status(400).json({ error: 'O máximo não pode ser menor que o mínimo' });
  const info = db.prepare('INSERT INTO option_groups (name, min_select, max_select) VALUES (?,?,?)')
    .run(name, Number(min_select) || 0, Number(max_select) || 1);
  res.status(201).json(db.prepare('SELECT * FROM option_groups WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/option-groups/:id', requireRole('gerente'), (req, res) => {
  // Desativa em vez de apagar: vendas antigas guardam cópia do nome/preço, mas
  // remover o grupo não pode quebrar o histórico nem o cardápio em uso.
  db.prepare('UPDATE option_groups SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/option-groups/:id/options', requireRole('gerente'), (req, res) => {
  const { name, price_delta = 0 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const info = db.prepare('INSERT INTO options (group_id, name, price_delta) VALUES (?,?,?)')
    .run(req.params.id, name, Number(price_delta) || 0);
  res.status(201).json(db.prepare('SELECT * FROM options WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/options/:id', requireRole('gerente'), (req, res) => {
  db.prepare('UPDATE options SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Liga/desliga um grupo em um produto
router.put('/products/:id/option-groups', requireRole('gerente'), (req, res) => {
  const ids = Array.isArray(req.body?.group_ids) ? req.body.group_ids : [];
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM product_option_groups WHERE product_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT INTO product_option_groups (product_id, group_id, sort) VALUES (?,?,?)');
    ids.forEach((gid, ix) => stmt.run(req.params.id, gid, ix));
  });
  tx();
  res.json(groupsForProduct(req.params.id));
});

router.put('/products/:id', requireRole('gerente'), (req, res) => {
  const cur = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Produto não encontrado' });

  // Atualização parcial: só muda o que veio no corpo, o resto fica como está.
  const b = req.body || {};
  const campos = ['name', 'description', 'price', 'cost', 'category_id', 'active',
                  'image', 'ncm', 'cfop', 'csosn', 'origem', 'unidade', 'cest'];
  db.prepare(
    `UPDATE products SET ${campos.map(c => `${c}=?`).join(', ')} WHERE id=?`
  ).run(...campos.map(k => (b[k] !== undefined ? b[k] : cur[k])), cur.id);

  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(cur.id));
});

export default router;
