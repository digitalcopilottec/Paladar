import db from '../db.js';

// Substitui o cardápio de demonstração pelos itens reais da comanda do salão.
// Desativa (não apaga) o que existia antes — histórico de vendas antigas continua íntegro.
db.prepare('UPDATE categories SET active = 0').run();
db.prepare('UPDATE products SET active = 0').run();

const categories = [
  { name: 'Extras',       color: '#B01E28' },
  { name: 'Águas',        color: '#2C9CB0' },
  { name: 'Refrigerantes',color: '#2C7BB0' },
  { name: 'Sucos',        color: '#E0A62C' },
  { name: 'Vinhos',       color: '#7A3B8C' },
  { name: 'Cervejas',     color: '#C08A2C' },
];
const insCat = db.prepare('INSERT INTO categories (name, color, sort) VALUES (?,?,?)');
const catIds = {};
categories.forEach((c, i) => { catIds[c.name] = insCat.run(c.name, c.color, i).lastInsertRowid; });

const AGUA = '/produtos/demo-agua.jpg';
const REFRI = '/produtos/demo-refrigerante.jpg';
const SUCO = '/produtos/demo-suco.jpg';
const VINHO = '/produtos/demo-vinho.jpg';
const CERVEJA = '/produtos/demo-cerveja.jpg';

const products = [
  ['Extras',        'Ovo',                        '', 2.00,   '/produtos/demo-ovo.jpg'],
  ['Extras',        'Bife',                       '', 5.00,   '/produtos/demo-picanha.jpg'],

  ['Águas',         'Água',                       '', 5.00,   AGUA],
  ['Águas',         'H2O',                        '', 10.00,  AGUA],

  ['Refrigerantes', 'Refrigerante Lata',          '', 8.00,   REFRI],
  ['Refrigerantes', 'Refrigerante 600ml',         '', 10.00,  REFRI],
  ['Refrigerantes', 'Refri KS',                   '', 5.00,   REFRI],
  ['Refrigerantes', 'Fruki',                      '', 10.00,  REFRI],
  ['Refrigerantes', 'Refrigerante 1 Litro',       '', 12.00,  REFRI],
  ['Refrigerantes', 'Coca-Cola 2 Litros',         '', 18.00,  REFRI],
  ['Refrigerantes', 'Guaraná 2 Litros',           '', 16.00,  REFRI],

  ['Sucos',         'Suco de Uva Copo',           '', 8.00,   SUCO],
  ['Sucos',         'Suco de Uva Jarra',          '', 20.00,  SUCO],
  ['Sucos',         'Suco de Laranja Copo',       '', 10.00,  SUCO],
  ['Sucos',         'Suco de Laranja Jarra',      '', 25.00,  SUCO],
  ['Sucos',         'Suco Del Vale',              '', 8.00,   SUCO],
  ['Sucos',         'Suco Del Vale Caixa',        '', 5.00,   SUCO],

  ['Vinhos',        'Vinho Jarra',                '', 20.00,  VINHO],
  ['Vinhos',        'Vinho Copo',                 '', 8.00,   VINHO],

  ['Cervejas',      'Heineken 600ml',             '', 22.00,  CERVEJA],
  ['Cervejas',      'Original 600ml',             '', 16.00,  CERVEJA],
  ['Cervejas',      'Brahma/Antarctica 600ml',    '', 12.00,  CERVEJA],
  ['Cervejas',      'Cerveja Lata',               '', 8.00,   CERVEJA],
];

const insProd = db.prepare(
  `INSERT INTO products (category_id, name, description, price, sort, image) VALUES (?,?,?,?,?,?)`
);
products.forEach((p, i) => insProd.run(catIds[p[0]], p[1], p[2], p[3], i, p[4]));

console.log(`✅ Cardápio atualizado: ${categories.length} categorias, ${products.length} produtos (comanda do salão).`);
console.log('   Buffet (Livre / Sábado-Feriado) continua em Config. Buffet — não duplicado aqui.');
