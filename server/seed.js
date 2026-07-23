import bcrypt from 'bcryptjs';
import db from './db.js';

// Executa uma carga inicial só se ainda não houver usuários.
const count = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (count > 0) {
  console.log('Banco já possui dados — seed ignorado. (Use --force para recriar)');
  if (!process.argv.includes('--force')) process.exit(0);
}

if (process.argv.includes('--force')) {
  for (const t of ['payments', 'order_items', 'orders', 'cash_movements', 'cash_sessions',
                    'financial_entries', 'products', 'categories', 'restaurant_tables', 'users']) {
    db.exec(`DELETE FROM ${t};`);
  }
  console.log('Dados anteriores limpos (--force).');
}

const hash = (p) => bcrypt.hashSync(p, 10);

// ---- Usuários (cada um com seu acesso) ----------------------
const users = [
  { name: 'Administrador',  username: 'admin',   email: 'admin@paladar.com',   pass: 'admin123',   role: 'admin',   pin: '1111' },
  { name: 'Gerente',        username: 'gerente', email: 'gerente@paladar.com', pass: 'gerente123', role: 'gerente', pin: '2222' },
  { name: 'Caixa',          username: 'caixa',   email: 'caixa@paladar.com',   pass: 'caixa123',   role: 'caixa',   pin: '3333' },
  { name: 'Garçom João',    username: 'garcom',  email: 'garcom@paladar.com',  pass: 'garcom123',  role: 'garcom',  pin: '4444' },
];
const insUser = db.prepare(
  `INSERT INTO users (name, username, email, password_hash, role, pin) VALUES (?,?,?,?,?,?)`
);
for (const u of users) insUser.run(u.name, u.username, u.email, hash(u.pass), u.role, u.pin);

// ---- Categorias e produtos do cardápio (comanda real do salão) ----------------------
const categories = [
  { name: 'Buffet',        color: '#B01E28' },
  { name: 'Extras',        color: '#D4442E' },
  { name: 'Águas',         color: '#2C9CB0' },
  { name: 'Refrigerantes', color: '#2C7BB0' },
  { name: 'Sucos',         color: '#E0A62C' },
  { name: 'Vinhos',        color: '#7A3B8C' },
  { name: 'Cervejas',      color: '#C08A2C' },
];
const insCat = db.prepare(`INSERT INTO categories (name, color, sort) VALUES (?,?,?)`);
const catIds = {};
categories.forEach((c, i) => { catIds[c.name] = insCat.run(c.name, c.color, i).lastInsertRowid; });

const BUFFET = '/produtos/demo-buffet.jpg';
const AGUA = '/produtos/demo-agua.jpg';
const REFRI = '/produtos/demo-refrigerante.jpg';
const SUCO = '/produtos/demo-suco.jpg';
const VINHO = '/produtos/demo-vinho.jpg';
const CERVEJA = '/produtos/demo-cerveja.jpg';

const products = [
  ['Buffet',        'Buffet Sábado/Feriado',    '', 50.00, BUFFET],
  ['Buffet',        'Buffet Livre',             '', 35.00, BUFFET],

  ['Extras',        'Ovo',                      '', 2.00,  '/produtos/demo-ovo.jpg'],
  ['Extras',        'Bife',                     '', 5.00,  '/produtos/demo-picanha.jpg'],

  ['Águas',         'Água',                     '', 5.00,  AGUA],
  ['Águas',         'H2O',                      '', 10.00, AGUA],

  ['Refrigerantes', 'Refrigerante Lata',        '', 8.00,  REFRI],
  ['Refrigerantes', 'Refrigerante 600ml',       '', 10.00, REFRI],
  ['Refrigerantes', 'Refri KS',                 '', 5.00,  REFRI],
  ['Refrigerantes', 'Fruki',                    '', 10.00, REFRI],
  ['Refrigerantes', 'Refrigerante 1 Litro',     '', 12.00, REFRI],
  ['Refrigerantes', 'Coca-Cola 2 Litros',       '', 18.00, REFRI],
  ['Refrigerantes', 'Guaraná 2 Litros',         '', 16.00, REFRI],

  ['Sucos',         'Suco de Uva Copo',         '', 8.00,  SUCO],
  ['Sucos',         'Suco de Uva Jarra',        '', 20.00, SUCO],
  ['Sucos',         'Suco de Laranja Copo',     '', 10.00, SUCO],
  ['Sucos',         'Suco de Laranja Jarra',    '', 25.00, SUCO],
  ['Sucos',         'Suco Del Vale',            '', 8.00,  SUCO],
  ['Sucos',         'Suco Del Vale Caixa',      '', 5.00,  SUCO],

  ['Vinhos',        'Vinho Jarra',              '', 20.00, VINHO],
  ['Vinhos',        'Vinho Copo',               '', 8.00,  VINHO],

  ['Cervejas',      'Heineken 600ml',           '', 22.00, CERVEJA],
  ['Cervejas',      'Original 600ml',           '', 16.00, CERVEJA],
  ['Cervejas',      'Brahma/Antarctica 600ml',  '', 12.00, CERVEJA],
  ['Cervejas',      'Cerveja Lata',             '', 8.00,  CERVEJA],
];
const insProd = db.prepare(
  `INSERT INTO products (category_id, name, description, price, sort, image) VALUES (?,?,?,?,?,?)`
);
products.forEach((p, i) => insProd.run(catIds[p[0]], p[1], p[2], p[3], i, p[4]));

// ---- Mesas --------------------------------------------------
const insTable = db.prepare(`INSERT INTO restaurant_tables (name, seats) VALUES (?,?)`);
for (let i = 1; i <= 12; i++) insTable.run(`Mesa ${i}`, i <= 8 ? 4 : 6);

console.log('✅ Seed concluído.');
console.log('   Usuários: admin/admin123 · gerente/gerente123 · caixa/caixa123 · garcom/garcom123');
