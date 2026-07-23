import React, { useMemo, useState } from 'react';
import { money } from '../api.js';

/**
 * Seletor de adicionais/opções. Usado no tablet do cliente e na comanda/PDV.
 * A validação aqui é só conforto — quem manda é o servidor (options.js).
 *
 * props: product {id,name,price,groups[]}, onConfirm({options,qty}), onCancel
 */
export default function OptionPicker({ product, onConfirm, onCancel, allowQty = true }) {
  const groups = product.groups || [];
  const [sel, setSel] = useState({});   // { [groupId]: Set(optionId) }
  const [qty, setQty] = useState(1);

  const get = (gid) => sel[gid] || new Set();

  function toggle(g, o) {
    setSel(s => {
      const cur = new Set(s[g.id] || []);
      if (cur.has(o.id)) cur.delete(o.id);
      else if (g.max_select === 1) { cur.clear(); cur.add(o.id); }   // escolha única: troca
      else if (cur.size < g.max_select) cur.add(o.id);               // respeita o teto
      return { ...s, [g.id]: cur };
    });
  }

  const chosen = useMemo(() => Object.values(sel).flatMap(s => [...s]), [sel]);

  const extra = useMemo(() => {
    let sum = 0;
    for (const g of groups) for (const o of g.options) if (get(g.id).has(o.id)) sum += o.price_delta;
    return sum;
  }, [sel, groups]);

  // Falta escolher algum grupo obrigatório?
  const pending = groups.filter(g => get(g.id).size < g.min_select);
  const unit = product.price + extra;

  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal op" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 4 }}>{product.name}</h3>
        <div className="sub" style={{ marginBottom: 14 }}>{money(product.price)}</div>

        {groups.map(g => {
          const cur = get(g.id);
          const obrig = g.min_select > 0;
          return (
            <div className="op-group" key={g.id}>
              <div className="op-group-head">
                <b>{g.name}</b>
                <span className={'op-tag' + (obrig ? ' req' : '')}>
                  {obrig
                    ? (cur.size >= g.min_select ? '✓ ok' : 'Obrigatório')
                    : `até ${g.max_select}`}
                </span>
              </div>
              {g.options.map(o => {
                const on = cur.has(o.id);
                const full = !on && g.max_select > 1 && cur.size >= g.max_select;
                return (
                  <button key={o.id} disabled={full}
                    className={'op-opt' + (on ? ' on' : '') + (full ? ' full' : '')}
                    onClick={() => toggle(g, o)}>
                    <span className={'op-mark' + (g.max_select === 1 ? ' radio' : '')}>{on ? '✓' : ''}</span>
                    <span className="op-name">{o.name}</span>
                    {o.price_delta > 0 && <span className="op-price">+ {money(o.price_delta)}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}

        {allowQty && (
          <div className="switch" style={{ borderBottom: 'none' }}>
            <label>Quantidade</label>
            <div className="qty">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <b style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>{qty}</b>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>
        )}

        <div className="cm-line total" style={{ fontSize: 20 }}>
          <span>Total</span><span>{money(unit * qty)}</span>
        </div>

        {pending.length > 0 && (
          <div className="remaining">Escolha: {pending.map(g => g.name).join(', ')}</div>
        )}

        <button className="btn ok" disabled={pending.length > 0}
          onClick={() => onConfirm({ options: chosen, qty })}>
          Adicionar · {money(unit * qty)}
        </button>
        <button className="btn ghost" style={{ marginTop: 8 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
