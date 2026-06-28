-- Usuarios del bot (un registro por chat_id de Telegram)
create table if not exists bot_users (
  chat_id       text primary key,
  username      text,
  full_name     text,
  state         text default 'idle',       -- idle | awaiting_confirmation
  pending_expense jsonb,                   -- gasto pendiente de confirmar
  updated_at    timestamptz default now()
);

-- Reportes de gastos (ej: "Almuerzo Julio 2026")
create table if not exists bot_reports (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  estado        text default 'borrador',   -- borrador | enviado_concur
  concur_report_id text,
  created_at    timestamptz default now()
);

-- Gastos individuales capturados desde tickets
create table if not exists bot_expenses (
  id            uuid primary key default gen_random_uuid(),
  chat_id       text references bot_users(chat_id),
  report_id     uuid references bot_reports(id),
  monto         numeric not null,
  moneda        text default 'ARS',
  comercio      text,
  fecha         date not null,
  categoria     text,
  descripcion   text,
  imagen_base64 text,                      -- foto del ticket
  concur_entry_id text,
  card_tx_id    uuid,                      -- si está matcheado con tarjeta
  estado        text default 'pendiente',  -- pendiente | enviado_concur
  created_at    timestamptz default now()
);

-- Transacciones de tarjeta importadas desde CSV
create table if not exists bot_card_transactions (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null,
  descripcion   text,
  monto         numeric not null,
  moneda        text default 'ARS',
  matched_expense_id uuid references bot_expenses(id),
  raw_row       jsonb,                     -- fila original del CSV
  created_at    timestamptz default now()
);

-- Índices
create index if not exists bot_expenses_report_id on bot_expenses(report_id);
create index if not exists bot_expenses_fecha on bot_expenses(fecha);
create index if not exists bot_card_transactions_fecha on bot_card_transactions(fecha);

-- RLS: desactivado para service role (el bot usa service role key)
alter table bot_users enable row level security;
alter table bot_reports enable row level security;
alter table bot_expenses enable row level security;
alter table bot_card_transactions enable row level security;
