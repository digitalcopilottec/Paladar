import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, auth, money } from '../api.js';

const SHORTCUTS = [
  { to: '/pdv',        ic: '🧾', b: 'PDV Vendas',  s: 'Abrir comanda e vender',      roles: ['admin','gerente','caixa','garcom'] },
  { to: '/mesas',      ic: '🍽️', b: 'Mesas',        s: 'Mapa do salão',               roles: ['admin','gerente','caixa','garcom'] },
  { to: '/cozinha',    ic: '🍳', b: 'Cozinha (KDS)', s: 'Pedidos em preparo',         roles: ['admin','gerente','caixa','garcom'] },
  { to: '/caixa',      ic: '💵', b: 'Caixa',        s: 'Abrir/fechar e sangria',      roles: ['admin','gerente','caixa'] },
  { to: '/financeiro', ic: '📊', b: 'Financeiro',   s: 'Contas a pagar e receber',    roles: ['admin','gerente','caixa'] },
  { to: '/relatorios', ic: '📈', b: 'Relatórios',   s: 'Vendas e desempenho',         roles: ['admin','gerente','caixa'] },
  { to: '/cardapio',   ic: '📖', b: 'Cardápio',     s: 'Produtos e preços',           roles: ['admin','gerente'] },
  { to: '/usuarios',   ic: '👥', b: 'Usuários',     s: 'Equipe e permissões',         roles: ['admin','gerente'] },
];

export default function Home() {
  const user = auth.user;
  const nav = useNavigate();
  const [sum, setSum] = useState(null);
  const canReport = ['admin', 'gerente', 'caixa'].includes(user.role);

  useEffect(() => {
    if (canReport) api('/reports/summary').then(setSum).catch(() => {});
  }, []);

  const tiles = SHORTCUTS.filter(t => t.roles.includes(user.role));
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{greet}, {user.name.split(' ')[0]} 👋</h1>
          <div className="sub">Painel do restaurante Paladar — {new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      {canReport && sum && (
        <div className="grid cards" style={{ marginBottom: 24 }}>
          <div className="card stat brand">
            <span className="label">Faturamento hoje</span>
            <span className="value">{money(sum.faturamento)}</span>
          </div>
          <div className="card stat">
            <span className="label">Pedidos fechados</span>
            <span className="value">{sum.pedidos}</span>
          </div>
          <div className="card stat">
            <span className="label">Ticket médio</span>
            <span className="value">{money(sum.ticketMedio)}</span>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 16, color: 'var(--muted)', margin: '0 0 12px' }}>Acesso rápido</h2>
      <div className="grid cards">
        {tiles.map(t => (
          <button key={t.to} className="tile" onClick={() => nav(t.to)}>
            <span className="ic">{t.ic}</span>
            <b>{t.b}</b>
            <span>{t.s}</span>
          </button>
        ))}
      </div>
    </>
  );
}
