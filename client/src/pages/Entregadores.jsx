import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Entregadores() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');

  const load = () => api('/delivery/couriers').then(setList).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault(); setErr('');
    try {
      await api('/delivery/couriers', { method: 'POST', body: form });
      setForm({ name: '', phone: '' }); setShow(false); load();
    } catch (e) { setErr(e.message); }
  }
  async function del(c) {
    if (!confirm(`Remover "${c.name}"? As entregas antigas dele continuam no histórico.`)) return;
    await api(`/delivery/couriers/${c.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <div className="page-head">
        <div><h1>🛵 Entregadores</h1><div className="sub">Quem leva os pedidos de delivery</div></div>
        <button className="btn sm" onClick={() => setShow(true)}>+ Novo entregador</button>
      </div>

      {err && <div className="error-msg">{err}</div>}

      <div className="card">
        <table>
          <thead><tr><th>Nome</th><th>Telefone</th><th></th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={3} className="sub">Nenhum entregador cadastrado.</td></tr>}
            {list.map(c => (
              <tr key={c.id}>
                <td><b>{c.name}</b></td>
                <td className="sub">{c.phone || '—'}</td>
                <td><button className="btn sm ghost" onClick={() => del(c)}>Remover</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="modal-bg" onClick={() => setShow(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={save}>
            <h3>Novo entregador</h3>
            <div className="field"><label>Nome</label>
              <input className="input" required autoFocus value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Marcos (moto)" /></div>
            <div className="field"><label>Telefone</label>
              <input className="input" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <button className="btn">Cadastrar</button>
          </form>
        </div>
      )}
    </>
  );
}
