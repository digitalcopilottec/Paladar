import React, { useEffect, useRef, useState } from 'react';
import { api, money } from '../api.js';
import Logo from '../components/Logo.jsx';

/**
 * TELA DO CLIENTE — espelho do atendente. Sem login, sem interação.
 * Mostra a quantidade (peso, pessoas ou marmitas), o valor e o agradecimento.
 */
export default function Display() {
  const [d, setD] = useState(null);
  const [marca, setMarca] = useState({});
  const artRef = useRef(null);
  const [artRect, setArtRect] = useState(null);

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

  // Mede a área real da imagem (background-size:contain) e reposiciona a cada
  // mudança de tamanho, pra funcionar em qualquer celular/tablet/totem.
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
        <div className={'dp-centro dp-inicio' + (marca.fundo ? ' com-fundo' : '')} ref={artRef}
          style={marca.fundo ? {
            backgroundImage: `url(${marca.fundo})`,
            ...(artRect && {
              backgroundSize: `${artRect.width}px ${artRect.height}px`,
              backgroundPosition: `${artRect.left}px ${artRect.top}px`,
            }),
          } : undefined}>
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
