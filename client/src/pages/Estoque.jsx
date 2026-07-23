import React, { useEffect, useState } from 'react';
import { api, money, moneyFine } from '../api.js';

const UNITS = ['g', 'kg', 'ml', 'L', 'un'];
const emptyIng = { name: '', unit: 'g', stock_qty: 0, min_stock: 0, cost_per_unit: '', supplier: '' };

export default function Estoque() {
  const [ings, setIngs] = useState([]);
  const [movs, setMovs] = useState([]);
  const [tab, setTab] = useState('insumos');
  const [form, setForm] = useState(emptyIng);
  const [showNew, setShowNew] = useState(false);
  const [mov, setMov] = useState(null);   // { ingredient, type }
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    api('/stock/ingredients').then(setIngs).catch(e => setErr(e.message));
    api('/stock/movements').then(setMovs).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault(); setErr('');
    try {
      await api('/stock/ingredients', { method: 'POST', body: form });
      setForm(emptyIng); setShowNew(false); load();
    } catch (e) { setErr(e.message); }
  }

  async function saveMov(e) {
    e.preventDefault(); setErr('');
    try {
      await api('/stock/movements', {
        method: 'POST',
        body: {
          ingredient_id: mov.ingredient.id, type: mov.type,
          qty: Number(qty), unit_cost: Number(cost) || 0, description: desc,
        },
      });
      setMov(null); setQty(''); setCost(''); setDesc(''); load();
    } catch (e) { setErr(e.message); }
  }

  const baixos = ings.filter(i => i.baixo);
  const valorEstoque = ings.reduce((s, i) => s + i.stock_qty * i.cost_per_unit, 0);

  const movLabel = {
    entrada: 'Entrada (compra)', perda: 'Perda / quebra', ajuste: 'Ajuste de inventário',
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>📦 Estoque</h1>
          <div className="sub">{ings.length} insumos · valor em estoque {money(valorEstoque)}</div>
        </div>
        <button className="btn sm" onClick={() => setShowNew(true)}>+ Novo insumo</button>
      </div>

      {err && <div className="error-msg">{err}</div>}

      {baixos.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--warn)', background: '#fff8ec', marginBottom: 16 }}>
          <b>⚠ Repor {baixos.length} insumo(s):</b>{' '}
          {baixos.map(i => `${i.name} (${i.stock_qty}${i.unit})`).join(' · ')}
        </div>
      )}

      <div className="cat-tabs" style={{ marginBottom: 14 }}>
        <button className={tab === 'insumos' ? 'active' : ''} onClick={() => setTab('insumos')}>Insumos</button>
        <button className={tab === 'movs' ? 'active' : ''} onClick={() => setTab('movs')}>Movimentações</button>
      </div>

      {tab === 'insumos' && (
        <div className="card">
          <table>
            <thead><tr>
              <th>Insumo</th><th>Fornecedor</th><th style={{ textAlign: 'right' }}>Estoque</th>
              <th style={{ textAlign: 'right' }}>Mínimo</th><th style={{ textAlign: 'right' }}>Custo unitário</th>
              <th style={{ textAlign: 'right' }}>Valor</th><th></th>
            </tr></thead>
            <tbody>
              {ings.length === 0 && <tr><td colSpan={7} className="sub">Nenhum insumo cadastrado.</td></tr>}
              {ings.map(i => (
                <tr key={i.id}>
                  <td><b>{i.name}</b>{i.baixo && <span className="badge ocupada" style={{ marginLeft: 8 }}>repor</span>}</td>
                  <td className="sub">{i.supplier || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: i.baixo ? 'var(--brand)' : 'inherit' }}>
                    {i.stock_qty}{i.unit}
                  </td>
                  <td style={{ textAlign: 'right' }} className="sub">{i.min_stock}{i.unit}</td>
                  <td style={{ textAlign: 'right' }}>
                    {moneyFine(i.cost_per_unit)}<span className="sub">/{i.unit}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{money(i.stock_qty * i.cost_per_unit)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn sm secondary" onClick={() => setMov({ ingredient: i, type: 'entrada' })}>+ Entrada</button>{' '}
                    <button className="btn sm ghost" onClick={() => setMov({ ingredient: i, type: 'perda' })}>Perda</button>{' '}
                    <button className="btn sm ghost" onClick={() => setMov({ ingredient: i, type: 'ajuste' })}>Ajuste</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'movs' && (
        <div className="card">
          <table>
            <thead><tr><th>Quando</th><th>Tipo</th><th>Insumo</th>
              <th style={{ textAlign: 'right' }}>Qtd</th><th>Descrição</th><th>Quem</th></tr></thead>
            <tbody>
              {movs.length === 0 && <tr><td colSpan={6} className="sub">Sem movimentações.</td></tr>}
              {movs.map(m => (
                <tr key={m.id}>
                  <td className="sub">{m.created_at?.slice(5, 16)}</td>
                  <td><span className={'badge ' + (m.qty >= 0 ? 'livre' : 'ocupada')}>{m.type}</span></td>
                  <td>{m.ingredient_name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: m.qty >= 0 ? 'var(--ok)' : 'var(--brand)' }}>
                    {m.qty > 0 ? '+' : ''}{m.qty}{m.unit}
                  </td>
                  <td className="sub">{m.description || '—'}</td>
                  <td className="sub">{m.user_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Novo insumo */}
      {showNew && (
        <div className="modal-bg" onClick={() => setShowNew(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={create}>
            <h3>Novo insumo</h3>
            <div className="field"><label>Nome</label>
              <input className="input" required autoFocus value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Picanha" /></div>
            <div className="row">
              <div className="field"><label>Unidade</label>
                <select className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select></div>
              <div className="field"><label>Custo por {form.unit}</label>
                <input className="input" type="number" step="0.001" required value={form.cost_per_unit}
                  onChange={e => setForm({ ...form, cost_per_unit: e.target.value })} placeholder="0,089" /></div>
            </div>
            <div className="row">
              <div className="field"><label>Estoque inicial ({form.unit})</label>
                <input className="input" type="number" step="0.001" value={form.stock_qty}
                  onChange={e => setForm({ ...form, stock_qty: e.target.value })} /></div>
              <div className="field"><label>Mínimo ({form.unit})</label>
                <input className="input" type="number" step="0.001" value={form.min_stock}
                  onChange={e => setForm({ ...form, min_stock: e.target.value })} /></div>
            </div>
            <div className="field"><label>Fornecedor</label>
              <input className="input" value={form.supplier}
                onChange={e => setForm({ ...form, supplier: e.target.value })} /></div>
            <p className="hint" style={{ textAlign: 'left', marginTop: 0 }}>
              O custo é por <b>1 {form.unit}</b>. Ex.: picanha a R$ 89,00/kg → unidade <b>g</b>, custo <b>0,089</b>.
            </p>
            <button className="btn">Cadastrar</button>
          </form>
        </div>
      )}

      {/* Movimentação */}
      {mov && (
        <div className="modal-bg" onClick={() => setMov(null)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={saveMov}>
            <h3>{movLabel[mov.type]}</h3>
            <div className="sub" style={{ marginBottom: 14 }}>
              {mov.ingredient.name} · estoque atual <b>{mov.ingredient.stock_qty}{mov.ingredient.unit}</b>
            </div>
            <div className="field">
              <label>
                {mov.type === 'ajuste'
                  ? `Quantidade CONTADA no inventário (${mov.ingredient.unit})`
                  : `Quantidade (${mov.ingredient.unit})`}
              </label>
              <input className="input" type="number" step="0.001" required autoFocus value={qty}
                onChange={e => setQty(e.target.value)} />
            </div>
            {mov.type === 'entrada' && (
              <div className="field">
                <label>Custo por {mov.ingredient.unit} (deixe vazio p/ manter {money(mov.ingredient.cost_per_unit)})</label>
                <input className="input" type="number" step="0.001" value={cost}
                  onChange={e => setCost(e.target.value)} />
              </div>
            )}
            <div className="field"><label>Descrição</label>
              <input className="input" value={desc} onChange={e => setDesc(e.target.value)}
                placeholder={mov.type === 'entrada' ? 'Nota 1234 / fornecedor' : 'Motivo'} /></div>
            {mov.type === 'ajuste' && (
              <p className="hint" style={{ textAlign: 'left', marginTop: 0 }}>
                O ajuste <b>define</b> o saldo (o sistema calcula a diferença), em vez de somar.
              </p>
            )}
            <button className="btn">Confirmar</button>
          </form>
        </div>
      )}
    </>
  );
}
