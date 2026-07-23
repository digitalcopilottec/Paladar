import React, { useEffect, useMemo, useState } from 'react';
import { api, money } from '../api.js';
import OptionPicker from '../components/OptionPicker.jsx';
import Logo from '../components/Logo.jsx';

const PAGAMENTOS = [
  { k: 'credito', ic: '💳', label: 'Crédito' },
  { k: 'debito',  ic: '💳', label: 'Débito' },
  { k: 'pix',     ic: '⚡', label: 'Pix' },
];

// Ícone de reserva por categoria, enquanto o prato não tem foto real.
const FALLBACK = {
  entradas: '🥖', pratos: '🍽️', porções: '🍟', porcoes: '🍟',
  sobremesas: '🍮', bebidas: '🥤',
};
const iconePara = (catName = '') => FALLBACK[catName.toLowerCase()] || '🍴';

/**
 * TOTEM de autoatendimento (fica na porta do restaurante).
 * Fluxo: início → cardápio → comer aqui ou marmita → pagamento → mesa/retirada.
 * Sem login. O cliente paga no ato.
 */
export default function Totem() {
  const [step, setStep] = useState('inicio');   // inicio|menu|modo|pagar|fim
  const [menu, setMenu] = useState({ categories: [], products: [] });
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [picking, setPicking] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [mode, setMode] = useState(null);
  const [status, setStatus] = useState({ aceita_local: true, mesas_livres: 0 });
  const [fim, setFim] = useState(null);
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [fundoUrl, setFundoUrl] = useState(null);   // arte de fundo enviada em Marca

  // Descobre se o gerente enviou uma arte de fundo (tenta png/jpg/webp).
  useEffect(() => {
    const exts = ['png', 'jpg', 'webp'];
    let i = 0, cancel = false;
    const tenta = () => {
      if (cancel || i >= exts.length) return;
      const url = `/uploads/totem-fundo.${exts[i]}?v=${Date.now()}`;
      const img = new Image();
      img.onload = () => { if (!cancel) setFundoUrl(url); };
      img.onerror = () => { i++; tenta(); };
      img.src = url;
    };
    tenta();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    api('/public/menu').then(m => { setMenu(m); setActiveCat(m.categories[0]?.id ?? null); });
  }, []);

  useEffect(() => {
    if (step === 'modo' || step === 'inicio') api('/public/totem/status').then(setStatus).catch(() => {});
  }, [step]);

  // Volta sozinho para o início: totem não pode ficar preso no pedido de quem já foi embora.
  useEffect(() => {
    if (step !== 'fim') return;
    const t = setTimeout(reiniciar, 20000);
    return () => clearTimeout(t);
  }, [step]);

  function reiniciar() {
    setCart([]); setMode(null); setFim(null); setErr(''); setDrawer(false); setStep('inicio');
  }

  const catName = (id) => menu.categories.find(c => c.id === id)?.name || '';
  const shown = useMemo(
    () => menu.products.filter(p => activeCat == null || p.category_id === activeCat),
    [menu, activeCat]
  );
  const total = cart.reduce((s, i) => s + i.unit * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

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

  async function pagar(payment_method) {
    setErr(''); setEnviando(true);
    try {
      const r = await api('/public/totem/order', {
        method: 'POST',
        body: {
          mode, payment_method,
          items: cart.map(i => ({ product_id: i.product_id, qty: i.qty, options: i.options })),
        },
      });
      setFim(r); setStep('fim');
    } catch (e) {
      // Salão pode ter lotado enquanto o cliente montava o pedido.
      if (String(e.message).includes('SEM_MESA') || String(e.message).includes('mesas')) {
        setErr('As mesas lotaram enquanto você escolhia. Pode levar como marmita?');
        setMode(null); setStep('modo');
        api('/public/totem/status').then(setStatus);
      } else setErr(e.message);
    } finally { setEnviando(false); }
  }

  const Cabecalho = ({ tag }) => (
    <div className="tt-head">
      <Logo variant="red" compact className="mark" />
      <b className="tt-display nome">Paladar</b>
      {tag && <span className="tag">{tag}</span>}
    </div>
  );

  // ---------- Início ----------
  if (step === 'inicio') {
    return (
      <div className="tt">
        <div className="tt-wrap">
          {/* Com arte enviada: a arte ocupa a tela e o botão fica sobre ela.
              Sem arte: o logo real num fundo escuro limpo. */}
          {fundoUrl ? (
            <div className="tt-inicio tt-inicio-fundo" onClick={() => setStep('modo')}
              style={{ backgroundImage: `url(${fundoUrl})` }}>
              <div className="tt-hero-cta">
                <div className="tt-cta">Toque para começar</div>
                <div className="tt-info">
                  {status.aceita_local
                    ? `🍽️ ${status.mesas_livres} mesa(s) livre(s)  ·  🍱 marmita para viagem`
                    : '🍱 No momento, apenas marmita para viagem'}
                </div>
              </div>
            </div>
          ) : (
            <div className="tt-inicio" onClick={() => setStep('modo')}>
              <div className="tt-abertura">
                <Logo variant="red" className="tt-logo-real" />
                <div className="tt-cta">Toque para começar</div>
                <div className="tt-info">
                  {status.aceita_local
                    ? `🍽️ ${status.mesas_livres} mesa(s) livre(s)  ·  🍱 marmita para viagem`
                    : '🍱 No momento, apenas marmita para viagem'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- Escolher modo ----------
  if (step === 'modo') {
    return (
      <div className="tt">
        <div className="tt-wrap">
          <Cabecalho />
          <div className="tt-step">
            <p className="tt-thin">Primeiro, uma escolha</p>
            <h2 className="tt-display">Como você vai comer?</h2>
            {err && <div className="error-msg" style={{ maxWidth: 620, marginTop: 20 }}>{err}</div>}
            <div className="tt-grid2">
              <button className={'tt-card' + (!status.aceita_local ? ' off' : '')}
                disabled={!status.aceita_local}
                onClick={() => { setMode('local'); setStep('menu'); }}>
                <span className="ic">🍽️</span>
                <b>Comer aqui</b>
                <span>{status.aceita_local ? 'A gente indica sua mesa' : 'Salão lotado no momento'}</span>
              </button>
              <button className="tt-card" onClick={() => { setMode('viagem'); setStep('menu'); }}>
                <span className="ic">🍱</span>
                <b>Marmita p/ viagem</b>
                <span>Retire no balcão</span>
              </button>
            </div>
            <button className="tt-voltar" onClick={reiniciar}>← Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Pagamento ----------
  if (step === 'pagar') {
    return (
      <div className="tt">
        <div className="tt-wrap">
          <Cabecalho tag={mode === 'local' ? '🍽️ Comer aqui' : '🍱 Marmita'} />
          <div className="tt-step">
            <p className="tt-thin">Total do pedido</p>
            <div className="tt-total tt-display">{money(total)}</div>
            <p className="tt-thin">{count} item(s)</p>
            {err && <div className="error-msg" style={{ maxWidth: 620, marginTop: 20 }}>{err}</div>}
            <div className="tt-grid2 tt-grid3">
              {PAGAMENTOS.map(p => (
                <button key={p.k} className="tt-card" disabled={enviando} onClick={() => pagar(p.k)}>
                  <span className="ic">{p.ic}</span>
                  <b>{p.label}</b>
                </button>
              ))}
            </div>
            {enviando && <p className="tt-thin" style={{ marginTop: 24 }}>Processando…</p>}
            <button className="tt-voltar" disabled={enviando} onClick={() => setStep('menu')}>← Voltar ao cardápio</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Confirmação ----------
  if (step === 'fim' && fim) {
    return (
      <div className="tt">
        <div className="tt-wrap">
          <div className="tt-fim" onClick={reiniciar}>
            <div>
              <div style={{ fontSize: 68 }}>{fim.mode === 'local' ? '🍽️' : '🍱'}</div>
              <h1 className="tt-display">Pedido<br />confirmado</h1>
              <div className="tt-senha">{fim.code}</div>

              {fim.mode === 'local' ? (
                <div className="tt-mesa-box">
                  <p className="tt-thin">Sua mesa é a</p>
                  <div className="tt-mesa tt-display">{fim.table_name?.replace(/\D/g, '')}</div>
                  <p className="tt-thin">Pode se sentar · levamos até você</p>
                </div>
              ) : (
                <div className="tt-mesa-box">
                  <p className="tt-thin">Retire no</p>
                  <div className="tt-retirar tt-display">Balcão</div>
                  <p className="tt-thin">Quando chamarmos sua senha</p>
                </div>
              )}

              <div className="tt-info">Pago em {fim.payment_method} · {money(fim.total)}</div>
              <div className="tt-cta" style={{ marginTop: 30 }}>Bom apetite</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Cardápio ----------
  return (
    <div className="tt">
      <div className="tt-wrap">
        {/* O modo já foi escolhido: o cliente vê o tempo todo o que decidiu. */}
        <Cabecalho tag={mode === 'local' ? '🍽️ Comer aqui' : '🍱 Marmita p/ viagem'} />

        <div className="tt-cats">
          {menu.categories.map(c => (
            <button key={c.id} className={activeCat === c.id ? 'active' : ''} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="tt-grid">
          {shown.map(p => (
            <button className="tt-prod" key={p.id} onClick={() => add(p)}>
              <div className="tt-foto">
                {/* Foto real do prato quando cadastrada; senão, ícone da categoria. */}
                {p.image
                  ? <img src={p.image} alt={p.name} />
                  : <span className="ph">{iconePara(catName(p.category_id))}</span>}
              </div>
              <div className="nome">{p.name}</div>
              <div className="desc">{p.description}</div>
              <div className="preco">{money(p.price)}</div>
              {p.groups?.length > 0 && <div className="custom">do seu jeito</div>}
              <div className="cta">{p.groups?.length ? 'Escolher' : 'Pedir'}</div>
            </button>
          ))}
        </div>

        <div className="tt-bar">
          <button className="cancel" onClick={() => setStep('modo')}>← Voltar</button>
          <div className="info">
            <small>{count} item(s) no pedido</small>
            <b>{money(total)}</b>
          </div>
          <button className="go" disabled={cart.length === 0} onClick={() => setDrawer(true)}>
            Ver pedido →
          </button>
        </div>
      </div>

      {drawer && (
        <div className="tb-drawer-bg" onClick={() => setDrawer(false)}>
          <div className="tb-drawer" onClick={e => e.stopPropagation()}>
            <header>
              <h2>Seu pedido</h2>
              <button className="btn sm ghost" onClick={() => setDrawer(false)}>Fechar</button>
            </header>
            <div className="items">
              {cart.map(i => (
                <div className="tb-di" key={i.lineId}>
                  <div className="n">
                    {i.name}
                    <small>{money(i.unit)}</small>
                    {i.optionNames.length > 0 && (
                      <div className="opt-list">{i.optionNames.map(o => o.name).join(' · ')}</div>
                    )}
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
              <button className="btn ok" onClick={() => { setDrawer(false); setStep('pagar'); }}>
                Ir para o pagamento
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
