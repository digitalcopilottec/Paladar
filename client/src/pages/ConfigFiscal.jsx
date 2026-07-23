import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const PROVIDERS = [
  { k: '', label: 'Nenhum (não transmite)' },
  { k: 'plugnotas', label: 'PlugNotas' },
  { k: 'focus', label: 'Focus NFe' },
  { k: 'webmania', label: 'WebmaniaBR' },
  { k: 'tecnospeed', label: 'Tecnospeed' },
];

export default function ConfigFiscal() {
  const [c, setC] = useState(null);
  const [status, setStatus] = useState(null);
  const [csc, setCsc] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    api('/fiscal/company').then(d => setC(d || { uf: 'RS', crt: 1, ambiente: 2, serie: 1 }));
    api('/fiscal/status').then(setStatus);
  };
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault(); setErr(''); setMsg('');
    try {
      await api('/fiscal/company', { method: 'PUT', body: { ...c, ...(csc ? { csc } : {}) } });
      setCsc(''); setMsg('Configuração salva.'); load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setErr(e.message); }
  }

  if (!c) return <p>Carregando…</p>;
  const set = (k) => (e) => setC({ ...c, [k]: e.target.value });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>🧾 Configuração Fiscal</h1>
          <div className="sub">NFC-e modelo 65 · SEFAZ-RS</div>
        </div>
      </div>

      {err && <div className="error-msg">{err}</div>}
      {msg && <div className="split-out" style={{ marginBottom: 14 }}>{msg}</div>}

      {status && (
        <div className="card" style={{
          marginBottom: 18,
          borderColor: status.ok ? 'var(--ok)' : 'var(--warn)',
          background: status.ok ? '#e7f6ee' : '#fff8ec',
        }}>
          <b>{status.ok ? '✓ Pronto para emitir' : '⚠ Ainda falta para emitir:'}</b>
          {!status.ok && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              {status.faltando.map(f => <li key={f} style={{ fontSize: 14 }}>{f}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="card" style={{
        marginBottom: 18, borderColor: c.ambiente == 2 ? 'var(--warn)' : 'var(--brand)',
      }}>
        <b>Ambiente: {c.ambiente == 2 ? '🧪 HOMOLOGAÇÃO (sem valor fiscal)' : '🔴 PRODUÇÃO (nota valendo)'}</b>
        <p className="sub" style={{ margin: '6px 0 0' }}>
          Teste tudo em homologação antes. Nota emitida em produção é documento fiscal de verdade —
          errou, só se corrige com cancelamento na SEFAZ (prazo de 30 minutos na NFC-e).
        </p>
      </div>

      <form onSubmit={save}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Emitente</h3>
          <div className="row">
            <div className="field" style={{ flex: 2 }}><label>Razão social</label>
              <input className="input" value={c.razao_social || ''} onChange={set('razao_social')} /></div>
            <div className="field"><label>Nome fantasia</label>
              <input className="input" value={c.nome_fantasia || ''} onChange={set('nome_fantasia')} /></div>
          </div>
          <div className="row">
            <div className="field"><label>CNPJ</label>
              <input className="input" value={c.cnpj || ''} onChange={set('cnpj')} placeholder="00.000.000/0001-00" /></div>
            <div className="field"><label>Inscrição Estadual</label>
              <input className="input" value={c.ie || ''} onChange={set('ie')} /></div>
            <div className="field"><label>Regime (CRT)</label>
              <select className="input" value={c.crt || 1} onChange={set('crt')}>
                <option value={1}>1 — Simples Nacional</option>
                <option value={2}>2 — Simples, excesso de sublimite</option>
                <option value={3}>3 — Regime normal</option>
              </select></div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Endereço</h3>
          <div className="row">
            <div className="field" style={{ flex: 3 }}><label>Rua</label>
              <input className="input" value={c.street || ''} onChange={set('street')} /></div>
            <div className="field"><label>Número</label>
              <input className="input" value={c.number || ''} onChange={set('number')} /></div>
          </div>
          <div className="row">
            <div className="field"><label>Bairro</label>
              <input className="input" value={c.district || ''} onChange={set('district')} /></div>
            <div className="field"><label>Cidade</label>
              <input className="input" value={c.city || ''} onChange={set('city')} /></div>
            <div className="field"><label>Código IBGE</label>
              <input className="input" value={c.city_code || ''} onChange={set('city_code')}
                placeholder="4314902" /></div>
          </div>
          <div className="row">
            <div className="field"><label>UF</label>
              <input className="input" value={c.uf || 'RS'} onChange={set('uf')} maxLength={2} /></div>
            <div className="field"><label>CEP</label>
              <input className="input" value={c.cep || ''} onChange={set('cep')} /></div>
            <div className="field"><label>Telefone</label>
              <input className="input" value={c.phone || ''} onChange={set('phone')} /></div>
          </div>
          <p className="hint" style={{ textAlign: 'left', marginTop: 0 }}>
            O <b>código IBGE</b> do município é obrigatório na NFC-e. Porto Alegre = 4314902.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Transmissão</h3>
          <div className="row">
            <div className="field"><label>Ambiente</label>
              <select className="input" value={c.ambiente} onChange={set('ambiente')}>
                <option value={2}>2 — Homologação (teste)</option>
                <option value={1}>1 — Produção (valendo)</option>
              </select></div>
            <div className="field"><label>Série</label>
              <input className="input" type="number" value={c.serie || 1} onChange={set('serie')} /></div>
            <div className="field"><label>Próximo número</label>
              <input className="input" value={c.next_number || 1} disabled /></div>
          </div>
          <div className="field"><label>Provedor de transmissão</label>
            <select className="input" value={c.provider || ''} onChange={set('provider')}>
              {PROVIDERS.map(p => <option key={p.k} value={p.k}>{p.label}</option>)}
            </select></div>

          <div className="row">
            <div className="field"><label>ID do CSC (idToken)</label>
              <input className="input" value={c.csc_id || ''} onChange={set('csc_id')} placeholder="000001" /></div>
            <div className="field">
              <label>CSC {c.csc_preenchido && <span className="badge livre">já salvo</span>}</label>
              <input className="input" type="password" value={csc} onChange={e => setCsc(e.target.value)}
                placeholder={c.csc_preenchido ? '•••••• (deixe vazio p/ manter)' : 'cole aqui o CSC'} />
            </div>
          </div>
          <p className="hint" style={{ textAlign: 'left', marginTop: 0 }}>
            O <b>CSC</b> você gera no portal da SEFAZ-RS. É um segredo: o sistema nunca
            devolve o valor dele na tela depois de salvo. O <b>certificado digital</b> é
            instalado no provedor, não aqui.
          </p>
        </div>

        <button className="btn" style={{ maxWidth: 260 }}>Salvar configuração</button>
      </form>
    </>
  );
}
