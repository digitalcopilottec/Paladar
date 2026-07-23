import React, { useEffect, useState } from 'react';
import { api, money } from '../api.js';

const BADGE = {
  pendente: 'reservada', autorizada: 'livre', rejeitada: 'ocupada', cancelada: 'ocupada',
};
const ROTULO = {
  pendente: '⏳ pendente', autorizada: '✓ autorizada',
  rejeitada: '✕ rejeitada', cancelada: '⊘ cancelada',
};

export default function Notas() {
  const [docs, setDocs] = useState([]);
  const [status, setStatus] = useState(null);
  const [ver, setVer] = useState(null);
  const [err, setErr] = useState('');

  const load = () => {
    api('/fiscal/docs').then(setDocs).catch(e => setErr(e.message));
    api('/fiscal/status').then(setStatus).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  async function cancelar(d) {
    const motivo = prompt('Justificativa do cancelamento (mínimo 15 caracteres, exigência da SEFAZ):');
    if (!motivo) return;
    try {
      await api(`/fiscal/docs/${d.id}/cancel`, { method: 'POST', body: { motivo } });
      load();
    } catch (e) { setErr(e.message); }
  }

  const pendentes = docs.filter(d => d.status === 'pendente').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>🧾 Notas Fiscais</h1>
          <div className="sub">NFC-e emitidas · {docs.length} nota(s)</div>
        </div>
      </div>

      {err && <div className="error-msg">{err}</div>}

      {status && !status.ok && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--warn)', background: '#fff8ec' }}>
          <b>⚠ As notas estão sendo geradas mas não transmitidas.</b>
          <p className="sub" style={{ margin: '6px 0 0' }}>
            {pendentes > 0 && `${pendentes} nota(s) pendente(s). `}
            Falta: {status.faltando.join(' · ')}. Configure em <b>Config. Fiscal</b>.
          </p>
        </div>
      )}

      <div className="card">
        <table>
          <thead><tr>
            <th>Emissão</th><th>Nº</th><th>Pedido</th><th>Chave</th>
            <th style={{ textAlign: 'right' }}>Valor</th><th>Status</th><th>Amb.</th><th></th>
          </tr></thead>
          <tbody>
            {docs.length === 0 && <tr><td colSpan={8} className="sub">Nenhuma nota emitida ainda.</td></tr>}
            {docs.map(d => (
              <tr key={d.id}>
                <td className="sub">{d.emitted_at?.slice(5, 16)}</td>
                <td><b>{d.serie}/{d.numero}</b></td>
                <td className="sub">{d.order_code}</td>
                <td className="opt-list" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {d.chave ? d.chave.replace(/(.{4})/g, '$1 ').trim() : '—'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{money(d.valor_total)}</td>
                <td><span className={'badge ' + BADGE[d.status]}>{ROTULO[d.status]}</span></td>
                <td>
                  <span className={'badge ' + (d.ambiente === 1 ? 'ocupada' : 'reservada')}>
                    {d.ambiente === 1 ? 'produção' : 'homolog.'}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn sm ghost" onClick={() => setVer(d)}>Ver</button>{' '}
                  {d.status !== 'cancelada' && (
                    <button className="btn sm ghost" onClick={() => cancelar(d)}>Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ver && (
        <div className="modal-bg" onClick={() => setVer(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <h3>NFC-e {ver.serie}/{ver.numero}</h3>
            <div className="cm-line"><span>Status</span>
              <b><span className={'badge ' + BADGE[ver.status]}>{ROTULO[ver.status]}</span></b></div>
            <div className="cm-line"><span>Pedido</span><b>{ver.order_code}</b></div>
            <div className="cm-line"><span>Valor</span><b>{money(ver.valor_total)}</b></div>
            <div className="cm-line"><span>Ambiente</span>
              <b>{ver.ambiente === 1 ? 'Produção' : 'Homologação'}</b></div>
            <div style={{ margin: '10px 0' }}>
              <div className="sub">Chave de acesso</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                {ver.chave}
              </div>
            </div>
            {ver.motivo && <div className="remaining">{ver.motivo}</div>}
            {ver.protocolo && (
              <div className="cm-line"><span>Protocolo</span><b>{ver.protocolo}</b></div>
            )}
            <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setVer(null)}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}
