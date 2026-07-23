import React, { useEffect, useState } from 'react';
import { api, money } from '../api.js';

export default function Caixa() {
  const [cx, setCx] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState('');
  const load = () => api('/cash/current').then(d => { setCx(d); setLoaded(true); });
  useEffect(() => { load(); }, []);

  async function open() {
    const v = prompt('Valor de abertura (troco inicial):', '100');
    if (v == null) return;
    try { await api('/cash/open', { method: 'POST', body: { opening_amount: Number(v) } }); load(); }
    catch (e) { setErr(e.message); }
  }
  async function mov(type) {
    const label = type === 'sangria' ? 'Sangria (retirada)' : 'Suprimento (entrada)';
    const v = prompt(`${label} — valor:`);
    if (!v) return;
    const description = prompt('Descrição:') || '';
    await api('/cash/movement', { method: 'POST', body: { type, amount: Number(v), description } });
    load();
  }
  async function close() {
    const v = prompt('Valor contado na gaveta (fechamento):', String(cx?.esperado ?? 0));
    if (v == null) return;
    await api('/cash/close', { method: 'POST', body: { closing_amount: Number(v) } });
    load();
  }

  if (!loaded) return <p>Carregando…</p>;

  return (
    <>
      <div className="page-head">
        <div><h1>💵 Caixa</h1><div className="sub">Controle da gaveta e movimentações</div></div>
        {!cx && <button className="btn sm" onClick={open}>Abrir caixa</button>}
        {cx && <div className="row" style={{ maxWidth: 420 }}>
          <button className="btn sm secondary" onClick={() => mov('suprimento')}>+ Suprimento</button>
          <button className="btn sm secondary" onClick={() => mov('sangria')}>− Sangria</button>
          <button className="btn sm" onClick={close}>Fechar caixa</button>
        </div>}
      </div>
      {err && <div className="error-msg">{err}</div>}

      {!cx && <div className="card"><div className="empty">Nenhum caixa aberto. Abra o caixa para começar as vendas.</div></div>}

      {cx && <>
        <div className="grid cards" style={{ marginBottom: 20 }}>
          <div className="card stat"><span className="label">Abertura</span><span className="value">{money(cx.opening_amount)}</span></div>
          <div className="card stat"><span className="label">Vendas</span><span className="value">{money(cx.vendas)}</span></div>
          <div className="card stat"><span className="label">Suprimentos</span><span className="value">{money(cx.suprimentos)}</span></div>
          <div className="card stat"><span className="label">Sangrias</span><span className="value">{money(cx.sangrias)}</span></div>
          <div className="card stat brand"><span className="label">Saldo esperado</span><span className="value">{money(cx.esperado)}</span></div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Movimentações</h3>
          <table>
            <thead><tr><th>Hora</th><th>Tipo</th><th>Descrição</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
            <tbody>
              {cx.movements.length === 0 && <tr><td colSpan={4} className="sub">Sem movimentos ainda.</td></tr>}
              {cx.movements.map(m => (
                <tr key={m.id}>
                  <td>{m.created_at?.slice(11, 16)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{m.type}</td>
                  <td>{m.description}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700,
                    color: ['sangria','saida'].includes(m.type) ? 'var(--brand)' : 'var(--ok)' }}>
                    {['sangria','saida'].includes(m.type) ? '−' : '+'}{money(m.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}
    </>
  );
}
