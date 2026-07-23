import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, auth } from '../api.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const nav = useNavigate();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [marca, setMarca] = useState({});
  const wrapRef = useRef(null);
  const [artRect, setArtRect] = useState(null);   // caixa real da imagem (preenchida/cortada)
  const [cardPos, setCardPos] = useState(null);   // posição do card em cima da faixa vermelha

  useEffect(() => { api('/public/marca').then(setMarca).catch(() => {}); }, []);

  // A imagem não estica (contain) — o card de login acompanha a faixa
  // vermelha da direita em vez de ficar preso no centro da tela, sem nunca
  // vazar pra fora da janela em nenhum tamanho de tela.
  useEffect(() => {
    if (!marca.login || !wrapRef.current) return;
    const el = wrapRef.current;
    const FOCO_X = 0.74, FOCO_Y = 0.5;
    const CARD_W = 260, CARD_H = 340, MARGEM = 14;
    let ro;
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const calc = () => {
        const cw = el.clientWidth, ch = el.clientHeight;
        const largo = cw / ch > ratio;
        const w = largo ? ch * ratio : cw;
        const h = largo ? ch : cw / ratio;
        const artLeft = (cw - w) / 2, artTop = (ch - h) / 2;
        setArtRect({ left: artLeft, top: artTop, width: w, height: h });
        const cx = Math.min(cw - MARGEM - CARD_W / 2, Math.max(MARGEM + CARD_W / 2, artLeft + w * FOCO_X));
        const cy = Math.min(ch - MARGEM - CARD_H / 2, Math.max(MARGEM + CARD_H / 2, artTop + h * FOCO_Y));
        setCardPos({ left: cx, top: cy });
      };
      calc();
      ro = new ResizeObserver(calc);
      ro.observe(el);
    };
    img.src = marca.login;
    return () => ro?.disconnect();
  }, [marca.login]);

  if (auth.user) { nav('/'); }

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { username, password } });
      auth.set(token, user);
      nav('/');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <div className={'login-wrap' + (marca.login ? ' com-fundo' : '')} ref={wrapRef}
      style={marca.login ? {
        backgroundImage: `url(${marca.login})`,
        ...(artRect && {
          backgroundSize: `${artRect.width}px ${artRect.height}px`,
          backgroundPosition: `${artRect.left}px ${artRect.top}px`,
        }),
      } : undefined}>
      <form className={'login-card' + (marca.login ? ' com-fundo' : '')} onSubmit={submit}
        style={marca.login && cardPos ? {
          position: 'absolute', width: 260, maxWidth: 260,
          left: cardPos.left, top: cardPos.top,
          transform: 'translate(-50%, -50%)',
        } : undefined}>
        {!marca.login && <Logo variant="red" className="brand-logo" />}

        {err && <div className="error-msg">{err}</div>}

        <div className="field">
          <label>Usuário</label>
          <input className="input" autoFocus value={username}
            onChange={e => setU(e.target.value)} placeholder="seu usuário" />
        </div>
        <div className="field">
          <label>Senha</label>
          <input className="input" type="password" value={password}
            onChange={e => setP(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>

        <p className="hint">
          Perfis de teste:<br />
          admin · gerente · caixa · garcom<br />
          (senha = usuário + 123)
        </p>
      </form>
    </div>
  );
}
