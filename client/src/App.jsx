import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { auth } from './api.js';
import Logo from './components/Logo.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import PDV from './pages/PDV.jsx';
import Mesas from './pages/Mesas.jsx';
import Caixa from './pages/Caixa.jsx';
import Financeiro from './pages/Financeiro.jsx';
import Relatorios from './pages/Relatorios.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Cardapio from './pages/Cardapio.jsx';
import Garcom from './pages/Garcom.jsx';
import Atendente from './pages/Atendente.jsx';
import Display from './pages/Display.jsx';
import ConfigBuffet from './pages/ConfigBuffet.jsx';
import Marca from './pages/Marca.jsx';
import Comanda from './pages/Comanda.jsx';
import Cozinha from './pages/Cozinha.jsx';
import Adicionais from './pages/Adicionais.jsx';
import Estoque from './pages/Estoque.jsx';
import FichaTecnica from './pages/FichaTecnica.jsx';
import Delivery from './pages/Delivery.jsx';
import Entregadores from './pages/Entregadores.jsx';
import ConfigFiscal from './pages/ConfigFiscal.jsx';
import Notas from './pages/Notas.jsx';

const NAV = [
  { to: '/',           ic: '🏠', label: 'Início',      roles: ['admin','gerente','caixa','garcom'] },
  { to: '/pdv',        ic: '🧾', label: 'PDV Vendas',  roles: ['admin','gerente','caixa','garcom'] },
  { to: '/mesas',      ic: '🍽️', label: 'Mesas',       roles: ['admin','gerente','caixa','garcom'] },
  { to: '/cozinha',    ic: '🍳', label: 'Cozinha',     roles: ['admin','gerente','caixa','garcom'] },
  { to: '/delivery',   ic: '🛵', label: 'Delivery',    roles: ['admin','gerente','caixa','garcom'] },
  { to: '/caixa',      ic: '💵', label: 'Caixa',       roles: ['admin','gerente','caixa'] },
  { to: '/notas',      ic: '🧾', label: 'Notas Fiscais', roles: ['admin','gerente','caixa'] },
  { to: '/financeiro', ic: '📊', label: 'Financeiro',  roles: ['admin','gerente','caixa'] },
  { to: '/relatorios', ic: '📈', label: 'Relatórios',  roles: ['admin','gerente','caixa'] },
  { to: '/cardapio',   ic: '📖', label: 'Cardápio',    roles: ['admin','gerente'] },
  { to: '/adicionais', ic: '🍔', label: 'Adicionais',  roles: ['admin','gerente'] },
  { to: '/estoque',    ic: '📦', label: 'Estoque',     roles: ['admin','gerente','caixa'] },
  { to: '/ficha-tecnica', ic: '📋', label: 'Ficha Técnica', roles: ['admin','gerente'] },
  { to: '/entregadores', ic: '🛵', label: 'Entregadores', roles: ['admin','gerente'] },
  { to: '/marca',      ic: '🎨', label: 'Marca',        roles: ['admin','gerente'] },
  { to: '/config-buffet', ic: '⚖️', label: 'Config. Buffet', roles: ['admin','gerente'] },
  { to: '/config-fiscal', ic: '⚙️', label: 'Config. Fiscal', roles: ['admin','gerente'] },
  { to: '/usuarios',   ic: '👥', label: 'Usuários',    roles: ['admin','gerente'] },
];

function Shell({ children }) {
  const user = auth.user;
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const items = NAV.filter(n => n.roles.includes(user?.role));

  function logout() { auth.clear(); nav('/login'); }

  return (
    <div className="app">
      <div className="topbar-m">
        <button onClick={() => setOpen(!open)}>☰</button>
        <b style={{ fontStyle: 'italic' }}>Paladar</b>
      </div>
      {open && <div className="sidebar-bg" onClick={() => setOpen(false)} />}
      <aside className={'sidebar' + (open ? ' open' : '')} onClick={() => setOpen(false)}>
        <div className="side-brand">
          <Logo variant="red" compact className="logo" />
          <b>Paladar</b>
        </div>
        <nav className="nav">
          {items.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="ic">{n.ic}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="who">{user?.name}</div>
          <div className="role">{user?.role}</div>
          <button onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className="content" key={loc.pathname}>{children}</main>
    </div>
  );
}

// `bare` = exige login mas ocupa a tela toda, sem menu lateral (ex.: KDS da cozinha).
function Protected({ children, roles, bare }) {
  const user = auth.user;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role) && user.role !== 'admin')
    return <Navigate to="/" replace />;
  return bare ? children : <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Tela do cliente: espelho do atendente, sem login e sem interação. */}
      <Route path="/display" element={<Display />} />
      {/* App do garçom no celular: escolhe a mesa e lança pedidos (com login). */}
      <Route path="/totem" element={<Protected bare><Garcom /></Protected>} />
      <Route path="/garcom" element={<Protected bare><Garcom /></Protected>} />
      <Route path="/tablet" element={<Navigate to="/totem" replace />} />
      {/* App do atendente (celular) */}
      <Route path="/atendente" element={<Protected><Atendente /></Protected>} />
      <Route path="/config-buffet" element={<Protected roles={['gerente']}><ConfigBuffet /></Protected>} />
      <Route path="/marca" element={<Protected roles={['gerente']}><Marca /></Protected>} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/pdv" element={<Protected><PDV /></Protected>} />
      <Route path="/mesas" element={<Protected><Mesas /></Protected>} />
      <Route path="/comanda/:id" element={<Protected><Comanda /></Protected>} />
      <Route path="/cozinha" element={<Protected bare><Cozinha /></Protected>} />
      <Route path="/caixa" element={<Protected roles={['gerente','caixa']}><Caixa /></Protected>} />
      <Route path="/financeiro" element={<Protected roles={['gerente','caixa']}><Financeiro /></Protected>} />
      <Route path="/relatorios" element={<Protected roles={['gerente','caixa']}><Relatorios /></Protected>} />
      <Route path="/cardapio" element={<Protected roles={['gerente']}><Cardapio /></Protected>} />
      <Route path="/adicionais" element={<Protected roles={['gerente']}><Adicionais /></Protected>} />
      <Route path="/delivery" element={<Protected><Delivery /></Protected>} />
      <Route path="/entregadores" element={<Protected roles={['gerente']}><Entregadores /></Protected>} />
      <Route path="/notas" element={<Protected roles={['gerente','caixa']}><Notas /></Protected>} />
      <Route path="/config-fiscal" element={<Protected roles={['gerente']}><ConfigFiscal /></Protected>} />
      <Route path="/estoque" element={<Protected roles={['gerente','caixa']}><Estoque /></Protected>} />
      <Route path="/ficha-tecnica" element={<Protected roles={['gerente']}><FichaTecnica /></Protected>} />
      <Route path="/usuarios" element={<Protected roles={['gerente']}><Usuarios /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
