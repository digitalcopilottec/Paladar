import React, { useEffect, useMemo, useState } from 'react';
import { api, money } from '../api.js';
import OptionPicker from '../components/OptionPicker.jsx';
import BuffetSale from '../components/BuffetSale.jsx';

const METHODS = [
  { k: 'dinheiro', label: '💵 Dinheiro' },
  { k: 'pix',      label: '⚡ Pix' },
  { k: 'debito',   label: '💳 Débito' },
  { k: 'credito',  label: '💳 Crédito' },
];

export default function PDV() {
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);      // linhas: {lineId, product_id, name, unit, qty, options, optionNames}
  const [pay, setPay] = useState(null);      // modal state
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');
  const [picking, setPicking] = useState(null);
  const [mode, setMode] = useState('cardapio');   // cardapio (à la carte) | buffet

  useEffect(() => {
    api('/catalog/categories').then(c => { setCats(c); setActiveCat(c[0]?.id ?? null); });
    api('/catalog/products').then(setProds);
  }, []);

  const shown = useMemo(
    () => prods.filter(p => activeCat == null || p.category_id === activeCat),
    [prods, activeCat]
  );
  const total = cart.reduce((s, i) => s + i.unit * i.qty, 0);

  function add(p) {
    if (p.groups?.length) return setPicking(p);
    pushLine(p, [], [], 1);
  }
  // Cada combinação de adicionais é uma linha própria.
  function pushLine(p, options, optionNames, qty) {
    const extra = optionNames.reduce((s, o) => s + o.price_delta, 0);
    setCart(c => [...c, {
      lineId: Date.now() + Math.random(),
      product_id: p.id, name: p.name,
      unit: p.price + extra, qty, options, optionNames,
    }]);
  }
  function chQty(lineId, d) {
    setCart(c => c.flatMap(i => {
      if (i.lineId !== lineId) return [i];
      const q = i.qty + d;
      return q <= 0 ? [] : [{ ...i, qty: q }];
    }));
  }

  async function finalize(method) {
    setErr('');
    try {
      const order = await api('/orders', { method: 'POST', body: { type: 'balcao' } });
      for (const i of cart) {
        await api(`/orders/${order.id}/items`, {
          method: 'POST', body: { product_id: i.product_id, qty: i.qty, options: i.options },
        });
      }
      const closed = await api(`/orders/${order.id}/close`, {
        method: 'POST', body: { payments: [{ method, amount: total, received: total }] },
      });
      setDone({ code: closed.code, total: closed.total, method });
      setCart([]); setPay(null);
    } catch (e) { setErr(e.message); }
  }

  if (mode === 'buffet') {
    return (
      <>
        <div className="page-head">
          <div><h1>PDV · Vendas</h1></div>
          <div className="pdv-modes">
            <button onClick={() => setMode('cardapio')}>🧾 Cardápio</button>
            <button className="active">⚖️ Buffet</button>
          </div>
        </div>
        <BuffetSale />
      </>
    );
  }

  return (
    <div className="pdv">
      <div className="pdv-menu">
        <div className="page-head" style={{ marginBottom: 12 }}>
          <h1>PDV · Vendas</h1>
          <div className="pdv-modes">
            <button className="active">🧾 Cardápio</button>
            <button onClick={() => setMode('buffet')}>⚖️ Buffet</button>
          </div>
        </div>
        <div className="cat-tabs">
          {cats.map(c => (
            <button key={c.id} className={activeCat === c.id ? 'active' : ''}
              onClick={() => setActiveCat(c.id)}>{c.name}</button>
          ))}
        </div>
        <div className="prod-grid">
          {shown.map(p => (
            <button key={p.id} className="prod" onClick={() => add(p)}>
              <b>{p.name}</b>
              {p.groups?.length > 0 && <span className="opt-list"><b>personalizável</b></span>}
              <span className="price">{money(p.price)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cart">
        <div className="cart-head">
          <span>🧾 Comanda</span>
          <span>{cart.length} item(s)</span>
        </div>
        <div className="cart-items">
          {cart.length === 0 && <div className="empty">Toque nos produtos para adicionar</div>}
          {cart.map(i => (
            <div className="cart-row" key={i.lineId}>
              <div className="n">
                {i.name}
                {i.optionNames.length > 0 && (
                  <div className="opt-list">{i.optionNames.map(o => o.name).join(' · ')}</div>
                )}
                <small>{money(i.unit)}</small>
              </div>
              <div className="qty">
                <button onClick={() => chQty(i.lineId, -1)}>−</button>
                <b>{i.qty}</b>
                <button onClick={() => chQty(i.lineId, +1)}>+</button>
              </div>
              <div style={{ width: 74, textAlign: 'right', fontWeight: 700 }}>{money(i.unit * i.qty)}</div>
            </div>
          ))}
        </div>
        <div className="cart-foot">
          <div className="cart-total"><span>Total</span><span>{money(total)}</span></div>
          {err && <div className="error-msg">{err}</div>}
          <button className="btn" disabled={cart.length === 0} onClick={() => setPay({ method: 'dinheiro' })}>
            Finalizar venda
          </button>
        </div>
      </div>

      {picking && (
        <OptionPicker
          product={picking}
          onCancel={() => setPicking(null)}
          onConfirm={({ options, qty }) => {
            const names = picking.groups.flatMap(g => g.options)
              .filter(o => options.includes(o.id))
              .map(o => ({ name: o.name, price_delta: o.price_delta }));
            pushLine(picking, options, names, qty);
            setPicking(null);
          }}
        />
      )}

      {pay && (
        <div className="modal-bg" onClick={() => setPay(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Pagamento — {money(total)}</h3>
            <div className="pay-methods">
              {METHODS.map(m => (
                <button key={m.k} className={pay.method === m.k ? 'active' : ''}
                  onClick={() => setPay({ method: m.k })}>{m.label}</button>
              ))}
            </div>
            <button className="btn ok" onClick={() => finalize(pay.method)}>Confirmar pagamento</button>
            <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => setPay(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {done && (
        <div className="modal-bg" onClick={() => setDone(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 46 }}>✅</div>
            <h3>Venda concluída!</h3>
            <p>Comanda <b>{done.code}</b> — {money(done.total)}<br />
              <span style={{ color: 'var(--muted)' }}>Pago em {done.method}</span></p>
            <button className="btn" onClick={() => setDone(null)}>Nova venda</button>
          </div>
        </div>
      )}
    </div>
  );
}
