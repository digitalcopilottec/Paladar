import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const SLOTS = [
  { k: 'logo',  titulo: 'Logo do Paladar',
    dica: 'Aparece no login, no menu, no totem e na tela do cliente. Ideal: PNG quadrado com fundo transparente.' },
  { k: 'fundo', titulo: 'Arte de fundo da tela de início',
    dica: 'Aparece na tela do cliente (/display) enquanto ninguém está sendo atendido. Ideal: paisagem (4:3 ou 16:9).' },
  { k: 'login', titulo: 'Fundo da tela de login',
    dica: 'Aparece atrás do formulário de entrada do sistema. Ideal: paisagem (4:3 ou 16:9).' },
];

export default function Marca() {
  const [envios, setEnvios] = useState({});
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [ativo, setAtivo] = useState('logo');   // qual slot recebe o Ctrl+V

  const carregar = () => api('/upload').then(setEnvios).catch(e => setErr(e.message));
  useEffect(() => { carregar(); }, []);

  async function enviar(slot, file) {
    setErr(''); setMsg('');
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      return setErr('Use PNG, JPG ou WEBP. (SVG não é aceito por segurança.)');
    }
    if (file.size > 8 * 1024 * 1024) return setErr('Imagem maior que 8 MB.');

    const data = await new Promise((ok, fail) => {
      const r = new FileReader();
      r.onload = () => ok(r.result);
      r.onerror = () => fail(new Error('Não consegui ler o arquivo'));
      r.readAsDataURL(file);
    });

    try {
      await api('/upload', { method: 'POST', body: { slot, data } });
      setMsg('Enviado! Já está valendo no sistema.');
      carregar();
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { setErr(e.message); }
  }

  // Colar direto da área de transferência — é assim que o lojista tem a imagem.
  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
      if (item) enviar(ativo, item.getAsFile());
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [ativo]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>🎨 Marca</h1>
          <div className="sub">Envie o logo e a arte do totem — os arquivos originais</div>
        </div>
      </div>

      {err && <div className="error-msg">{err}</div>}
      {msg && <div className="split-out" style={{ marginBottom: 14 }}>{msg}</div>}

      <div className="card" style={{ marginBottom: 18, background: '#eef6ff', borderColor: '#2c7bb0' }}>
        <b>📋 Como enviar</b>
        <p className="sub" style={{ margin: '6px 0 0' }}>
          Clique no quadro abaixo e aperte <b>Ctrl+V</b> (ou <b>⌘+V</b>) para colar a imagem
          que está na sua área de transferência. Ou arraste o arquivo, ou clique para procurar.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {SLOTS.map(s => (
          <div className="card" key={s.k}
            onClick={() => setAtivo(s.k)}
            style={{ borderColor: ativo === s.k ? 'var(--brand)' : 'var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>{s.titulo}</b>
              {ativo === s.k && <span className="badge ocupada">Ctrl+V cola aqui</span>}
            </div>
            <p className="sub" style={{ margin: '6px 0 12px' }}>{s.dica}</p>

            <Zona slot={s.k} atual={envios[s.k]} onArquivo={f => enviar(s.k, f)}
              onFocar={() => setAtivo(s.k)} />
          </div>
        ))}
      </div>
    </>
  );
}

function Zona({ slot, atual, onArquivo, onFocar }) {
  const input = useRef(null);
  const [sobre, setSobre] = useState(false);

  return (
    <>
      <div
        className={'up-zona' + (sobre ? ' sobre' : '')}
        onClick={() => { onFocar(); input.current?.click(); }}
        onDragOver={e => { e.preventDefault(); setSobre(true); }}
        onDragLeave={() => setSobre(false)}
        onDrop={e => {
          e.preventDefault(); setSobre(false);
          onArquivo(e.dataTransfer.files?.[0]);
        }}>
        {atual
          ? <img src={atual} alt="" />
          : <div className="up-vazio">
              <div style={{ fontSize: 34 }}>📁</div>
              <b>Colar, arrastar ou clicar</b>
              <span>PNG, JPG ou WEBP · até 8 MB</span>
            </div>}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={e => { onArquivo(e.target.files?.[0]); e.target.value = ''; }} />
      {atual && (
        <button className="btn sm ghost" style={{ width: '100%', marginTop: 10 }}
          onClick={() => { onFocar(); input.current?.click(); }}>
          Trocar imagem
        </button>
      )}
    </>
  );
}
