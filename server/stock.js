import db from './db.js';

export const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;

// Ficha técnica de um produto (ou de um adicional), com custo calculado.
export function recipeFor({ productId = null, optionId = null }) {
  const rows = db.prepare(
    `SELECT r.id, r.qty, r.ingredient_id, i.name, i.unit, i.cost_per_unit, i.stock_qty
       FROM recipe_items r
       JOIN ingredients i ON i.id = r.ingredient_id
      WHERE ${productId ? 'r.product_id = ?' : 'r.option_id = ?'}
      ORDER BY i.name`
  ).all(productId ?? optionId);
  return rows.map(r => ({ ...r, cost: r2(r.qty * r.cost_per_unit) }));
}

// Custo unitário de um item vendido = ficha do produto + fichas dos adicionais escolhidos.
export function itemCost(productId, optionIds = []) {
  let cost = recipeFor({ productId }).reduce((s, r) => s + r.cost, 0);
  for (const oid of optionIds) {
    cost += recipeFor({ optionId: oid }).reduce((s, r) => s + r.cost, 0);
  }
  return r2(cost);
}

// Insumos que um item consome (produto + adicionais), somando repetidos.
function consumptionFor(productId, optionIds, qty) {
  const need = new Map();
  const add = (rows) => {
    for (const r of rows) {
      need.set(r.ingredient_id, r3((need.get(r.ingredient_id) || 0) + r.qty * qty));
    }
  };
  add(recipeFor({ productId }));
  for (const oid of optionIds) add(recipeFor({ optionId: oid }));
  return need;
}

/**
 * Dá baixa no estoque dos itens de um pedido fechado.
 * Roda dentro da transação de fechamento da comanda.
 * Itens sem ficha técnica simplesmente não movimentam estoque (não é erro:
 * nem todo produto precisa de ficha para o sistema funcionar).
 */
export function consumeForOrder(orderId, userId) {
  const items = db.prepare(
    'SELECT id, product_id, qty FROM order_items WHERE order_id = ?'
  ).all(orderId);

  const total = new Map();
  for (const it of items) {
    const optionIds = db.prepare(
      'SELECT option_id FROM order_item_options WHERE order_item_id = ?'
    ).all(it.id).map(r => r.option_id).filter(Boolean);

    for (const [ingId, q] of consumptionFor(it.product_id, optionIds, it.qty)) {
      total.set(ingId, r3((total.get(ingId) || 0) + q));
    }
  }

  const upd = db.prepare('UPDATE ingredients SET stock_qty = stock_qty - ? WHERE id = ?');
  const mov = db.prepare(
    `INSERT INTO stock_movements (ingredient_id, type, qty, unit_cost, description, order_id, user_id)
     VALUES (?, 'venda', ?, ?, ?, ?, ?)`
  );
  const code = db.prepare('SELECT code FROM orders WHERE id = ?').get(orderId)?.code || orderId;

  for (const [ingId, q] of total) {
    const ing = db.prepare('SELECT cost_per_unit FROM ingredients WHERE id = ?').get(ingId);
    upd.run(q, ingId);
    // Quantidade negativa = saída. O estoque pode ficar negativo de propósito:
    // travar a venda porque o cadastro está desatualizado seria pior para o restaurante.
    mov.run(ingId, -q, ing?.cost_per_unit || 0, `Venda ${code}`, orderId, userId || null);
  }
  return total.size;
}

// Congela o custo unitário do item no momento da venda (CMV histórico não muda depois).
export function freezeCosts(orderId) {
  const items = db.prepare('SELECT id, product_id FROM order_items WHERE order_id = ?').all(orderId);
  const upd = db.prepare('UPDATE order_items SET unit_cost = ? WHERE id = ?');
  for (const it of items) {
    const optionIds = db.prepare(
      'SELECT option_id FROM order_item_options WHERE order_item_id = ?'
    ).all(it.id).map(r => r.option_id).filter(Boolean);
    upd.run(itemCost(it.product_id, optionIds), it.id);
  }
}
