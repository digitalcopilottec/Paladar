import db from '../db.js';

// Adiciona Buffet Livre / Buffet Sábado-Feriado como itens do cardápio do garçom
// (categoria própria, antes das demais) — sem mexer no que já existe.
const cat = db.prepare('INSERT INTO categories (name, color, sort) VALUES (?,?,?)')
  .run('Buffet', '#B01E28', -1);

db.prepare('UPDATE categories SET sort = sort + 1 WHERE id != ?').run(cat.lastInsertRowid);

const img = '/produtos/demo-buffet.jpg';
const insProd = db.prepare(
  `INSERT INTO products (category_id, name, description, price, sort, image) VALUES (?,?,?,?,?,?)`
);
insProd.run(cat.lastInsertRowid, 'Buffet Sábado/Feriado', '', 50.00, 0, img);
insProd.run(cat.lastInsertRowid, 'Buffet Livre', '', 35.00, 1, img);

console.log('✅ Categoria "Buffet" criada com Buffet Sábado/Feriado (R$50) e Buffet Livre (R$35).');
