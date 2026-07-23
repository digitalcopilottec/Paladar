import React, { useEffect, useState } from 'react';
import { api, money, todayLocal } from '../api.js';

// Referência do setor: CMV saudável em restaurante costuma ficar entre 25% e 35%.
const cmvCor = (p) => !p ? 'var(--muted)' : p <= 35 ? 'var(--ok)' : p <= 45 ? 'var(--warn)' : 'var(--brand)';
const cmvNota = (p) => !p ? '' : p <= 35 ? '· saudável' : p <= 45 ? '· atenção' : '· alto';

export default function Relatorios() {
  const today = todayLocal();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);

  const load = () => api(`/reports/summary?from=${from}&to=${to}`).then(setData);
  useEffect(() => { load(); }, []);

  const maxMethod = data ? Math.max(1, ...data.byMethod.map(m => m.total)) : 1;

  return (
    <>
      <div className="page-head">
        <div><h1>📈 Relatórios</h1><div className="sub">Vendas e desempenho</div></div>
        <div className="row" style={{ maxWidth: 420, alignItems: 'flex-end' }}>
          <div className="field" style={{ margin: 0 }}><label>De</label><input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>Até</label><input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
          <button className="btn sm" onClick={load}>Filtrar</button>
        </div>
      </div>

      {data && <>
        <div className="grid cards" style={{ marginBottom: 20 }}>
          <div className="card stat brand"><span className="label">Faturamento</span><span className="value">{money(data.faturamento)}</span></div>
          <div className="card stat"><span className="label">Pedidos</span><span className="value">{data.pedidos}</span></div>
          <div className="card stat"><span className="label">Ticket médio</span><span className="value">{money(data.ticketMedio)}</span></div>
          <div className="card stat">
            <span className="label">CMV (custo da mercadoria)</span>
            <span className="value" style={{ color: cmvCor(data.cmvPerc) }}>{money(data.cmv)}</span>
            <span className="sub">{data.cmvPerc}% do faturamento {cmvNota(data.cmvPerc)}</span>
          </div>
          <div className="card stat">
            <span className="label">Lucro bruto</span>
            <span className="value" style={{ color: 'var(--ok)' }}>{money(data.lucroBruto)}</span>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Por forma de pagamento</h3>
            {data.byMethod.length === 0 && <div className="sub">Sem vendas no período.</div>}
            {data.byMethod.map(m => (
              <div key={m.method} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                  <span style={{ textTransform: 'capitalize' }}>{m.method}</span><b>{money(m.total)}</b>
                </div>
                <div style={{ height: 8, background: 'var(--line)', borderRadius: 6 }}>
                  <div style={{ height: '100%', width: (m.total / maxMethod * 100) + '%', background: 'var(--brand)', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Mais vendidos</h3>
            <div className="sub" style={{ marginBottom: 8 }}>Por quantidade — não confunda com o que dá mais lucro.</div>
            <table>
              <thead><tr><th>Produto</th><th style={{ textAlign: 'right' }}>Qtd</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {data.topProducts.length === 0 && <tr><td colSpan={3} className="sub">Sem dados.</td></tr>}
                {data.topProducts.map(p => (
                  <tr key={p.name}><td>{p.name}</td><td style={{ textAlign: 'right' }}>{p.qtd}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{money(p.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data.porProduto?.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Rentabilidade por produto</h3>
            <div className="sub" style={{ marginBottom: 8 }}>
              Só aparecem produtos com ficha técnica. Ordenado pelo lucro que cada um gerou.
            </div>
            <table>
              <thead><tr>
                <th>Produto</th><th style={{ textAlign: 'right' }}>Qtd</th>
                <th style={{ textAlign: 'right' }}>Receita</th><th style={{ textAlign: 'right' }}>Custo</th>
                <th style={{ textAlign: 'right' }}>Lucro</th><th style={{ textAlign: 'right' }}>Margem</th>
              </tr></thead>
              <tbody>
                {data.porProduto.map(p => (
                  <tr key={p.name}>
                    <td><b>{p.name}</b></td>
                    <td style={{ textAlign: 'right' }}>{p.qtd}</td>
                    <td style={{ textAlign: 'right' }}>{money(p.receita)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{money(p.custo)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ok)' }}>{money(p.lucro)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800,
                      color: p.margem >= 60 ? 'var(--ok)' : p.margem >= 40 ? 'var(--warn)' : 'var(--brand)' }}>
                      {p.margem}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>}
    </>
  );
}
