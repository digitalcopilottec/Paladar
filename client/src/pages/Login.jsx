import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, auth } from '../api.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const nav = useNavigate();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (auth.user) { nav('/'); }

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { username, password } });
      auth.set(token, user);
      nav('/');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <Logo variant="red" className="brand-logo" />

        {err && <div className="error-msg">{err}</div>}

        <div className="field">
          <label>Usuário</label>
          <input className="input" autoFocus value={username}
            onChange={e => setU(e.target.value)} placeholder="seu usuário" />
        </div>
        <div className="field">
          <label>Senha</label>
          <input className="input" type="password" value={password}
            onChange={e => setP(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>

        <p className="hint">
          Perfis de teste:<br />
          admin · gerente · caixa · garcom<br />
          (senha = usuário + 123)
        </p>
      </form>
    </div>
  );
}
