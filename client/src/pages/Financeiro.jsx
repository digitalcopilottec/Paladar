import React, { useEffect, useState } from 'react';
import { api, money } from '../api.js';

const empty = { type: 'despesa', category: '', description: '', amount: '', due_date: '' };

export default function Financeiro() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const load = () => api('/financial').then(setData);
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api('/financial', { method: 'POST', body: { ...form, amount: Number(form.amount) } });
    setForm(empty); setShow(false); load();
  }
  async function pay(id) { await api(`/financial/${id}/pay`, { method: 'PUT' }); load(); }
  async function del(id) { if (confirm('Excluir lançamento?')) { await api(`/financial/${id}`, { method: 'DELETE' }); load(); } }

  if (!data) return <p>Carregando…</p>;

  return (
    <>
      <div className="page-head">
        <div><h1>📊 Financeiro</h1><div className="sub">Contas a pagar e receber</div></div>
        <button className="btn sm" onClick={() => setShow(true)}>+ Lançamento</button>
      </div>

      <div className="grid cards" style={{ marginBottom: 20 }}>
        <div className="card stat"><span className="label">Receitas</span><span className="value" style={{ color: 'var(--ok)' }}>{money(data.receitas)}</span></div>
        <div className="card stat"><span className="label">Despesas</span><span className="value" style={{ color: 'var(--brand)' }}>{money(data.despesas)}</span></div>
        <div className="card stat brand"><span className="label">Saldo</span><span className="value">{money(data.saldo)}</span></div>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Descrição</th><th>Categoria</th><th>Venc.</th><th>Tipo</th><th style={{ textAlign: 'right' }}>Valor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.entries.length === 0 && <tr><td colSpan={7} className="sub">Nenhum lançamento.</td></tr>}
            {data.entries.map(e => (
              <tr key={e.id}>
                <td>{e.description}</td>
                <td className="sub">{e.category || '—'}</td>
                <td className="sub">{e.due_date || '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{e.type}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: e.type === 'receita' ? 'var(--ok)' : 'var(--brand)' }}>
                  {money(e.amount)}
                </td>
                <td><span className={'badge ' + (e.paid ? 'livre' : 'reservada')}>{e.paid ? 'pago' : 'aberto'}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {!e.paid && <button className="btn sm secondary" onClick={() => pay(e.id)}>Pagar</button>}{' '}
                  <button className="btn sm ghost" onClick={() => del(e.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="modal-bg" onClick={() => setShow(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={save}>
            <h3>Novo lançamento</h3>
            <div className="pay-methods">
              <button type="button" className={form.type === 'receita' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'receita' })}>Receita</button>
              <button type="button" className={form.type === 'despesa' ? 'active' : ''} onClick={() => setForm({ ...form, type: 'despesa' })}>Despesa</button>
            </div>
            <div className="field"><label>Descrição</label>
              <input className="input" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="row">
              <div className="field"><label>Categoria</label>
                <input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ex: Fornecedor" /></div>
              <div className="field"><label>Valor</label>
                <input className="input" type="number" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div className="field"><label>Vencimento</label>
              <input className="input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <button className="btn">Salvar</button>
          </form>
        </div>
      )}
    </>
  );
}
