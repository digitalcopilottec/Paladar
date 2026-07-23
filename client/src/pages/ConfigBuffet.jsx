import React, { useEffect, useState } from 'react';
import { api, money } from '../api.js';

const KINDS = { kg: 'por quilo', pessoa: 'por pessoa', unidade: 'por unidade' };
const UN = { kg: '/kg', pessoa: '/pessoa', unidade: '/un' };
const novoPlano = { name: '', kind: 'kg', price: '', price_saturday: '' };

export default function ConfigBuffet() {
  const [plans, setPlans] = useState([]);
  const [tareG, setTareG] = useState(0);
  const [form, setForm] = useState(novoPlano);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const carregar = () => {
    api('/buffet/plans').then(setPlans).catch(e => setErr(e.message));
    api('/buffet/config').then(c => setTareG(Math.round((c.tare_kg || 0) * 1000)));
  };
  useEffect(() => { carregar(); }, []);

  async function salvarTara() {
    setErr(''); setMsg('');
    try {
      await api('/buffet/config', { method: 'PUT', body: { tare_kg: (Number(tareG) || 0) / 1000 } });
      setMsg('Tara salva.'); setTimeout(() => setMsg(''), 3000);
    } catch (e) { setErr(e.message); }
  }

  async function salvarPlano(p) {
    setErr('');
    try {
      await api(`/buffet/plans/${p.id}`, {
        method: 'PUT',
        body: { name: p.name, kind: p.kind, price: Number(p.price) || 0,
                price_saturday: Number(p.price_saturday) || 0 },
      });
      setMsg('Plano salvo.'); setTimeout(() => setMsg(''), 2500); carregar();
    } catch (e) { setErr(e.message); }
  }

  async function criar(e) {
    e.preventDefault(); setErr('');
    try {
      await api('/buffet/plans', { method: 'POST', body: {
        ...form, price: Number(form.price) || 0, price_saturday: Number(form.price_saturday) || 0 } });
      setForm(novoPlano); setShow(false); carregar();
    } catch (e) { setErr(e.message); }
  }

  async function remover(p) {
    if (!confirm(`Remover o plano "${p.name}"?`)) return;
    await api(`/buffet/plans/${p.id}`, { method: 'DELETE' }); carregar();
  }

  const set = (id, campo, v) => setPlans(ps => ps.map(p => p.id === id ? { ...p, [campo]: v } : p));

  return (
    <>
      <div className="page-head">
        <div><h1>⚖️ Config. Buffet</h1><div className="sub">Planos de preço e desconto do prato</div></div>
        <button className="btn sm" onClick={() => setShow(true)}>+ Novo plano</button>
      </div>

      {err && <div className="error-msg">{err}</div>}
      {msg && <div className="split-out" style={{ marginBottom: 14 }}>{msg}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <table>
          <thead><tr>
            <th>Plano</th><th>Cobra</th><th style={{ textAlign: 'right' }}>Preço</th>
            <th style={{ textAlign: 'right' }}>Preço sábado</th><th></th>
          </tr></thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td>
                  <input className="input" value={p.name}
                    onChange={e => set(p.id, 'name', e.target.value)} style={{ maxWidth: 200 }} />
                </td>
                <td>
                  <select className="input" value={p.kind} onChange={e => set(p.id, 'kind', e.target.value)}
                    style={{ maxWidth: 150 }}>
                    {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <input className="input" type="number" step="0.01" value={p.price}
                    onChange={e => set(p.id, 'price', e.target.value)} style={{ maxWidth: 110, textAlign: 'right' }} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <input className="input" type="number" step="0.01" value={p.price_saturday}
                    onChange={e => set(p.id, 'price_saturday', e.target.value)}
                    style={{ maxWidth: 110, textAlign: 'right' }} placeholder="0 = igual" />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn sm" onClick={() => salvarPlano(p)}>Salvar</button>{' '}
                  <button className="btn sm ghost" onClick={() => remover(p)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint" style={{ textAlign: 'left', marginTop: 10 }}>
          <b>Preço sábado</b>: deixe <b>0</b> para cobrar o mesmo valor todo dia. Com valor,
          o sistema troca sozinho no sábado (ex.: Buffet Livre R$ 35 na semana, R$ 50 no sábado).
        </p>
      </div>

      <div className="card" style={{ maxWidth: 460 }}>
        <h3 style={{ marginTop: 0 }}>Tara (prato vazio)</h3>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Peso do prato vazio (gramas)</label>
            <input className="input" type="number" value={tareG} onChange={e => setTareG(e.target.value)} />
          </div>
          <button className="btn sm" onClick={salvarTara}>Salvar</button>
        </div>
        <p className="hint" style={{ textAlign: 'left', marginBottom: 0 }}>
          Descontada só dos planos <b>por quilo</b>. Se a balança já desconta, deixe <b>0</b>.
        </p>
      </div>

      {show && (
        <div className="modal-bg" onClick={() => setShow(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={criar}>
            <h3>Novo plano</h3>
            <div className="field"><label>Nome</label>
              <input className="input" required autoFocus value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Marmita Frango" /></div>
            <div className="field"><label>Como cobra</label>
              <select className="input" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}>
                {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div className="row">
              <div className="field"><label>Preço {UN[form.kind]}</label>
                <input className="input" type="number" step="0.01" required value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              <div className="field"><label>Preço sábado (0 = igual)</label>
                <input className="input" type="number" step="0.01" value={form.price_saturday}
                  onChange={e => setForm({ ...form, price_saturday: e.target.value })} /></div>
            </div>
            <button className="btn">Criar plano</button>
          </form>
        </div>
      )}
    </>
  );
}
