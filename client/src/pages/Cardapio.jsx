import React, { useEffect, useState } from 'react';
import { api, money } from '../api.js';

const empty = { name: '', description: '', price: '', category_id: '' };

// NCM mais comuns em restaurante — evita o gerente ter que caçar na tabela.
const NCM_SUGESTOES = [
  { ncm: '21069090', label: 'Preparações alimentícias (pratos em geral)' },
  { ncm: '22021000', label: 'Refrigerante' },
  { ncm: '22029900', label: 'Suco / bebida não alcoólica' },
  { ncm: '22030000', label: 'Cerveja' },
  { ncm: '22084000', label: 'Cachaça / aguardente' },
  { ncm: '22011000', label: 'Água mineral' },
  { ncm: '20079900', label: 'Sobremesa / doces' },
];

export default function Cardapio() {
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const [fiscal, setFiscal] = useState(null);   // produto editando dados fiscais
  const [foto, setFoto] = useState(null);       // produto editando a foto do totem
  const [err, setErr] = useState('');

  const load = () => {
    api('/catalog/categories').then(setCats);
    api('/catalog/products').then(setProds);
  };
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api('/catalog/products', { method: 'POST', body: { ...form, price: Number(form.price), category_id: Number(form.category_id) || null } });
    setForm(empty); setShow(false); load();
  }

  const catName = (id) => cats.find(c => c.id === id)?.name || '—';

  async function saveFoto(e) {
    e.preventDefault(); setErr('');
    try {
      await api(`/catalog/products/${foto.id}`, { method: 'PUT', body: { image: foto.image || null } });
      setFoto(null); load();
    } catch (e) { setErr(e.message); }
  }

  async function saveFiscal(e) {
    e.preventDefault(); setErr('');
    try {
      await api(`/catalog/products/${fiscal.id}`, {
        method: 'PUT',
        body: {
          ncm: fiscal.ncm, cfop: fiscal.cfop, csosn: fiscal.csosn,
          origem: fiscal.origem, unidade: fiscal.unidade, cest: fiscal.cest || null,
        },
      });
      setFiscal(null); load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>📖 Cardápio</h1><div className="sub">{prods.length} produtos</div></div>
        <button className="btn sm" onClick={() => setShow(true)}>+ Produto</button>
      </div>

      {err && <div className="error-msg">{err}</div>}

      <div className="card">
        <table>
          <thead><tr>
            <th>Foto</th><th>Produto</th><th>Categoria</th><th>NCM</th><th>CFOP</th>
            <th style={{ textAlign: 'right' }}>Preço</th><th></th>
          </tr></thead>
          <tbody>
            {prods.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="cd-thumb">
                    {p.image ? <img src={p.image} alt="" /> : <span>🍽️</span>}
                  </div>
                </td>
                <td><b>{p.name}</b><br /><span className="sub">{p.description || ''}</span></td>
                <td className="sub">{catName(p.category_id)}</td>
                <td className="sub" style={{ fontFamily: 'monospace' }}>{p.ncm}</td>
                <td className="sub" style={{ fontFamily: 'monospace' }}>{p.cfop}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand)' }}>{money(p.price)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn sm ghost" onClick={() => setFoto({ ...p })}>Foto</button>{' '}
                  <button className="btn sm ghost" onClick={() => setFiscal({ ...p })}>Fiscal</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Foto do prato (aparece no totem) */}
      {foto && (
        <div className="modal-bg" onClick={() => setFoto(null)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={saveFoto}>
            <h3 style={{ marginBottom: 2 }}>Foto do prato</h3>
            <div className="sub" style={{ marginBottom: 14 }}>{foto.name} · aparece no totem</div>

            <div className="cd-preview">
              {foto.image
                ? <img src={foto.image} alt="" onError={e => { e.target.style.display = 'none'; }} />
                : <span>🍽️</span>}
            </div>

            <div className="field">
              <label>Caminho da imagem</label>
              <input className="input" autoFocus value={foto.image || ''}
                onChange={e => setFoto({ ...foto, image: e.target.value })}
                placeholder="/produtos/picanha.jpg" />
            </div>
            <p className="hint" style={{ textAlign: 'left', marginTop: 0 }}>
              Coloque o arquivo em <b>client/public/produtos/</b> e informe o caminho
              começando com <b>/produtos/</b>. Foto <b>quadrada</b> fica melhor — o totem
              recorta em círculo. Deixe vazio para usar o ícone da categoria.<br /><br />
              ⚠️ Use fotos <b>dos seus pratos</b>: o cliente pede pela imagem.
            </p>
            <button className="btn">Salvar foto</button>
          </form>
        </div>
      )}

      {/* Dados fiscais do produto */}
      {fiscal && (
        <div className="modal-bg" onClick={() => setFiscal(null)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={saveFiscal}>
            <h3 style={{ marginBottom: 2 }}>Dados fiscais</h3>
            <div className="sub" style={{ marginBottom: 14 }}>{fiscal.name}</div>

            <div className="field">
              <label>NCM</label>
              <input className="input" required value={fiscal.ncm || ''}
                onChange={e => setFiscal({ ...fiscal, ncm: e.target.value })} maxLength={8} />
            </div>
            <div style={{ marginBottom: 14 }}>
              {NCM_SUGESTOES.map(s => (
                <button type="button" key={s.ncm}
                  className={'btn sm ' + (fiscal.ncm === s.ncm ? '' : 'ghost')}
                  style={{ marginRight: 6, marginBottom: 6 }}
                  onClick={() => setFiscal({ ...fiscal, ncm: s.ncm })}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="row">
              <div className="field"><label>CFOP</label>
                <input className="input" required value={fiscal.cfop || ''}
                  onChange={e => setFiscal({ ...fiscal, cfop: e.target.value })} maxLength={4} /></div>
              <div className="field"><label>CSOSN</label>
                <select className="input" value={fiscal.csosn || '102'}
                  onChange={e => setFiscal({ ...fiscal, csosn: e.target.value })}>
                  <option value="102">102 — Simples, sem crédito</option>
                  <option value="103">103 — Isenção do ICMS no Simples</option>
                  <option value="300">300 — Imune</option>
                  <option value="400">400 — Não tributada no Simples</option>
                  <option value="500">500 — ICMS cobrado por ST</option>
                </select></div>
            </div>
            <div className="row">
              <div className="field"><label>Origem</label>
                <select className="input" value={fiscal.origem || '0'}
                  onChange={e => setFiscal({ ...fiscal, origem: e.target.value })}>
                  <option value="0">0 — Nacional</option>
                  <option value="1">1 — Estrangeira (importação direta)</option>
                  <option value="2">2 — Estrangeira (mercado interno)</option>
                </select></div>
              <div className="field"><label>Unidade</label>
                <input className="input" value={fiscal.unidade || 'UN'}
                  onChange={e => setFiscal({ ...fiscal, unidade: e.target.value })} /></div>
              <div className="field"><label>CEST (se ST)</label>
                <input className="input" value={fiscal.cest || ''}
                  onChange={e => setFiscal({ ...fiscal, cest: e.target.value })} /></div>
            </div>

            <p className="hint" style={{ textAlign: 'left', marginTop: 0 }}>
              <b>CFOP 5102</b> = venda dentro do estado (o caso normal do restaurante).<br />
              Confirme o NCM com seu contador — NCM errado gera rejeição ou autuação.
            </p>
            <button className="btn">Salvar</button>
          </form>
        </div>
      )}

      {show && (
        <div className="modal-bg" onClick={() => setShow(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={save}>
            <h3>Novo produto</h3>
            <div className="field"><label>Nome</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="row">
              <div className="field"><label>Categoria</label>
                <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Selecione</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div className="field"><label>Preço</label>
                <input className="input" type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            </div>
            <div className="field"><label>Descrição</label>
              <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <button className="btn">Salvar produto</button>
          </form>
        </div>
      )}
    </>
  );
}
