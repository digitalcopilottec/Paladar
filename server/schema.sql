-- ============================================================
--  Paladar - Esquema do banco de dados (SQLite)
-- ============================================================
PRAGMA foreign_keys = ON;

-- Usuários e controle de acesso -------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  username      TEXT    NOT NULL UNIQUE,
  email         TEXT,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'garcom', -- admin | gerente | caixa | garcom
  pin           TEXT,                              -- PIN rápido p/ PDV (opcional)
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Cardápio ----------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT    NOT NULL,
  color    TEXT    DEFAULT '#B01E28',
  sort     INTEGER NOT NULL DEFAULT 0,
  active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name         TEXT    NOT NULL,
  description  TEXT,
  price        REAL    NOT NULL DEFAULT 0,
  cost         REAL    NOT NULL DEFAULT 0,
  image        TEXT,
  active       INTEGER NOT NULL DEFAULT 1,
  sort         INTEGER NOT NULL DEFAULT 0
);

-- Adicionais / opções do produto ------------------------------
-- Ex.: grupo "Ponto da carne" (obrigatório, escolhe 1) com opções mal/ao ponto/bem;
--      grupo "Adicionais" (opcional, até 5) com bacon +5,00, queijo +4,00.
CREATE TABLE IF NOT EXISTS option_groups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  min_select INTEGER NOT NULL DEFAULT 0,  -- >=1 torna o grupo obrigatório
  max_select INTEGER NOT NULL DEFAULT 1,
  sort       INTEGER NOT NULL DEFAULT 0,
  active     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS options (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id    INTEGER NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  price_delta REAL    NOT NULL DEFAULT 0,  -- pode ser 0 (ponto da carne) ou +valor (bacon)
  sort        INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1
);

-- Quais grupos valem para quais produtos
CREATE TABLE IF NOT EXISTS product_option_groups (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_id   INTEGER NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  sort       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, group_id)
);

-- Opções escolhidas num item do pedido (cópia congelada: nome e preço do momento da venda)
CREATE TABLE IF NOT EXISTS order_item_options (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  option_id     INTEGER REFERENCES options(id),
  name          TEXT    NOT NULL,
  price_delta   REAL    NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_options_group ON options(group_id);
CREATE INDEX IF NOT EXISTS idx_oio_item ON order_item_options(order_item_id);

-- Mesas -------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT    NOT NULL,
  seats   INTEGER NOT NULL DEFAULT 4,
  status  TEXT    NOT NULL DEFAULT 'livre' -- livre | ocupada | reservada
);

-- Pedidos / Comandas -----------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT    NOT NULL UNIQUE,
  type          TEXT    NOT NULL DEFAULT 'mesa',   -- mesa | balcao | delivery
  table_id      INTEGER REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  customer_name TEXT,
  status        TEXT    NOT NULL DEFAULT 'aberto',  -- aberto | fechado | cancelado
  waiter_id     INTEGER REFERENCES users(id),
  opened_by     INTEGER REFERENCES users(id),
  subtotal      REAL    NOT NULL DEFAULT 0,
  service_fee   REAL    NOT NULL DEFAULT 0,
  discount      REAL    NOT NULL DEFAULT 0,
  total         REAL    NOT NULL DEFAULT 0,
  notes         TEXT,
  opened_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  closed_at     TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  name       TEXT    NOT NULL,
  qty        REAL    NOT NULL DEFAULT 1,
  unit_price REAL    NOT NULL DEFAULT 0,
  total      REAL    NOT NULL DEFAULT 0,
  notes      TEXT,
  status     TEXT    NOT NULL DEFAULT 'novo',   -- novo | preparando | pronto | entregue
  created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Pagamentos --------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method   TEXT    NOT NULL,   -- dinheiro | credito | debito | pix
  amount   REAL    NOT NULL DEFAULT 0,
  received REAL    NOT NULL DEFAULT 0,
  change   REAL    NOT NULL DEFAULT 0,
  user_id  INTEGER REFERENCES users(id),
  paid_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Caixa (sessões e movimentos) -------------------------------
CREATE TABLE IF NOT EXISTS cash_sessions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  opened_by      INTEGER REFERENCES users(id),
  opening_amount REAL    NOT NULL DEFAULT 0,
  closing_amount REAL,
  status         TEXT    NOT NULL DEFAULT 'aberto', -- aberto | fechado
  opened_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  closed_at      TEXT
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER REFERENCES cash_sessions(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL,   -- venda | sangria | suprimento | entrada | saida
  amount      REAL    NOT NULL DEFAULT 0,
  description TEXT,
  user_id     INTEGER REFERENCES users(id),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Estoque / Insumos -------------------------------------------
-- Cada insumo tem UMA unidade. A ficha técnica usa a mesma unidade do insumo
-- (ex.: picanha em 'g' → ficha pede 300 g). Sem conversão automática, de propósito:
-- conversão silenciosa é fonte clássica de erro de custo.
CREATE TABLE IF NOT EXISTS ingredients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  unit          TEXT    NOT NULL DEFAULT 'un',   -- g | kg | ml | L | un
  stock_qty     REAL    NOT NULL DEFAULT 0,
  min_stock     REAL    NOT NULL DEFAULT 0,      -- alerta de reposição
  cost_per_unit REAL    NOT NULL DEFAULT 0,      -- custo por 1 unidade acima
  supplier      TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Ficha técnica: quanto de cada insumo um PRODUTO ou um ADICIONAL consome.
-- Exatamente um entre product_id e option_id é preenchido (o adicional bacon
-- também tira bacon do estoque).
CREATE TABLE IF NOT EXISTS recipe_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    INTEGER REFERENCES products(id) ON DELETE CASCADE,
  option_id     INTEGER REFERENCES options(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  qty           REAL    NOT NULL DEFAULT 0,
  CHECK ((product_id IS NULL) <> (option_id IS NULL))
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  type          TEXT    NOT NULL,   -- entrada | venda | ajuste | perda
  qty           REAL    NOT NULL DEFAULT 0,   -- positivo entra, negativo sai
  unit_cost     REAL    NOT NULL DEFAULT 0,
  description   TEXT,
  order_id      INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  user_id       INTEGER REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_recipe_product ON recipe_items(product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_option ON recipe_items(option_id);
CREATE INDEX IF NOT EXISTS idx_stockmov_ing ON stock_movements(ingredient_id);

-- Delivery -----------------------------------------------------
-- Cliente identificado pelo telefone: é o que o atendente tem em mãos na ligação.
CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  phone      TEXT    NOT NULL UNIQUE,
  street     TEXT, number TEXT, complement TEXT,
  district   TEXT, city TEXT, reference TEXT,
  notes      TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS couriers (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT    NOT NULL,
  phone  TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

-- Dados de entrega de um pedido. O endereço é CÓPIA do cadastro do cliente:
-- se ele mudar de casa depois, a entrega antiga não pode mudar de endereço.
CREATE TABLE IF NOT EXISTS deliveries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  customer_id   INTEGER REFERENCES customers(id),
  customer_name TEXT    NOT NULL,
  phone         TEXT    NOT NULL,
  street        TEXT, number TEXT, complement TEXT,
  district      TEXT, city TEXT, reference TEXT,
  status        TEXT    NOT NULL DEFAULT 'pendente',  -- pendente | saiu | entregue
  courier_id    INTEGER REFERENCES couriers(id),
  dispatched_at TEXT,
  delivered_at  TEXT,
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Fiscal (NFC-e modelo 65) ------------------------------------
-- Dados do emitente. Linha única (id = 1).
CREATE TABLE IF NOT EXISTS company (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  razao_social  TEXT, nome_fantasia TEXT,
  cnpj          TEXT, ie TEXT, im TEXT,
  crt           INTEGER NOT NULL DEFAULT 1,   -- 1=Simples, 2=Simples excesso, 3=Regime normal
  street        TEXT, number TEXT, complement TEXT, district TEXT,
  city          TEXT, city_code TEXT,          -- city_code = código IBGE, obrigatório na NFC-e
  uf            TEXT DEFAULT 'RS', cep TEXT, phone TEXT,
  -- CSC/token: segredo da SEFAZ usado no QR Code. Preenchido pelo lojista.
  csc_id        TEXT, csc TEXT,
  serie         INTEGER NOT NULL DEFAULT 1,
  next_number   INTEGER NOT NULL DEFAULT 1,
  ambiente      INTEGER NOT NULL DEFAULT 2,   -- 1=produção, 2=homologação (padrão seguro)
  provider      TEXT,                          -- provedor de transmissão (plugnotas, focus...)
  updated_at    TEXT
);

-- Notas emitidas. O XML e a chave ficam guardados: a lei exige guardar 5 anos.
CREATE TABLE IF NOT EXISTS fiscal_docs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  modelo       TEXT    NOT NULL DEFAULT '65',
  serie        INTEGER,
  numero       INTEGER,
  chave        TEXT,
  protocolo    TEXT,
  status       TEXT    NOT NULL DEFAULT 'pendente', -- pendente|autorizada|rejeitada|cancelada
  ambiente     INTEGER NOT NULL DEFAULT 2,
  motivo       TEXT,                                 -- rejeição ou justificativa do cancelamento
  payload      TEXT,                                 -- JSON enviado ao provedor
  xml          TEXT,
  valor_total  REAL    NOT NULL DEFAULT 0,
  emitted_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  user_id      INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_order ON fiscal_docs(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_status ON fiscal_docs(status);

-- Buffet por quilo ---------------------------------------------
-- Linha única (id = 1). Cobre os dois modelos ao mesmo tempo:
-- total = (peso líquido × price_per_kg) + (pessoas × price_per_person).
-- Zerando um dos dois, vira só por quilo OU só preço fixo por pessoa.
CREATE TABLE IF NOT EXISTS buffet_config (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  price_per_kg     REAL NOT NULL DEFAULT 0,
  price_per_person REAL NOT NULL DEFAULT 0,
  tare_kg          REAL NOT NULL DEFAULT 0,   -- peso do prato vazio, descontado
  updated_at       TEXT
);

-- Planos do buffet que o atendente escolhe na hora de cobrar.
-- kind: 'kg' (cobra por peso) | 'pessoa' (valor por pessoa) | 'unidade' (por marmita).
-- price_saturday > 0 troca o preço no sábado (ex.: Buffet Livre R$35 semana / R$50 sáb).
CREATE TABLE IF NOT EXISTS buffet_plans (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  kind           TEXT    NOT NULL DEFAULT 'kg',
  price          REAL    NOT NULL DEFAULT 0,
  price_saturday REAL    NOT NULL DEFAULT 0,
  sort           INTEGER NOT NULL DEFAULT 0,
  active         INTEGER NOT NULL DEFAULT 1
);

-- Estado do display do cliente. O atendente escreve, a tela do cliente lê.
-- É o "espelho": uma linha só, sempre a pesagem atual.
CREATE TABLE IF NOT EXISTS display_state (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  status         TEXT NOT NULL DEFAULT 'ocioso',  -- ocioso | pesando | pago
  gross_kg       REAL DEFAULT 0,
  net_kg         REAL DEFAULT 0,
  people         INTEGER DEFAULT 1,
  price_per_kg   REAL DEFAULT 0,
  total          REAL DEFAULT 0,
  order_code     TEXT,
  payment_method TEXT,
  updated_at     TEXT
);

-- Financeiro (contas a pagar / receber) ----------------------
CREATE TABLE IF NOT EXISTS financial_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT    NOT NULL,   -- receita | despesa
  category    TEXT,
  description TEXT    NOT NULL,
  amount      REAL    NOT NULL DEFAULT 0,
  due_date    TEXT,
  paid        INTEGER NOT NULL DEFAULT 0,
  paid_at     TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);
