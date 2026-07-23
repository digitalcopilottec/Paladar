import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money, phoneFmt } from '../api.js';
import OptionPicker from '../components/OptionPicker.jsx';

const emptyForm = {
  customer_name: '', phone: '', street: '', number: '', complement: '',
  district: '', city: '', reference: '', notes: '', delivery_fee: '',
};

export default function Delivery() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [novo, setNovo] = useState(false);
  const [err, setErr] = useState('');

  // formulário do novo pedido
  const [form, setForm] = useState(emptyForm);
  const [cart, setCart] = useState([]);
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [picking, setPicking] = useState(null);
  const [achou, setAchou] = useState(null);   // cliente encontrado pelo telefone

  const [dispatching, setDispatching] = useState(null);

  const load = () => {
    api('/delivery').then(setList).catch(e => setErr(e.message));
    api('/delivery/couriers').then(setCouriers);
  };
  useEffect(() => {
    load();
    api('/catalog/categories').then(c => { setCats(c); setActiveCat(c[0]?.id ?? null); });
    api('/catalog/products').then(setProds);
    const t = setInterval(load, 30000);   // painel de entregas se atualiza sozinho
    return () => clearInterval(t);
  }, []);

  // Ao sair do campo telefone, procura o cliente e preenche o endereço.
  async function lookup() {
    const phone = form.phone.replace(/\D/g, '');
    if (phone.length < 8) return;
    const c = await api(`/delivery/customer?phone=${phone}`);
    if (c) {
      setAchou(c);
      setForm(f => ({
        ...f, customer_name: c.name, street: c.street || '', number: c.number || '',
        complement: c.complement || '', district: c.district || '', city: c.city || '',
        reference: c.reference || '',
      }));
    } else setAchou(null);
  }

  function addProd(p) {
    if (p.groups?.length) return setPicking(p);
    pushLine(p, [], [], 1);
  }
  function pushLine(p, options, optionNames, qty) {
    const extra = optionNames.reduce((s, o) => s + o.price_delta, 0);
    setCart(c => [...c, {
      lineId: Date.now() + Math.random(), product_id: p.id, name: p.name,
      unit: p.price + extra, qty, options, optionNames,
    }]);
  }
  function chQty(lineId, d) {
    setCart(c => c.flatMap(i => i.lineId !== lineId ? [i] : (i.qty + d <= 0 ? [] : [{ ...i, qty: i.qty + d }])));
  }

  const subtotal = cart.reduce((s, i) => s + i.unit * i.qty, 0);
  const total = subtotal + (Number(form.delivery_fee) || 0);
  const shown = useMemo(
    () => prods.filter(p => activeCat == null || p.category_id === activeCat),
    [prods, activeCat]
  );

  async function criar() {
    setErr('');
    try {
      await api('/delivery', {
        method: 'POST',
        body: {
          ...form, delivery_fee: Number(form.delivery_fee) || 0,
          items: cart.map(i => ({ product_id: i.product_id, qty: i.qty, options: i.options })),
        },
      });
      setForm(emptyForm); setCart([]); setAchou(null); setNovo(false); load();
    } catch (e) { setErr(e.message); }
  }

  async function despachar(courier_id) {
    await api(`/delivery/${dispatching.order_id}/dispatch`, { method: 'POST', body: { courier_id } });
    setDispatching(null); load();
  }
  async function entregue(d) {
    await api(`/delivery/${d.order_id}/delivered`, { method: 'POST' });
    load();
  }

  const badge = { pendente: 'reservada', saiu: 'ocupada', entregue: 'livre' };
  const rotulo = { pendente: '⏳ na cozinha', saiu: '🛵 saiu p/ entrega', entregue: '✓ entregue' };
  const endereco = (d) =>
    `${d.street}, ${d.number}${d.complement ? ' · ' + d.complement : ''}${d.district ? ' — ' + d.district : ''}`;

  const emRota = list.filter(d => d.status !== 'entregue');
  const feitas = list.filter(d => d.status === 'entregue');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>🛵 Delivery</h1>
          <div className="sub">{emRota.length} em andamento · {feitas.length} entregue(s) hoje</div>
        </div>
        <button className="btn sm" onClick={() => setNovo(true)}>+ Novo pedido</button>
      </div>

      {err && <div className="error-msg">{err}</div>}

      {list.length === 0 && (
        <div className="card"><div className="empty">Nenhum pedido de delivery hoje.</div></div>
      )}

      <div className="grid cards">
        {list.map(d => (
          <div className="card" key={d.order_id}
            style={{ borderColor: d.status === 'saiu' ? 'var(--brand)' : 'var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 16 }}>{d.customer_name}</b>
              <span className={'badge ' + badge[d.status]}>{rotulo[d.status]}</span>
            </div>
            <div className="sub" style={{ margin: '4px 0 8px' }}>
              {d.code} · 📞 {phoneFmt(d.phone)}
            </div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>📍 {endereco(d)}</div>
            {d.reference && <div className="opt-list" style={{ marginBottom: 6 }}>↳ {d.reference}</div>}

            <div className="opt-list" style={{ marginBottom: 8 }}>
              {d.items.map(i => `${i.qty}x ${i.name}`).join(' · ')}
            </div>
            {d.notes && <div className="split-out" style={{ fontSize: 12 }}>⚠ {d.notes}</div>}

            <div className="cm-line" style={{ borderTop: '1px solid var(--line)', marginTop: 8 }}>
              <span>Itens {money(d.subtotal)} + entrega {money(d.delivery_fee)}</span>
              <b style={{ color: 'var(--brand)' }}>{money(d.total)}</b>
            </div>

            {d.courier_name && (
              <div className="sub" style={{ marginBottom: 8 }}>
                🛵 {d.courier_name} · saiu {d.dispatched_at?.slice(11, 16)}
              </div>
            )}

            <div className="row" style={{ marginTop: 6 }}>
              {d.status === 'pendente' && (
                <button className="btn sm" onClick={() => setDispatching(d)}>Despachar</button>
              )}
              {d.status === 'saiu' && (
                <button className="btn sm ok" onClick={() => entregue(d)}>Marcar entregue</button>
              )}
              {d.order_status === 'aberto'
                ? <button className="btn sm secondary" onClick={() => nav(`/comanda/${d.order_id}`)}>Receber</button>
                : <span className="badge livre" style={{ alignSelf: 'center' }}>pago</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Escolher entregador */}
      {dispatching && (
        <div className="modal-bg" onClick={() => setDispatching(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Quem vai levar?</h3>
            <div className="sub" style={{ marginBottom: 12 }}>
              {dispatching.customer_name} · {endereco(dispatching)}
            </div>
            {couriers.length === 0 && (
              <div className="empty">Nenhum entregador cadastrado. O gerente cadastra em Entregadores.</div>
            )}
            {couriers.map(c => (
              <button key={c.id} className="op-opt" onClick={() => despachar(c.id)}>
                <span className="op-mark" />
                <span className="op-name">{c.name}</span>
                <span className="sub">{c.phone}</span>
              </button>
            ))}
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setDispatching(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Novo pedido */}
      {novo && (
        <div className="modal-bg" onClick={() => setNovo(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>Novo pedido de delivery</h3>

            <div className="field">
              <label>Telefone do cliente</label>
              <input className="input" autoFocus value={form.phone} placeholder="(11) 98888-7777"
                onChange={e => setForm({ ...form, phone: e.target.value })} onBlur={lookup} />
            </div>
            {achou && (
              <div className="split-out" style={{ marginBottom: 10 }}>
                ✓ Cliente conhecido — {achou.pedidos} pedido(s). Endereço preenchido.
              </div>
            )}

            <div className="field">
              <label>Nome</label>
              <input className="input" value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div className="row">
              <div className="field" style={{ flex: 3 }}><label>Rua</label>
                <input className="input" value={form.street}
                  onChange={e => setForm({ ...form, street: e.target.value })} /></div>
              <div className="field"><label>Número</label>
                <input className="input" value={form.number}
                  onChange={e => setForm({ ...form, number: e.target.value })} /></div>
            </div>
            <div className="row">
              <div className="field"><label>Complemento</label>
                <input className="input" value={form.complement}
                  onChange={e => setForm({ ...form, complement: e.target.value })} placeholder="Apto 42" /></div>
              <div className="field"><label>Bairro</label>
                <input className="input" value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value })} /></div>
            </div>
            <div className="field"><label>Ponto de referência</label>
              <input className="input" value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })}
                placeholder="Portão azul, ao lado da padaria" /></div>
            <div className="field"><label>Observação p/ a cozinha e o entregador</label>
              <input className="input" value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Interfone quebrado, ligar ao chegar" /></div>

            <h4 style={{ margin: '18px 0 8px' }}>Itens</h4>
            <div className="cat-tabs">
              {cats.map(c => (
                <button key={c.id} className={activeCat === c.id ? 'active' : ''}
                  onClick={() => setActiveCat(c.id)}>{c.name}</button>
              ))}
            </div>
            <div className="prod-grid" style={{ maxHeight: 190, marginTop: 8 }}>
              {shown.map(p => (
                <button key={p.id} className="prod" onClick={() => addProd(p)}>
                  <b>{p.name}</b>
                  {p.groups?.length > 0 && <span className="opt-list"><b>personalizável</b></span>}
                  <span className="price">{money(p.price)}</span>
                </button>
              ))}
            </div>

            {cart.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {cart.map(i => (
                  <div className="cm-item" key={i.lineId}>
                    <div className="n">
                      <b>{i.name}</b>
                      {i.optionNames.length > 0 &&
                        <div className="opt-list">{i.optionNames.map(o => o.name).join(' · ')}</div>}
                    </div>
                    <div className="qty">
                      <button onClick={() => chQty(i.lineId, -1)}>−</button>
                      <b>{i.qty}</b>
                      <button onClick={() => chQty(i.lineId, +1)}>+</button>
                    </div>
                    <div style={{ width: 84, textAlign: 'right', fontWeight: 700 }}>{money(i.unit * i.qty)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="field" style={{ marginTop: 12 }}>
              <label>Taxa de entrega (R$)</label>
              <input className="input" type="number" step="0.01" value={form.delivery_fee}
                onChange={e => setForm({ ...form, delivery_fee: e.target.value })} />
            </div>

            <div className="cm-line"><span>Itens</span><b>{money(subtotal)}</b></div>
            <div className="cm-line"><span>Entrega</span><b>{money(Number(form.delivery_fee) || 0)}</b></div>
            <div className="cm-line total" style={{ fontSize: 20 }}>
              <span>Total</span><span>{money(total)}</span>
            </div>

            {err && <div className="error-msg">{err}</div>}
            <button className="btn ok" disabled={cart.length === 0} onClick={criar}>
              Enviar para a cozinha · {money(total)}
            </button>
            <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => setNovo(false)}>Cancelar</button>
          </div>
        </div>
      )}

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
    </>
  );
}
