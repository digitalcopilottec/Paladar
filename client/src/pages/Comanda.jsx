import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, money } from '../api.js';
import OptionPicker from '../components/OptionPicker.jsx';

const METHODS = [
  { k: 'dinheiro', label: '💵 Dinheiro' },
  { k: 'pix',      label: '⚡ Pix' },
  { k: 'debito',   label: '💳 Débito' },
  { k: 'credito',  label: '💳 Crédito' },
];
const r2 = (v) => Math.round(v * 100) / 100;

export default function Comanda() {
  const { id } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [serviceOn, setServiceOn] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [people, setPeople] = useState(1);
  const [err, setErr] = useState('');

  // modal de adicionar itens
  const [adding, setAdding] = useState(false);
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [picking, setPicking] = useState(null);   // produto com adicionais a escolher

  // modal de pagamento
  const [paying, setPaying] = useState(false);
  const [payments, setPayments] = useState([]);
  const [method, setMethod] = useState('dinheiro');
  const [amount, setAmount] = useState('');
  const [received, setReceived] = useState('');
  const [done, setDone] = useState(null);
  const [nota, setNota] = useState(null);

  useEffect(() => {
    api(`/orders/${id}`).then(o => {
      setOrder(o);
      setServiceOn(o.service_fee > 0);
      setDiscount(o.discount || 0);
    }).catch(e => setErr(e.message));
    api('/catalog/categories').then(c => { setCats(c); setActiveCat(c[0]?.id ?? null); });
    api('/catalog/products').then(setProds);
  }, [id]);

  // Recalcula taxa de serviço (10% do subtotal) e desconto no servidor.
  async function syncFees(o, svc = serviceOn, disc = discount) {
    const fee = svc ? r2(o.subtotal * 0.1) : 0;
    const updated = await api(`/orders/${id}`, {
      method: 'PUT', body: { service_fee: fee, discount: Number(disc) || 0 },
    });
    setOrder(updated);
  }

  // Produto com adicionais abre o seletor; sem adicionais entra direto.
  function addItem(p) {
    if (p.groups?.length) return setPicking(p);
    sendItem(p, [], 1);
  }
  async function sendItem(p, options, qty) {
    setErr('');
    try {
      const o = await api(`/orders/${id}/items`, {
        method: 'POST', body: { product_id: p.id, qty, options },
      });
      await syncFees(o);
    } catch (e) { setErr(e.message); }
  }
  async function chQty(item, d) {
    const o = await api(`/orders/${id}/items/${item.id}`, { method: 'PUT', body: { qty: item.qty + d } });
    await syncFees(o);
  }
  async function rmItem(item) {
    const o = await api(`/orders/${id}/items/${item.id}`, { method: 'DELETE' });
    await syncFees(o);
  }
  async function toggleService() {
    const v = !serviceOn; setServiceOn(v); await syncFees(order, v, discount);
  }
  async function applyDiscount(v) {
    setDiscount(v); await syncFees(order, serviceOn, v);
  }
  async function emitir() {
    setErr('');
    try {
      const r = await api(`/fiscal/emit/${id}`, { method: 'POST' });
      setNota(r.doc);
    } catch (e) { setErr(e.message); }
  }

  async function cancelOrder() {
    if (!confirm('Cancelar esta comanda? A mesa será liberada.')) return;
    await api(`/orders/${id}/cancel`, { method: 'POST' });
    nav('/mesas');
  }

  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = order ? r2(order.total - paid) : 0;
  const change = method === 'dinheiro' && received ? Math.max(0, Number(received) - Number(amount || 0)) : 0;

  function addPayment() {
    const val = Number(amount) || 0;
    if (val <= 0) return;
    setPayments(ps => [...ps, {
      method, amount: r2(val),
      received: method === 'dinheiro' ? (Number(received) || val) : val,
    }]);
    setAmount(''); setReceived('');
  }

  async function confirmClose() {
    setErr('');
    try {
      const closed = await api(`/orders/${id}/close`, { method: 'POST', body: { payments } });
      setDone(closed); setPaying(false);
    } catch (e) { setErr(e.message); }
  }

  if (err && !order) return <div className="error-msg">{err}</div>;
  if (!order) return <p>Carregando…</p>;

  const shown = prods.filter(p => activeCat == null || p.category_id === activeCat);
  const perPerson = people > 0 ? order.total / people : order.total;
  const closed = order.status !== 'aberto';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>🧾 Comanda {order.code}</h1>
          <div className="sub">
            {order.table_name || (order.type === 'balcao' ? 'Balcão' : 'Delivery')}
            {' · '}aberta às {order.opened_at?.slice(11, 16)}
            {closed && <span className="badge ocupada" style={{ marginLeft: 8 }}>{order.status}</span>}
          </div>
        </div>
        <button className="btn sm ghost" onClick={() => nav('/mesas')}>← Voltar às mesas</button>
      </div>

      {err && <div className="error-msg">{err}</div>}

      <div className="cm">
        {/* ----- Itens ----- */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 style={{ margin: 0 }}>Itens ({order.items.length})</h3>
            {!closed && <button className="btn sm" onClick={() => setAdding(true)}>+ Adicionar itens</button>}
          </div>

          {order.items.length === 0 && <div className="empty">Nenhum item lançado ainda.</div>}
          {order.items.map(i => (
            <div className="cm-item" key={i.id}>
              <div className="n">
                <b>{i.name}</b>
                {i.options?.length > 0 && (
                  <div className="opt-list">
                    {i.options.map(o => o.name + (o.price_delta ? ` (+${money(o.price_delta)})` : '')).join(' · ')}
                  </div>
                )}
                <small>{money(i.unit_price)} {i.notes ? `· ${i.notes}` : ''}</small>
              </div>
              {!closed ? (
                <div className="qty">
                  <button onClick={() => chQty(i, -1)}>−</button>
                  <b>{i.qty}</b>
                  <button onClick={() => chQty(i, +1)}>+</button>
                </div>
              ) : <b>{i.qty}x</b>}
              <div style={{ width: 90, textAlign: 'right', fontWeight: 700 }}>{money(i.total)}</div>
              {!closed && <button className="rm" onClick={() => rmItem(i)}>✕</button>}
            </div>
          ))}
        </div>

        {/* ----- Totais e fechamento ----- */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Conta</h3>

          <div className="cm-line"><span>Subtotal</span><b>{money(order.subtotal)}</b></div>

          {!closed && (
            <div className="switch">
              <label>Taxa de serviço (10%)</label>
              <button className={'toggle' + (serviceOn ? ' on' : '')} onClick={toggleService} />
            </div>
          )}
          {order.service_fee > 0 && (
            <div className="cm-line"><span>Taxa de serviço</span><b>{money(order.service_fee)}</b></div>
          )}

          {!closed && (
            <div className="field" style={{ marginTop: 12 }}>
              <label>Desconto (R$)</label>
              <input className="input" type="number" step="0.01" min="0" value={discount}
                onChange={e => setDiscount(e.target.value)}
                onBlur={e => applyDiscount(e.target.value)} />
            </div>
          )}
          {order.discount > 0 && (
            <div className="cm-line"><span>Desconto</span><b className="neg">− {money(order.discount)}</b></div>
          )}

          <div className="cm-line total"><span>Total</span><span>{money(order.total)}</span></div>

          {!closed && <>
            <div className="switch" style={{ borderBottom: 'none' }}>
              <label>Dividir por</label>
              <div className="split">
                <button className="btn sm secondary" onClick={() => setPeople(p => Math.max(1, p - 1))}>−</button>
                <input className="input" value={people}
                  onChange={e => setPeople(Math.max(1, Number(e.target.value) || 1))} />
                <button className="btn sm secondary" onClick={() => setPeople(p => p + 1)}>+</button>
              </div>
            </div>
            {people > 1 && (
              <div className="split-out">{people} pessoas × {money(perPerson)} cada</div>
            )}

            <button className="btn ok" style={{ marginTop: 16 }} disabled={order.items.length === 0}
              onClick={() => { setPayments([]); setAmount(String(order.total.toFixed(2))); setPaying(true); }}>
              Fechar conta · {money(order.total)}
            </button>
            <button className="btn ghost" style={{ marginTop: 8 }} onClick={cancelOrder}>Cancelar comanda</button>
          </>}

          {closed && (
            <div style={{ marginTop: 14 }}>
              <h4 style={{ margin: '0 0 6px' }}>Pagamentos</h4>
              {order.payments.map(p => (
                <div className="cm-line" key={p.id}>
                  <span style={{ textTransform: 'capitalize' }}>{p.method}</span><b>{money(p.amount)}</b>
                </div>
              ))}

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <h4 style={{ margin: '0 0 8px' }}>Nota fiscal</h4>
                {nota
                  ? <>
                      <div className="cm-line">
                        <span>NFC-e {nota.serie}/{nota.numero}</span>
                        <span className={'badge ' + (nota.status === 'autorizada' ? 'livre' : 'reservada')}>
                          {nota.status}
                        </span>
                      </div>
                      {nota.motivo && <div className="remaining">{nota.motivo}</div>}
                    </>
                  : <button className="btn secondary" onClick={emitir}>Emitir NFC-e</button>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----- Modal: adicionar itens ----- */}
      {adding && (
        <div className="modal-bg" onClick={() => setAdding(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <h3>Adicionar itens · {order.code}</h3>
            <div className="cat-tabs">
              {cats.map(c => (
                <button key={c.id} className={activeCat === c.id ? 'active' : ''}
                  onClick={() => setActiveCat(c.id)}>{c.name}</button>
              ))}
            </div>
            <div className="prod-grid" style={{ maxHeight: 300, marginTop: 10 }}>
              {shown.map(p => (
                <button key={p.id} className="prod" onClick={() => addItem(p)}>
                  <b>{p.name}</b>
                  {p.groups?.length > 0 && <span className="opt-list"><b>personalizável</b></span>}
                  <span className="price">{money(p.price)}</span>
                </button>
              ))}
            </div>
            <button className="btn" style={{ marginTop: 14 }} onClick={() => setAdding(false)}>Concluir</button>
          </div>
        </div>
      )}

      {/* ----- Seletor de adicionais ----- */}
      {picking && (
        <OptionPicker
          product={picking}
          onCancel={() => setPicking(null)}
          onConfirm={({ options, qty }) => { sendItem(picking, options, qty); setPicking(null); }}
        />
      )}

      {/* ----- Modal: pagamento (aceita divisão em várias formas) ----- */}
      {paying && (
        <div className="modal-bg" onClick={() => setPaying(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Receber · {money(order.total)}</h3>

            {payments.map((p, ix) => (
              <div className="pay-line" key={ix}>
                <span className="m">{p.method}</span>
                <b>{money(p.amount)}</b>
                <button className="rm" onClick={() => setPayments(ps => ps.filter((_, i) => i !== ix))}>✕</button>
              </div>
            ))}

            <div className={'remaining' + (remaining <= 0.001 ? ' done' : '')}>
              {remaining > 0.001 ? `Falta receber: ${money(remaining)}` : '✓ Conta totalmente paga'}
            </div>

            {remaining > 0.001 && <>
              <div className="pay-methods">
                {METHODS.map(m => (
                  <button key={m.k} className={method === m.k ? 'active' : ''}
                    onClick={() => setMethod(m.k)}>{m.label}</button>
                ))}
              </div>
              <div className="row">
                <div className="field">
                  <label>Valor</label>
                  <input className="input" type="number" step="0.01" value={amount}
                    onChange={e => setAmount(e.target.value)} />
                </div>
                {method === 'dinheiro' && (
                  <div className="field">
                    <label>Recebido</label>
                    <input className="input" type="number" step="0.01" value={received}
                      onChange={e => setReceived(e.target.value)} placeholder="p/ troco" />
                  </div>
                )}
              </div>
              {change > 0 && <div className="split-out">Troco: {money(change)}</div>}
              <button className="btn secondary" style={{ marginTop: 6 }} onClick={addPayment}>
                + Adicionar pagamento
              </button>
              <div className="hint" style={{ marginTop: 8 }}>
                Dica: informe um valor menor que o total para dividir a conta em várias formas.
              </div>
            </>}

            <button className="btn ok" style={{ marginTop: 12 }}
              disabled={payments.length === 0 || remaining > 0.001} onClick={confirmClose}>
              Confirmar e fechar comanda
            </button>
            <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => setPaying(false)}>Voltar</button>
          </div>
        </div>
      )}

      {/* ----- Sucesso ----- */}
      {done && (
        <div className="modal-bg">
          <div className="modal" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 50 }}>✅</div>
            <h3>Comanda fechada!</h3>
            <p>{done.code} · {money(done.total)}<br />
              <span style={{ color: 'var(--muted)' }}>
                {done.table_name ? `${done.table_name} liberada` : 'Venda registrada'}
              </span></p>
            <button className="btn" onClick={() => nav('/mesas')}>Voltar às mesas</button>
          </div>
        </div>
      )}
    </>
  );
}
