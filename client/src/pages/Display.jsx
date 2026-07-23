import React, { useEffect, useState } from 'react';
import { api, money } from '../api.js';
import Logo from '../components/Logo.jsx';

/**
 * TELA DO CLIENTE — espelho do atendente. Sem login, sem interação.
 * Mostra a quantidade (peso, pessoas ou marmitas), o valor e o agradecimento.
 */
export default function Display() {
  const [d, setD] = useState(null);
  const [marca, setMarca] = useState({});

  useEffect(() => {
    let vivo = true;
    const ler = async () => {
      try { const s = await api('/public/display'); if (vivo) setD(s); } catch { /* segue tentando */ }
    };
    ler();
    const t = setInterval(ler, 700);
    api('/public/marca').then(setMarca).catch(() => {});
    return () => { vivo = false; clearInterval(t); };
  }, []);

  const status = d?.status || 'ocioso';

  // Linha da quantidade, conforme o tipo de plano.
  function quantidade() {
    if (d.kind === 'kg') return { rotulo: 'Peso do prato', valor: d.net_kg.toFixed(3).replace('.', ','), un: 'kg' };
    if (d.kind === 'pessoa') return { rotulo: d.plan_name || 'Buffet', valor: d.qty, un: d.qty > 1 ? 'pessoas' : 'pessoa' };
    return { rotulo: d.plan_name || 'Marmita', valor: d.qty, un: d.qty > 1 ? 'marmitas' : 'marmita' };
  }

  return (
    <div className="dp">
      {status === 'pago' ? (
        <div className="dp-centro">
          <div className="dp-check">✓</div>
          <div className="dp-obrigado">Obrigado!</div>
          <div className="dp-volte">Volte sempre 🍽️</div>
        </div>
      ) : status === 'ativo' ? (
        (() => { const q = quantidade(); return (
          <div className="dp-centro">
            <div className="dp-bloco">
              <span className="dp-rotulo">{q.rotulo}</span>
              <span className="dp-peso">{q.valor}<i>{q.un}</i></span>
            </div>
            <div className="dp-bloco dp-valor-bloco">
              <span className="dp-rotulo">Valor a pagar</span>
              <span className="dp-valor">{money(d.total)}</span>
            </div>
            <div className="dp-obrigado-peq">Obrigado pela preferência 🍽️</div>
          </div>
        ); })()
      ) : (
        <div className={'dp-centro dp-inicio' + (marca.fundo ? ' com-fundo' : '')}
          style={marca.fundo ? { backgroundImage: `url(${marca.fundo})` } : undefined}>
          {!marca.fundo && <Logo variant="red" className="dp-logo" />}
          <div className="dp-inicio-fade">
            <div className="dp-bemvindo">Seja bem-vindo</div>
            <div className="dp-volte">Sirva-se · pesamos e você paga na saída</div>
          </div>
        </div>
      )}
    </div>
  );
}
