import React, { useEffect, useState } from 'react';
import { api, money } from '../api.js';

// Gestão dos grupos de adicionais/opções e de quais produtos usam cada grupo.
export default function Adicionais() {
  const [groups, setGroups] = useState([]);
  const [prods, setProds] = useState([]);
  const [err, setErr] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', min_select: 0, max_select: 1 });
  const [showGroup, setShowGroup] = useState(false);
  const [linking, setLinking] = useState(null);   // grupo sendo vinculado a produtos

  const load = () => {
    api('/catalog/option-groups').then(setGroups).catch(e => setErr(e.message));
    api('/catalog/products').then(setProds);
  };
  useEffect(() => { load(); }, []);

  async function createGroup(e) {
    e.preventDefault(); setErr('');
    try {
      await api('/catalog/option-groups', {
        method: 'POST',
        body: {
          name: newGroup.name,
          min_select: Number(newGroup.min_select) || 0,
          max_select: Number(newGroup.max_select) || 1,
        },
      });
      setNewGroup({ name: '', min_select: 0, max_select: 1 }); setShowGroup(false); load();
    } catch (e) { setErr(e.message); }
  }

  async function addOption(g) {
    const name = prompt(`Nova opção em "${g.name}":`);
    if (!name) return;
    const price = prompt('Valor adicional (0 se não cobra):', '0');
    if (price == null) return;
    await api(`/catalog/option-groups/${g.id}/options`, {
      method: 'POST', body: { name, price_delta: Number(price) || 0 },
    });
    load();
  }

  async function delOption(o) {
    if (!confirm(`Remover a opção "${o.name}"?`)) return;
    await api(`/catalog/options/${o.id}`, { method: 'DELETE' });
    load();
  }

  async function delGroup(g) {
    if (!confirm(`Remover o grupo "${g.name}"? Ele sai dos produtos que o usam.\n(Vendas antigas não mudam.)`)) return;
    await api(`/catalog/option-groups/${g.id}`, { method: 'DELETE' });
    load();
  }

  // Liga/desliga o grupo em um produto
  async function toggleProduct(g, productId) {
    const p = prods.find(x => x.id === productId);
    const current = (p.groups || []).map(x => x.id);
    const next = current.includes(g.id) ? current.filter(x => x !== g.id) : [...current, g.id];
    await api(`/catalog/products/${productId}/option-groups`, {
      method: 'PUT', body: { group_ids: next },
    });
    load();
  }

  const usedBy = (g) => prods.filter(p => (p.groups || []).some(x => x.id === g.id));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>🍔 Adicionais</h1>
          <div className="sub">Ponto da carne, extras, acompanhamentos — com preço e regra</div>
        </div>
        <button className="btn sm" onClick={() => setShowGroup(true)}>+ Novo grupo</button>
      </div>

      {err && <div className="error-msg">{err}</div>}

      {groups.length === 0 && (
        <div className="card"><div className="empty">
          Nenhum grupo ainda. Crie um grupo (ex.: "Ponto da carne") e depois ligue-o aos produtos.
        </div></div>
      )}

      <div className="grid cards">
        {groups.map(g => (
          <div className="card" key={g.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 17 }}>{g.name}</b>
              <button className="btn sm ghost" onClick={() => delGroup(g)}>✕</button>
            </div>
            <div className="sub" style={{ margin: '6px 0 10px' }}>
              {g.min_select > 0
                ? <span className="badge ocupada">obrigatório · escolhe {g.min_select}</span>
                : <span className="badge livre">opcional</span>}
              {' '}<span className="badge reservada">até {g.max_select}</span>
            </div>

            {g.options.map(o => (
              <div className="cm-line" key={o.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <span>{o.name}</span>
                <span>
                  <b style={{ color: o.price_delta ? 'var(--brand)' : 'var(--muted)' }}>
                    {o.price_delta ? '+ ' + money(o.price_delta) : 'sem custo'}
                  </b>
                  <button className="rm" onClick={() => delOption(o)}>✕</button>
                </span>
              </div>
            ))}

            <button className="btn sm secondary" style={{ marginTop: 10, width: '100%' }}
              onClick={() => addOption(g)}>+ Opção</button>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <div className="sub" style={{ marginBottom: 6 }}>
                Usado em {usedBy(g).length} produto(s)
              </div>
              <div className="opt-list" style={{ marginBottom: 8 }}>
                {usedBy(g).map(p => p.name).join(' · ') || '—'}
              </div>
              <button className="btn sm ghost" style={{ width: '100%' }}
                onClick={() => setLinking(g)}>Escolher produtos</button>
            </div>
          </div>
        ))}
      </div>

      {/* Novo grupo */}
      {showGroup && (
        <div className="modal-bg" onClick={() => setShowGroup(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={createGroup}>
            <h3>Novo grupo de opções</h3>
            <div className="field">
              <label>Nome</label>
              <input className="input" required autoFocus value={newGroup.name}
                onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="Ex.: Ponto da carne" />
            </div>
            <div className="row">
              <div className="field">
                <label>Mínimo (1 = obrigatório)</label>
                <input className="input" type="number" min="0" value={newGroup.min_select}
                  onChange={e => setNewGroup({ ...newGroup, min_select: e.target.value })} />
              </div>
              <div className="field">
                <label>Máximo</label>
                <input className="input" type="number" min="1" value={newGroup.max_select}
                  onChange={e => setNewGroup({ ...newGroup, max_select: e.target.value })} />
              </div>
            </div>
            <p className="hint" style={{ textAlign: 'left', marginTop: 0 }}>
              Mín. 1 / Máx. 1 = escolha única obrigatória (ponto da carne).<br />
              Mín. 0 / Máx. 3 = até 3 extras opcionais (adicionais).
            </p>
            <button className="btn">Criar grupo</button>
          </form>
        </div>
      )}

      {/* Vincular grupo a produtos */}
      {linking && (
        <div className="modal-bg" onClick={() => setLinking(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>"{linking.name}" aparece em quais produtos?</h3>
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              {prods.map(p => {
                const on = (p.groups || []).some(x => x.id === linking.id);
                return (
                  <button key={p.id} className={'op-opt' + (on ? ' on' : '')}
                    onClick={() => toggleProduct(linking, p.id)}>
                    <span className="op-mark">{on ? '✓' : ''}</span>
                    <span className="op-name">{p.name}</span>
                    <span className="op-price">{money(p.price)}</span>
                  </button>
                );
              })}
            </div>
            <button className="btn" style={{ marginTop: 12 }} onClick={() => setLinking(null)}>Concluir</button>
          </div>
        </div>
      )}
    </>
  );
}
