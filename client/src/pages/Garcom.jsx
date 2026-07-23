import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api.js';
import OptionPicker from '../components/OptionPicker.jsx';
import Logo from '../components/Logo.jsx';

/**
 * App do GARÇOM (celular). Escolhe a mesa, monta o pedido no cardápio touch
 * e envia para a cozinha. Não cobra — o pagamento é no caixa.
 */
export default function Garcom() {
  const nav = useNavigate();
  const [step, setStep] = useState('tipo');   // tipo | mesa | menu | fim
  const [tables, setTables] = useState([]);
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState({ categories: [], products: [] });
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [picking, setPicking] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [fim, setFim] = useState(null);
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [marca, setMarca] = useState({});
  const artRef = useRef(null);
  const [artRect, setArtRect] = useState(null); // caixa real da imagem (contida) dentro do fundo

  const carregarMesas = () => api('/tables').then(setTables).catch(e => setErr(e.message));
  useEffect(() => {
    carregarMesas();
    api('/catalog/categories').then(c => { setMenu(m => ({ ...m, categories: c })); setActiveCat(c[0]?.id ?? null); });
    api('/catalog/products').then(p => setMenu(m => ({ ...m, products: p })));
    api('/public/marca').then(setMarca).catch(() => {});
  }, []);

  // O botão precisa ficar colado no desenho (embaixo de "Restaurante", ao lado do prato),
  // não num ponto fixo da tela — então mede a área real da imagem (background-size:contain)
  // e reposiciona a cada mudança de tamanho, pra funcionar em qualquer celular/tablet/totem.
  useEffect(() => {
    if (!marca.fundo || !artRef.current) return;
    const el = artRef.current;
    let ro;
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const calc = () => {
        const cw = el.clientWidth, ch = el.clientHeight;
        const largo = cw / ch > ratio;
        const w = largo ? ch * ratio : cw;
        const h = largo ? ch : cw / ratio;
        setArtRect({ left: (cw - w) / 2, top: (ch - h) / 2, width: w, height: h });
      };
      calc();
      ro = new ResizeObserver(calc);
      ro.observe(el);
    };
    img.src = marca.fundo;
    return () => ro?.disconnect();
  }, [marca.fundo]);

  const shown = useMemo(
    () => menu.products.filter(p => activeCat == null || p.category_id === activeCat),
    [menu, activeCat]
  );
  const total = cart.reduce((s, i) => s + i.unit * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  function comerAqui() { setStep('mesa'); }

  function abrirMesa(t) {
    if (t.pago) return;
    setTable(t); setCart([]); setErr(''); setStep('menu');
  }
  function add(p) {
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

  async function enviar() {
    setErr(''); setEnviando(true);
    try {
      // Usa a comanda aberta da mesa, ou cria uma nova.
      let orderId = table.order?.id;
      if (!orderId) {
        const o = await api('/orders', { method: 'POST', body: { type: 'mesa', table_id: table.id } });
        orderId = o.id;
      }
      for (const i of cart) {
        await api(`/orders/${orderId}/items`, {
          method: 'POST', body: { product_id: i.product_id, qty: i.qty, options: i.options },
        });
      }
      setFim({ table_name: table.name, itens: count });
      setCart([]); setDrawer(false); setStep('fim');
      carregarMesas();
    } catch (e) { setErr(e.message); } finally { setEnviando(false); }
  }

  function novoPedido() {
    setTable(null); setCart([]); setFim(null); setErr(''); setStep('tipo');
    carregarMesas();
  }

  // ---------- Comer aqui ou levar ----------
  if (step === 'tipo') {
    return (
      <div className="gc">
        <div className="gc-head">
          <Logo variant="red" compact className="mk36" />
          <b>Garçom</b>
          <button className="gc-sair" onClick={() => nav('/')}>Sair</button>
        </div>
        <div className={'gc-tipo' + (marca.fundo ? ' com-fundo' : '')} ref={artRef}
          style={marca.fundo ? { backgroundImage: `url(${marca.fundo})` } : undefined}>
          {marca.fundo ? (
            artRect && (
              <button className="gc-tipo-btn gc-tipo-btn-art" onClick={comerAqui} style={{
                left: artRect.left + artRect.width * 0.24,
                top: artRect.top + artRect.height * 0.60,
                transform: 'translateX(-50%)',
              }}>
                <span className="ic">🍽️</span><b>Comer aqui</b>
              </button>
            )
          ) : (
            <button className="gc-tipo-btn" onClick={comerAqui}>
              <span className="ic">🍽️</span><b>Comer aqui</b>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------- Escolher mesa ----------
  if (step === 'mesa') {
    return (
      <div className="gc">
        <div className="gc-head">
          <button className="gc-voltar" onClick={() => setStep('tipo')}>←</button>
          <b>Garçom</b>
          <button className="gc-sair" onClick={novoPedido}>Sair</button>
        </div>
        <div className="gc-body">
          <h2 className="gc-titulo">Escolha a mesa</h2>
          {err && <div className="error-msg">{err}</div>}
          <div className="gc-mesas">
            {tables.map(t => (
              <button key={t.id} className={'gc-mesa ' + t.status} disabled={!!t.pago}
                onClick={() => abrirMesa(t)}>
                <b>{t.name}</b>
                <span className={'badge ' + t.status}>{t.status}</span>
                {t.order && <em>{money(t.order.total)}</em>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Confirmação ----------
  if (step === 'fim' && fim) {
    return (
      <div className="gc gc-fim" onClick={novoPedido}>
        <div style={{ fontSize: 70 }}>🍳</div>
        <h1>Enviado!</h1>
        <p className="gc-fim-sub">{fim.itens} item(ns) para a cozinha</p>
        <div className="gc-fim-mesa">{fim.table_name}</div>
        <button className="btn ok" style={{ maxWidth: 320, marginTop: 24 }}>Novo pedido</button>
      </div>
    );
  }

  // ---------- Cardápio ----------
  return (
    <div className="gc">
      <div className="gc-head">
        <button className="gc-voltar" onClick={novoPedido}>←</button>
        <b>{table.name}</b>
        <span className="gc-tag">{table.order ? 'comanda aberta' : 'nova comanda'}</span>
      </div>

      <div className="tt-cats">
        {menu.categories.map(c => (
          <button key={c.id} className={activeCat === c.id ? 'active' : ''} onClick={() => setActiveCat(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="gc-grid">
        {shown.map(p => (
          <button className="gc-card" key={p.id} onClick={() => add(p)}>
            <div className="gc-foto">
              {p.image ? <img src={p.image} alt="" /> : <span className="ph">🍽️</span>}
            </div>
            <b>{p.name}</b>
            <span className="preco">{money(p.price)}</span>
          </button>
        ))}
      </div>

      <div className="tt-bar">
        <button className="cancel" onClick={novoPedido}>✕ Trocar mesa</button>
        <div className="info"><small>{count} item(s)</small><b>{money(total)}</b></div>
        <button className="go" disabled={cart.length === 0} onClick={() => setDrawer(true)}>Ver pedido →</button>
      </div>

      {drawer && (
        <div className="tb-drawer-bg" onClick={() => setDrawer(false)}>
          <div className="tb-drawer" onClick={e => e.stopPropagation()}>
            <header>
              <h2>{table.name}</h2>
              <button className="btn sm ghost" onClick={() => setDrawer(false)}>Fechar</button>
            </header>
            <div className="items">
              {cart.map(i => (
                <div className="tb-di" key={i.lineId}>
                  <div className="n">
                    {i.name}<small>{money(i.unit)}</small>
                    {i.optionNames.length > 0 &&
                      <div className="opt-list">{i.optionNames.map(o => o.name).join(' · ')}</div>}
                  </div>
                  <div className="tb-qty">
                    <button onClick={() => chQty(i.lineId, -1)}>−</button>
                    <b style={{ fontSize: 20 }}>{i.qty}</b>
                    <button onClick={() => chQty(i.lineId, +1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="foot">
              <div className="cart-total"><span>Total</span><span>{money(total)}</span></div>
              {err && <div className="error-msg">{err}</div>}
              <button className="btn ok" disabled={enviando} onClick={enviar}>
                {enviando ? 'Enviando…' : 'Enviar para a cozinha'}
              </button>
            </div>
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
    </div>
  );
}
