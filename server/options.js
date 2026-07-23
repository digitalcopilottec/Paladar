import db from './db.js';

export const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

// Grupos de opções de um produto, já com as opções dentro.
export function groupsForProduct(productId) {
  const groups = db.prepare(
    `SELECT g.* FROM option_groups g
       JOIN product_option_groups pg ON pg.group_id = g.id
      WHERE pg.product_id = ? AND g.active = 1
      ORDER BY pg.sort, g.sort, g.name`
  ).all(productId);
  const stmt = db.prepare('SELECT * FROM options WHERE group_id = ? AND active = 1 ORDER BY sort, name');
  return groups.map(g => ({ ...g, options: stmt.all(g.id) }));
}

/**
 * Valida as opções escolhidas e calcula o preço unitário final.
 * Sempre roda no servidor: o tablet do cliente é público e o preço não pode vir dele.
 * Lança Error com mensagem amigável quando a escolha é inválida.
 */
export function priceItem(productId, optionIds = []) {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(productId);
  if (!product) throw new Error('Produto não encontrado');

  const groups = groupsForProduct(productId);
  const ids = [...new Set((optionIds || []).map(Number).filter(Boolean))];

  // Só aceita opções que realmente pertencem a um grupo deste produto.
  const allowed = new Map();
  for (const g of groups) for (const o of g.options) allowed.set(o.id, { ...o, group: g });

  const chosen = [];
  for (const id of ids) {
    const o = allowed.get(id);
    if (!o) throw new Error('Opção inválida para este produto');
    chosen.push(o);
  }

  // Respeita mínimo e máximo de cada grupo.
  for (const g of groups) {
    const n = chosen.filter(o => o.group.id === g.id).length;
    if (n < g.min_select) {
      throw new Error(`Escolha ${g.min_select === 1 ? 'uma opção' : `${g.min_select} opções`} em "${g.name}"`);
    }
    if (n > g.max_select) {
      throw new Error(`"${g.name}" aceita no máximo ${g.max_select} opção(ões)`);
    }
  }

  const unitPrice = r2(product.price + chosen.reduce((s, o) => s + o.price_delta, 0));
  return {
    product,
    unitPrice,
    chosen: chosen.map(o => ({ option_id: o.id, name: o.name, price_delta: o.price_delta })),
  };
}

// Grava as opções escolhidas de um item (cópia congelada do nome/preço).
export function saveItemOptions(orderItemId, chosen) {
  const stmt = db.prepare(
    `INSERT INTO order_item_options (order_item_id, option_id, name, price_delta) VALUES (?,?,?,?)`
  );
  for (const c of chosen) stmt.run(orderItemId, c.option_id, c.name, c.price_delta);
}

// Anexa as opções escolhidas a uma lista de itens (para exibir na comanda/KDS).
export function attachOptions(items) {
  const stmt = db.prepare('SELECT option_id, name, price_delta FROM order_item_options WHERE order_item_id = ?');
  for (const i of items) i.options = stmt.all(i.id);
  return items;
}
