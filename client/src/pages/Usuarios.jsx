import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const ROLES = ['gerente', 'caixa', 'garcom', 'admin'];
const empty = { name: '', username: '', email: '', password: '', role: 'garcom' };

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const load = () => api('/users').then(setUsers);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault(); setErr('');
    try { await api('/users', { method: 'POST', body: form }); setForm(empty); setShow(false); load(); }
    catch (e) { setErr(e.message); }
  }
  async function toggle(u) {
    await api(`/users/${u.id}`, { method: 'PUT', body: { active: u.active ? 0 : 1 } }); load();
  }

  return (
    <>
      <div className="page-head">
        <div><h1>👥 Usuários</h1><div className="sub">Equipe e níveis de acesso</div></div>
        <button className="btn sm" onClick={() => setShow(true)}>+ Novo usuário</button>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Nome</th><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><b>{u.name}</b></td>
                <td className="sub">{u.username}</td>
                <td className="sub">{u.email || '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                <td><span className={'badge ' + (u.active ? 'livre' : 'ocupada')}>{u.active ? 'ativo' : 'inativo'}</span></td>
                <td><button className="btn sm ghost" onClick={() => toggle(u)}>{u.active ? 'Desativar' : 'Ativar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="modal-bg" onClick={() => setShow(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={save}>
            <h3>Novo usuário</h3>
            {err && <div className="error-msg">{err}</div>}
            <div className="field"><label>Nome completo</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="row">
              <div className="field"><label>Usuário (login)</label>
                <input className="input" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
              <div className="field"><label>Perfil</label>
                <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
                </select></div>
            </div>
            <div className="field"><label>E-mail</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Senha</label>
              <input className="input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <button className="btn">Criar usuário</button>
          </form>
        </div>
      )}
    </>
  );
}
