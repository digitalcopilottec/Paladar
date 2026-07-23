import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.PALADAR_DB || path.join(__dirname, '..', 'data', 'paladar.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Aplica o esquema (idempotente)
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// --- Migrações -------------------------------------------------
// CREATE TABLE IF NOT EXISTS não adiciona coluna em tabela que já existe,
// então colunas novas precisam ser aplicadas aqui, sem perder os dados.
function addColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`↳ migração: ${table}.${column} adicionada`);
  }
}

// Custo do item congelado no momento da venda: o preço do insumo muda com o tempo,
// e o CMV histórico não pode mudar junto.
addColumn('order_items', 'unit_cost', 'REAL NOT NULL DEFAULT 0');

// Taxa de entrega: soma no total, mas é separada da taxa de serviço (10% do garçom).
addColumn('orders', 'delivery_fee', 'REAL NOT NULL DEFAULT 0');

// Dados fiscais do produto (NFC-e). Sem NCM/CFOP a nota é rejeitada pela SEFAZ.
// Padrões: NCM 2106.90.90 (preparações alimentícias), CFOP 5102 (venda no estado),
// CSOSN 102 (Simples, sem crédito), origem 0 (nacional).
addColumn('products', 'ncm', "TEXT NOT NULL DEFAULT '21069090'");
addColumn('products', 'cfop', "TEXT NOT NULL DEFAULT '5102'");
addColumn('products', 'csosn', "TEXT NOT NULL DEFAULT '102'");
addColumn('products', 'origem', "TEXT NOT NULL DEFAULT '0'");
addColumn('products', 'unidade', "TEXT NOT NULL DEFAULT 'UN'");
addColumn('products', 'cest', 'TEXT');

// Buffet por planos: o display do cliente precisa saber qual plano e a unidade.
addColumn('display_state', 'plan_name', 'TEXT');
addColumn('display_state', 'kind', "TEXT DEFAULT 'kg'");
addColumn('display_state', 'qty', 'REAL DEFAULT 0');

// Reserva de mesa: quem reservou e para quando.
addColumn('restaurant_tables', 'reserved_name', 'TEXT');
addColumn('restaurant_tables', 'reserved_info', 'TEXT');

export default db;
