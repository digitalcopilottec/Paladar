import React, { useEffect, useState } from 'react';
import { api, money, moneyFine } from '../api.js';

// Monta a receita de cada produto/adicional e mostra custo e margem na hora.
export default function FichaTecnica() {
  const [margins, setMargins] = useState([]);
  const [groups, setGroups] = useState([]);
  const [ings, setIngs] = useState([]);
  const [editing, setEditing] = useState(null);   // {product_id|option_id, name, price}
  const [recipe, setRecipe] = useState(null);
  const [ingId, setIngId] = useState('');
  const [qty, setQty] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    api('/stock/margins').then(setMargins).catch(e => setErr(e.message));
    api('/stock/ingredients').then(setIngs);
    api('/catalog/option-groups').then(setGroups);
  };
  useEffect(() => { load(); }, []);

  async function open(target) {
    setEditing(target); setErr('');
    const q = target.product_id ? `product_id=${target.product_id}` : `option_id=${target.option_id}`;
    setRecipe(await api(`/stock/recipe?${q}`));
  }
  async function refresh() {
    const q = editing.product_id ? `product_id=${editing.product_id}` : `option_id=${editing.option_id}`;
    setRecipe(await api(`/stock/recipe?${q}`));
    api('/stock/margins').then(setMargins);
  }
  async function addIng(e) {
    e.preventDefault(); setErr('');
    try {
      await api('/stock/recipe', {
        method: 'POST',
        body: {
          product_id: editing.product_id || null, option_id: editing.option_id || null,
          ingredient_id: Number(ingId), qty: Number(qty),
        },
      });
      setIngId(''); setQty(''); refresh();
    } catch (e) { setErr(e.message); }
  }
  async function delIng(id) {
    await api(`/stock/recipe/${id}`, { method: 'DELETE' });
    refresh();
  }

  const semFicha = margins.filter(m => !m.temFicha).length;
  const cor = (m) => m === null ? 'var(--muted)' : m >= 60 ? 'var(--ok)' : m >= 40 ? 'var(--warn)' : 'var(--brand)';
  const unidade = (id) => ings.find(i => i.id === Number(id))?.unit || '';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>📋 Ficha Técnica</h1>
          <div className="sub">
            Quanto cada prato consome — define o custo real e a margem
            {semFicha > 0 && ` · ${semFicha} produto(s) ainda sem ficha`}
          </div>
        </div>
      </div>

      {err && <div className="error-msg">{err}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Produtos</h3>
        <table>
          <thead><tr>
            <th>Produto</th><th style={{ textAlign: 'right' }}>Venda</th>
            <th style={{ textAlign: 'right' }}>Custo</th><th style={{ textAlign: 'right' }}>Lucro</th>
            <th style={{ textAlign: 'right' }}>Margem</th><th></th>
          </tr></thead>
          <tbody>
            {margins.map(p => (
              <tr key={p.id}>
                <td><b>{p.name}</b></td>
                <td style={{ textAlign: 'right' }}>{money(p.price)}</td>
                <td style={{ textAlign: 'right' }}>{p.temFicha ? money(p.custo) : <span className="sub">—</span>}</td>
                <td style={{ textAlign: 'right' }}>{p.temFicha ? money(p.lucro) : <span className="sub">—</span>}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: cor(p.margem) }}>
                  {p.margem === null ? <span className="badge reservada">sem ficha</span> : p.margem + '%'}
                </td>
                <td>
                  <button className="btn sm ghost"
                    onClick={() => open({ product_id: p.id, name: p.name, price: p.price })}>
                    {p.temFicha ? 'Editar ficha' : '+ Criar ficha'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Adicionais</h3>
        <div className="sub" style={{ marginBottom: 10 }}>
          Adicional também consome estoque — o bacon vendido sai do bacon comprado.
        </div>
        <table>
          <thead><tr><th>Adicional</th><th>Grupo</th>
            <th style={{ textAlign: 'right' }}>Cobra</th><th></th></tr></thead>
          <tbody>
            {groups.flatMap(g => g.options.map(o => (
              <tr key={o.id}>
                <td><b>{o.name}</b></td>
                <td className="sub">{g.name}</td>
                <td style={{ textAlign: 'right' }}>
                  {o.price_delta ? money(o.price_delta) : <span className="sub">sem custo</span>}
                </td>
                <td>
                  <button className="btn sm ghost"
                    onClick={() => open({ option_id: o.id, name: o.name, price: o.price_delta })}>
                    Ficha
                  </button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {editing && recipe && (
        <div className="modal-bg" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3 style={{ marginBottom: 2 }}>Ficha: {editing.name}</h3>
            <div className="sub" style={{ marginBottom: 14 }}>Preço de venda {money(editing.price)}</div>

            {recipe.items.length === 0 && (
              <div className="empty">Nenhum insumo na ficha ainda.</div>
            )}
            {recipe.items.map(r => (
              <div className="cm-item" key={r.id}>
                <div className="n">
                  <b>{r.name}</b>
                  <small>{r.qty}{r.unit} × {moneyFine(r.cost_per_unit)}/{r.unit}</small>
                </div>
                <div style={{ width: 90, textAlign: 'right', fontWeight: 700 }}>{money(r.cost)}</div>
                <button className="rm" onClick={() => delIng(r.id)}>✕</button>
              </div>
            ))}

            <div className="cm-line" style={{ marginTop: 10 }}>
              <span>Custo total</span><b>{money(recipe.custo)}</b>
            </div>
            <div className="cm-line"><span>Preço de venda</span><b>{money(recipe.venda)}</b></div>
            <div className="cm-line total" style={{ fontSize: 18 }}>
              <span>Lucro</span>
              <span style={{ color: cor(recipe.margem) }}>
                {money(recipe.lucro)} · {recipe.margem}%
              </span>
            </div>

            <form onSubmit={addIng} style={{ marginTop: 14, paddingTop: 14, borderTop: '2px solid var(--line)' }}>
              <div className="row">
                <div className="field" style={{ flex: 2 }}>
                  <label>Insumo</label>
                  <select className="input" required value={ingId} onChange={e => setIngId(e.target.value)}>
                    <option value="">Selecione</option>
                    {ings.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Quantidade {ingId && `(${unidade(ingId)})`}</label>
                  <input className="input" type="number" step="0.001" required value={qty}
                    onChange={e => setQty(e.target.value)} />
                </div>
              </div>
              <button className="btn secondary">+ Adicionar à ficha</button>
            </form>

            <button className="btn" style={{ marginTop: 10 }} onClick={() => setEditing(null)}>Concluir</button>
          </div>
        </div>
      )}
    </>
  );
}
