import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api.js';

export default function Mesas() {
  const [tables, setTables] = useState([]);
  const [err, setErr] = useState('');
  const [reservar, setReservar] = useState(null);   // mesa sendo reservada
  const [form, setForm] = useState({ name: '', info: '' });
  const nav = useNavigate();
  const load = () => api('/tables').then(setTables);
  useEffect(() => { load(); }, []);

  // Mesa ocupada/reservada → abre a comanda (senta o cliente). Livre → nova comanda.
  async function openTable(t) {
    setErr('');
    if (t.pago) return;
    try {
      if (t.order) return nav(`/comanda/${t.order.id}`);
      const order = await api('/orders', { method: 'POST', body: { type: 'mesa', table_id: t.id } });
      nav(`/comanda/${order.id}`);
    } catch (e) { setErr(e.message); }
  }

  async function liberar(t, e) {
    e.stopPropagation();
    const msg = t.status === 'reservada' ? `Cancelar a reserva da ${t.name}?` : `Liberar a ${t.name}?`;
    if (!confirm(msg)) return;
    try { await api(`/tables/${t.id}/free`, { method: 'POST' }); load(); }
    catch (e) { setErr(e.message); }
  }

  async function salvarReserva(e) {
    e.preventDefault(); setErr('');
    try {
      await api(`/tables/${reservar.id}/reserve`, { method: 'POST', body: form });
      setReservar(null); setForm({ name: '', info: '' }); load();
    } catch (e) { setErr(e.message); }
  }

  const ocupadas = tables.filter(t => t.order).length;
  const reservadas = tables.filter(t => t.status === 'reservada').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>🍽️ Mesas</h1>
          <div className="sub">
            {ocupadas} ocupada(s) · {reservadas} reservada(s) de {tables.length}
          </div>
        </div>
        <button className="btn sm ghost" onClick={load}>Atualizar</button>
      </div>

      {err && <div className="error-msg">{err}</div>}

      <div className="grid cards">
        {tables.map(t => (
          <button className="card tile" key={t.id} onClick={() => openTable(t)}
            style={{
              borderColor: t.order ? 'var(--brand)' : t.status === 'reservada' ? 'var(--warn)' : 'var(--line)',
              alignItems: 'stretch',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <b style={{ fontSize: 18 }}>{t.name}</b>
              <span className={'badge ' + t.status}>{t.status}</span>
            </div>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>{t.seats} lugares</span>

            {t.order ? (
              <div style={{ textAlign: 'left', marginTop: 'auto' }}>
                <div style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 18 }}>{money(t.order.total)}</div>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Comanda {t.order.code}</span>
              </div>
            ) : t.pago ? (
              <div style={{ textAlign: 'left', marginTop: 'auto', width: '100%' }}>
                <span className="badge livre">✓ pago no totem</span>
                <div style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 8px' }}>
                  {t.pago.code} · {money(t.pago.total)}
                </div>
                <button className="btn sm secondary" style={{ width: '100%' }}
                  onClick={(e) => liberar(t, e)}>Liberar mesa</button>
              </div>
            ) : t.status === 'reservada' ? (
              <div style={{ textAlign: 'left', marginTop: 'auto', width: '100%' }}>
                <div style={{ fontWeight: 700, color: 'var(--warn)' }}>📌 {t.reserved_name}</div>
                {t.reserved_info && <div style={{ color: 'var(--muted)', fontSize: 12 }}>{t.reserved_info}</div>}
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn sm" onClick={() => openTable(t)}>Sentar</button>
                  <button className="btn sm ghost" onClick={(e) => liberar(t, e)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'left', marginTop: 'auto', width: '100%' }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>+ Abrir comanda</span>
                <button className="btn sm ghost" style={{ width: '100%', marginTop: 8 }}
                  onClick={(e) => { e.stopPropagation(); setReservar(t); }}>📌 Reservar</button>
              </div>
            )}
          </button>
        ))}
      </div>

      {reservar && (
        <div className="modal-bg" onClick={() => setReservar(null)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={salvarReserva}>
            <h3>Reservar {reservar.name}</h3>
            <div className="field">
              <label>Nome da reserva</label>
              <input className="input" required autoFocus value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Sr. Carlos" />
            </div>
            <div className="field">
              <label>Observação (horário, nº de pessoas…)</label>
              <input className="input" value={form.info}
                onChange={e => setForm({ ...form, info: e.target.value })} placeholder="20h · 4 pessoas" />
            </div>
            <button className="btn">Reservar</button>
          </form>
        </div>
      )}
    </>
  );
}
