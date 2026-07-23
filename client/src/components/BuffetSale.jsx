import React, { useEffect, useRef, useState } from 'react';
import { api, money } from '../api.js';

const PAGAMENTOS = [
  { k: 'dinheiro', ic: '💵', label: 'Dinheiro' },
  { k: 'pix',      ic: '⚡', label: 'Pix' },
  { k: 'debito',   ic: '💳', label: 'Débito' },
  { k: 'credito',  ic: '💳', label: 'Crédito' },
];
const UNIDADE = { kg: '/kg', pessoa: '/pessoa', unidade: '/un' };

/**
 * Venda do buffet (planos + peso/quantidade + pagamento). Espelha na tela
 * do cliente (/display). Usado no PDV e no app do atendente.
 */
export default function BuffetSale() {
  const [plans, setPlans] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [disp, setDisp] = useState(null);
  const [plan, setPlan] = useState(null);
  const [peso, setPeso] = useState('');
  const [count, setCount] = useState(1);
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);
  const debounce = useRef(null);

  const carregar = () => api('/buffet/state').then(s => {
    setPlans(s.plans); setCfg(s.config); setDisp(s.display);
  }).catch(e => setErr(e.message));
  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (!plan) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setErr('');
      try {
        const body = plan.kind === 'kg'
          ? { plan_id: plan.id, gross_kg: Number(peso) / 1000 }
          : { plan_id: plan.id, count };
        setDisp(await api('/buffet/quote', { method: 'POST', body }));
      } catch (e) { setErr(e.message); }
    }, plan.kind === 'kg' ? 350 : 60);
    return () => clearTimeout(debounce.current);
  }, [plan, peso, count]);

  async function escolher(p) {
    setPlan(p); setPeso(''); setCount(1); setErr('');
    if (p.kind !== 'kg') {
      try { setDisp(await api('/buffet/quote', { method: 'POST', body: { plan_id: p.id, count: 1 } })); }
      catch (e) { setErr(e.message); }
    } else {
      await api('/buffet/reset', { method: 'POST' }).catch(() => {});
    }
  }
  async function receber(metodo) {
    setErr(''); setEnviando(true);
    try { setDisp(await api('/buffet/confirm', { method: 'POST', body: { payment_method: metodo } })); }
    catch (e) { setErr(e.message); } finally { setEnviando(false); }
  }
  async function novo() {
    setPlan(null); setPeso(''); setCount(1); setErr('');
    setDisp(await api('/buffet/reset', { method: 'POST' }));
  }

  if (!cfg) return <p>Carregando…</p>;
  const pago = disp?.status === 'pago';
  const total = disp?.total || 0;
  const podeReceber = plan && total > 0 && (plan.kind !== 'kg' || Number(peso) > 0);

  if (pago) {
    return (
      <div className="card" style={{ textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
        <div style={{ fontSize: 54 }}>✅</div>
        <h3 style={{ margin: '6px 0' }}>Pago!</h3>
        <p className="sub">Comanda {disp.order_code} · {money(disp.total)} · {disp.payment_method}</p>
        <button className="btn" style={{ marginTop: 10 }} onClick={novo}>Próximo cliente</button>
      </div>
    );
  }

  if (!plan) {
    return (
      <>
        {plans.length === 0 && <div className="error-msg">Nenhum plano ativo. Cadastre em Config. Buffet.</div>}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {plans.map(p => (
            <button key={p.id} className="card bf-plano" onClick={() => escolher(p)}>
              <b>{p.name}</b>
              <span className="preco">{money(p.preco_hoje)}<small>{UNIDADE[p.kind]}</small></span>
              {p.price_saturday > 0 && p.preco_hoje !== p.price_saturday &&
                <em>sábado {money(p.price_saturday)}</em>}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 520, gap: 14 }}>
      <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={novo}>← Trocar plano</button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b style={{ fontSize: 17 }}>{plan.name}</b>
          <span className="badge reservada">{money(disp?.price_per_kg || plan.preco_hoje)}{UNIDADE[plan.kind]}</span>
        </div>

        {plan.kind === 'kg' ? (
          <>
            <div className="field" style={{ marginTop: 14 }}>
              <label>Peso na balança (gramas)</label>
              <input className="input" type="number" inputMode="decimal" autoFocus
                value={peso} onChange={e => setPeso(e.target.value)} placeholder="0"
                style={{ fontSize: 30, fontWeight: 800 }} />
            </div>
            {cfg.tare_kg > 0 && <p className="hint" style={{ textAlign: 'left', marginTop: 0 }}>
              Desconta o prato vazio: {(cfg.tare_kg * 1000).toFixed(0)} g</p>}
            <div className="cm-line"><span>Peso líquido</span>
              <b>{disp ? disp.net_kg.toFixed(3) : '0.000'} kg</b></div>
          </>
        ) : (
          <div className="switch" style={{ borderBottom: 'none', marginTop: 6 }}>
            <label>{plan.kind === 'pessoa' ? 'Pessoas' : 'Marmitas'}</label>
            <div className="qty">
              <button onClick={() => setCount(c => Math.max(1, c - 1))}>−</button>
              <b style={{ fontSize: 20, minWidth: 30, textAlign: 'center' }}>{count}</b>
              <button onClick={() => setCount(c => c + 1)}>+</button>
            </div>
          </div>
        )}

        <div className="cm-line total"><span>Total</span><span>{money(total)}</span></div>
      </div>

      {err && <div className="error-msg">{err}</div>}

      <div>
        <label className="sub" style={{ display: 'block', marginBottom: 8 }}>RECEBER EM</label>
        <div className="pay-methods">
          {PAGAMENTOS.map(p => (
            <button key={p.k} disabled={!podeReceber || enviando} onClick={() => receber(p.k)}>
              {p.ic} {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
