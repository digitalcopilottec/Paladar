import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, auth } from '../api.js';
import Logo from '../components/Logo.jsx';

const REFRESH_MS = 8000;   // o painel se atualiza sozinho
const WARN_MIN = 10;       // amarelo: pedido esperando demais
const LATE_MIN = 20;       // vermelho: atrasado

const NEXT = { novo: 'preparando', preparando: 'pronto', pronto: 'novo' };

export default function Cozinha() {
  const nav = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState('');
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      setTickets(await api('/kitchen/tickets'));
      setErr('');
    } catch (e) { setErr(e.message); }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer.current);
  }, [load]);

  // Atualização otimista: a cozinha toca e vê na hora, sem esperar o servidor.
  async function advance(item) {
    const status = NEXT[item.status] || 'preparando';
    setTickets(ts => ts.map(t => ({
      ...t, items: t.items.map(i => i.id === item.id ? { ...i, status } : i),
    })));
    try { await api(`/kitchen/items/${item.id}`, { method: 'PUT', body: { status } }); }
    catch (e) { setErr(e.message); load(); }
  }

  async function allReady(t) {
    setTickets(ts => ts.map(x => x.order_id === t.order_id
      ? { ...x, items: x.items.map(i => ({ ...i, status: 'pronto' })) } : x));
    try { await api(`/kitchen/tickets/${t.order_id}`, { method: 'PUT', body: { status: 'pronto' } }); }
    catch (e) { setErr(e.message); load(); }
  }

  // "Entregue" tira o ticket do painel (o item sai da fila da cozinha).
  async function deliver(t) {
    setTickets(ts => ts.filter(x => x.order_id !== t.order_id));
    try { await api(`/kitchen/tickets/${t.order_id}`, { method: 'PUT', body: { status: 'entregue' } }); }
    catch (e) { setErr(e.message); load(); }
  }

  const level = (min) => min >= LATE_MIN ? 'late' : min >= WARN_MIN ? 'warn' : '';

  return (
    <div className="kds">
      <div className="kds-head">
        <Logo variant="red" compact className="mark" />
        <b>Paladar</b>
        <span className="tag">Cozinha · KDS</span>
        <div className="right">
          <span className="live"><span className="dot" /> ao vivo · {tickets.length} comanda(s)</span>
          {/* "Sair" no menu lateral desloga; aqui só volta ao painel — nomes diferentes evitam confusão. */}
          <button className="exit" onClick={() => nav('/')}>← Painel</button>
        </div>
      </div>

      {err && <div className="error-msg" style={{ margin: 12 }}>{err}</div>}

      <div className="kds-board">
        {loaded && tickets.length === 0 && (
          <div className="kds-empty">
            <div>🍽️</div>
            <h2>Nenhum pedido na fila</h2>
            <p>Os pedidos aparecem aqui automaticamente assim que forem enviados.</p>
          </div>
        )}

        {tickets.map(t => {
          const ready = t.items.every(i => i.status === 'pronto');
          const lv = ready ? 'ready' : level(t.minutos);
          return (
            <div className={'ticket ' + lv} key={t.order_id}>
              <div className="ticket-head">
                <div>
                  <b>
                    {t.type === 'delivery' && <span className="tk-tag">🛵 Delivery</span>}
                    {/* Marmita embala diferente de prato no salão — o cozinheiro precisa ver na hora. */}
                    {t.type === 'viagem' && <span className="tk-tag viagem">🍱 Marmita</span>}
                    {t.table_name
                      || (t.type === 'viagem' ? 'Para viagem'
                        : t.type === 'balcao' ? 'Balcão'
                        : t.customer_name || 'Delivery')}
                  </b>
                  <small>Comanda {t.code}</small>
                </div>
                <span className={'ticket-time ' + level(t.minutos)}>{t.minutos}min</span>
              </div>

              <div className="ticket-items">
                {t.items.map(i => (
                  <div className={'ki' + (i.status === 'pronto' ? ' done' : '')} key={i.id}>
                    <span className="qty-badge">{i.qty}x</span>
                    <div className="txt">
                      <b>{i.name}</b>
                      {/* Sem isto o cozinheiro vê só "Picanha" e erra o ponto/adicional. */}
                      {i.options?.length > 0 && (
                        <div className="ki-opts">
                          {i.options.map((o, ix) => <span key={ix}>{o.name}</span>)}
                        </div>
                      )}
                      {i.notes && <small>⚠ {i.notes}</small>}
                    </div>
                    <button className={'ki-chip ' + i.status} onClick={() => advance(i)}>
                      {i.status}
                    </button>
                  </div>
                ))}
              </div>

              <div className="ticket-foot">
                {!ready
                  ? <button className="kds-btn-ready" onClick={() => allReady(t)}>✓ Tudo pronto</button>
                  : <button className="kds-btn-out" onClick={() => deliver(t)}>Entregue → tirar</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
