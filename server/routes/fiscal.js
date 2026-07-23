import { Router } from 'express';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';
import { buildNfce, buildChave, checkReady, getCompany, UF_CODE, r2 } from '../fiscal.js';

const router = Router();
router.use(authRequired);

/**
 * Transmissão para a SEFAZ.
 *
 * Hoje NÃO transmite: exige certificado digital do lojista e um provedor
 * (PlugNotas / Focus NFe / WebmaniaBR / Tecnospeed) que assine e envie o XML.
 * Este é o ponto ÚNICO a implementar quando o certificado e o CSC existirem —
 * o resto do sistema (payload, chave, ciclo da nota) já está pronto.
 *
 * Não simule autorização aqui. Uma nota "autorizada" que a SEFAZ nunca viu é
 * pior que nota nenhuma: o lojista acha que está regular e não está.
 */
async function transmit(/* payload, company */) {
  return {
    ok: false,
    status: 'pendente',
    motivo: 'Transmissão não configurada — falta certificado digital e provedor. '
          + 'A nota foi gerada e guardada, pronta para transmitir.',
  };
}

// --- Emitente --------------------------------------------------
router.get('/company', requireRole('gerente'), (req, res) => {
  const c = getCompany();
  if (!c) return res.json(null);
  // Nunca devolve o CSC inteiro: é segredo. Só diz se está preenchido.
  const { csc, ...rest } = c;
  res.json({ ...rest, csc_preenchido: !!csc });
});

router.put('/company', requireRole('gerente'), (req, res) => {
  const b = req.body || {};
  const cur = getCompany();
  const campos = [
    'razao_social', 'nome_fantasia', 'cnpj', 'ie', 'im', 'crt', 'street', 'number',
    'complement', 'district', 'city', 'city_code', 'uf', 'cep', 'phone',
    'csc_id', 'serie', 'ambiente', 'provider',
  ];
  const val = (k) => (b[k] !== undefined ? b[k] : cur?.[k] ?? null);

  if (!cur) {
    db.prepare(`INSERT INTO company (id) VALUES (1)`).run();
  }
  db.prepare(
    `UPDATE company SET ${campos.map(c => `${c}=?`).join(', ')},
            updated_at = datetime('now','localtime') WHERE id = 1`
  ).run(...campos.map(val));

  // CSC só é gravado se vier preenchido — assim salvar o form não apaga o segredo.
  if (b.csc) db.prepare('UPDATE company SET csc = ? WHERE id = 1').run(b.csc);

  const { csc, ...rest } = getCompany();
  res.json({ ...rest, csc_preenchido: !!csc });
});

// O que falta para emitir
router.get('/status', requireRole('gerente', 'caixa'), (req, res) => {
  const r = checkReady();
  res.json({ ok: r.ok, faltando: r.faltando, ambiente: r.company?.ambiente ?? 2 });
});

// --- Notas -----------------------------------------------------
router.get('/docs', requireRole('gerente', 'caixa'), (req, res) => {
  const rows = db.prepare(
    `SELECT f.id, f.order_id, f.serie, f.numero, f.chave, f.status, f.ambiente,
            f.motivo, f.valor_total, f.emitted_at, o.code AS order_code, u.name AS user_name
       FROM fiscal_docs f
       JOIN orders o ON o.id = f.order_id
       LEFT JOIN users u ON u.id = f.user_id
      ORDER BY f.id DESC LIMIT 200`
  ).all();
  res.json(rows);
});

router.get('/docs/:id', requireRole('gerente', 'caixa'), (req, res) => {
  const d = db.prepare('SELECT * FROM fiscal_docs WHERE id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'Nota não encontrada' });
  res.json(d);
});

// Emite a NFC-e de um pedido fechado.
router.post('/emit/:orderId', requireRole('gerente', 'caixa'), async (req, res) => {
  const orderId = req.params.orderId;

  const existente = db.prepare(
    `SELECT * FROM fiscal_docs WHERE order_id = ? AND status != 'cancelada'`
  ).get(orderId);
  if (existente) {
    return res.status(400).json({ error: `Este pedido já tem nota (${existente.status})`, doc: existente });
  }

  const ready = checkReady();
  let payload;
  try { payload = buildNfce(orderId); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  const c = ready.company;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  // Numeração e chave são reservadas na transação, para dois caixas não pegarem o mesmo número.
  const reservar = db.transaction(() => {
    const comp = getCompany();
    const numero = comp.next_number;
    const cNF = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    const chave = buildChave({
      cUF: UF_CODE[comp.uf] || 43, cnpj: comp.cnpj, serie: comp.serie,
      numero, cNF,
    });
    db.prepare('UPDATE company SET next_number = next_number + 1 WHERE id = 1').run();
    return { numero, chave, serie: comp.serie, ambiente: comp.ambiente };
  });

  const { numero, chave, serie, ambiente } = reservar();
  payload.infNFe.ide.nNF = numero;
  payload.infNFe.ide.cNF = chave.slice(35, 43);

  const envio = await transmit(payload, c);

  const info = db.prepare(
    `INSERT INTO fiscal_docs (order_id, serie, numero, chave, status, ambiente,
                              motivo, payload, valor_total, user_id)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(orderId, serie, numero, chave, envio.status, ambiente,
        envio.motivo || null, JSON.stringify(payload, null, 2), r2(order.total), req.user.id);

  const doc = db.prepare('SELECT * FROM fiscal_docs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ doc, pronto: ready.ok, faltando: ready.faltando });
});

// Cancelamento: a SEFAZ exige justificativa de 15+ caracteres e prazo (30 min na NFC-e).
router.post('/docs/:id/cancel', requireRole('gerente'), (req, res) => {
  const d = db.prepare('SELECT * FROM fiscal_docs WHERE id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'Nota não encontrada' });
  const motivo = String(req.body?.motivo || '').trim();
  if (motivo.length < 15)
    return res.status(400).json({ error: 'A SEFAZ exige justificativa de no mínimo 15 caracteres' });
  if (d.status === 'cancelada') return res.status(400).json({ error: 'Nota já cancelada' });

  // Nota autorizada só é cancelada de verdade junto à SEFAZ — o registro local
  // sozinho não cancela nada. Por isso o aviso fica explícito no motivo.
  const nota = d.status === 'autorizada'
    ? `${motivo} [ATENÇÃO: cancelamento local; falta transmitir à SEFAZ]`
    : motivo;
  db.prepare(`UPDATE fiscal_docs SET status='cancelada', motivo=? WHERE id=?`).run(nota, d.id);
  res.json(db.prepare('SELECT * FROM fiscal_docs WHERE id = ?').get(d.id));
});

export default router;
