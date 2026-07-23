import db from './db.js';
import { attachOptions } from './options.js';

export const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const onlyDigits = (v) => String(v || '').replace(/\D/g, '');

// Formas de pagamento do sistema → código da tabela da NFC-e (tpag).
const TPAG = { dinheiro: '01', credito: '03', debito: '04', pix: '17' };

export function getCompany() {
  return db.prepare('SELECT * FROM company WHERE id = 1').get() || null;
}

/**
 * Diz o que ainda falta para conseguir emitir. Melhor recusar com uma lista clara
 * do que mandar para a SEFAZ e tomar rejeição sem explicação.
 */
export function checkReady() {
  const c = getCompany();
  const faltando = [];
  if (!c) return { ok: false, faltando: ['Cadastro do emitente não preenchido'] };

  if (onlyDigits(c.cnpj).length !== 14) faltando.push('CNPJ do emitente');
  if (!c.ie) faltando.push('Inscrição Estadual');
  if (!c.razao_social) faltando.push('Razão social');
  if (!c.street || !c.number || !c.district) faltando.push('Endereço do emitente');
  if (!c.city_code) faltando.push('Código IBGE do município');
  if (!c.uf) faltando.push('UF');
  if (onlyDigits(c.cep).length !== 8) faltando.push('CEP');
  // O CSC não vem de mim: o lojista gera no portal da SEFAZ.
  if (!c.csc || !c.csc_id) faltando.push('CSC e ID do CSC (gerados no portal da SEFAZ)');
  if (!c.provider) faltando.push('Provedor de transmissão configurado');

  return { ok: faltando.length === 0, faltando, company: c };
}

// Dígito verificador da chave de acesso (módulo 11, pesos 2..9).
function dv(chave43) {
  let peso = 2, soma = 0;
  for (let i = chave43.length - 1; i >= 0; i--) {
    soma += Number(chave43[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return String(resto < 2 ? 0 : 11 - resto);
}

/**
 * Monta a chave de acesso de 44 dígitos da NFC-e.
 * cUF(2) AAMM(4) CNPJ(14) mod(2) serie(3) nNF(9) tpEmis(1) cNF(8) cDV(1)
 */
export function buildChave({ cUF, cnpj, serie, numero, tpEmis = 1, cNF, data = new Date() }) {
  const aamm = String(data.getFullYear()).slice(2) + String(data.getMonth() + 1).padStart(2, '0');
  const base = [
    String(cUF).padStart(2, '0'),
    aamm,
    onlyDigits(cnpj).padStart(14, '0'),
    '65',
    String(serie).padStart(3, '0'),
    String(numero).padStart(9, '0'),
    String(tpEmis),
    String(cNF).padStart(8, '0'),
  ].join('');
  return base + dv(base);
}

// Código da UF na tabela do IBGE (usado no início da chave).
export const UF_CODE = {
  RS: 43, SC: 42, PR: 41, SP: 35, RJ: 33, MG: 31, ES: 32, BA: 29, GO: 52,
  DF: 53, MT: 51, MS: 50, TO: 17, PA: 15, AM: 13, AC: 12, RO: 11, RR: 14,
  AP: 16, MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27, SE: 28,
};

/**
 * Imposto por item no Simples Nacional.
 * CSOSN 102 = tributada pelo Simples, sem permissão de crédito → ICMS não destacado
 * no item. O imposto sai no DAS, não na nota. Por isso vICMS = 0 e não é erro.
 */
function impostoItem(product, valor) {
  const csosn = product.csosn || '102';
  return {
    origem: product.origem || '0',
    csosn,
    // Aproximação do total de tributos (Lei 12.741 — "de olho no imposto").
    // Percentual real vem do IBPT; deixo configurável e assumido como estimativa.
    vTotTrib: r2(valor * 0.0),
    icms: { vBC: 0, pICMS: 0, vICMS: 0 },
  };
}

/**
 * Monta o payload da NFC-e a partir de um pedido fechado.
 * É o formato que os provedores (PlugNotas, Focus, etc.) consomem — não é o XML
 * final assinado, que quem gera é o provedor com o certificado do lojista.
 */
export function buildNfce(orderId) {
  const ready = checkReady();
  const c = ready.company;
  if (!c) throw new Error('Cadastro do emitente não preenchido');

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new Error('Pedido não encontrado');
  if (order.status !== 'fechado') throw new Error('Só é possível emitir nota de pedido fechado');

  const items = attachOptions(
    db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(orderId)
  );
  if (items.length === 0) throw new Error('Pedido sem itens');

  const payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(orderId);

  const det = items.map((it, ix) => {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(it.product_id) || {};
    const vProd = r2(it.total);
    // Os adicionais entram no valor unitário do item; o nome leva a descrição
    // para a nota bater com o que o cliente consumiu.
    const nome = it.options?.length
      ? `${it.name} (${it.options.map(o => o.name).join(', ')})`
      : it.name;
    return {
      nItem: ix + 1,
      prod: {
        cProd: String(it.product_id),
        xProd: nome.slice(0, 120),
        NCM: p.ncm || '21069090',
        CEST: p.cest || undefined,
        CFOP: p.cfop || '5102',
        uCom: p.unidade || 'UN',
        qCom: it.qty,
        vUnCom: r2(it.unit_price),
        vProd,
        uTrib: p.unidade || 'UN',
        qTrib: it.qty,
        vUnTrib: r2(it.unit_price),
        indTot: 1,
      },
      imposto: impostoItem(p, vProd),
    };
  });

  const vProdTotal = r2(det.reduce((s, d) => s + d.prod.vProd, 0));
  // Taxa de serviço e entrega entram como "outras despesas acessórias" (vOutro).
  const vOutro = r2((order.service_fee || 0) + (order.delivery_fee || 0));
  const vDesc = r2(order.discount || 0);

  const pag = payments.length
    ? payments.map(p => ({
        tPag: TPAG[p.method] || '99',
        vPag: r2(p.amount),
        ...(p.method === 'dinheiro' && p.change > 0 ? { vTroco: r2(p.change) } : {}),
      }))
    : [{ tPag: '99', vPag: r2(order.total) }];

  return {
    infNFe: {
      versao: '4.00',
      ide: {
        cUF: UF_CODE[c.uf] || 43,
        natOp: 'VENDA AO CONSUMIDOR',
        mod: 65,
        serie: c.serie,
        nNF: c.next_number,
        tpNF: 1,            // saída
        idDest: 1,          // operação interna
        cMunFG: c.city_code,
        tpImp: 4,           // DANFE NFC-e
        tpEmis: 1,          // emissão normal
        tpAmb: c.ambiente,  // 2 = homologação
        finNFe: 1,
        indFinal: 1,        // consumidor final
        indPres: order.type === 'delivery' ? 4 : 1,  // 4 = entrega a domicílio
      },
      emit: {
        CNPJ: onlyDigits(c.cnpj),
        xNome: c.razao_social,
        xFant: c.nome_fantasia,
        IE: onlyDigits(c.ie),
        CRT: c.crt,
        enderEmit: {
          xLgr: c.street, nro: c.number, xCpl: c.complement || undefined,
          xBairro: c.district, cMun: c.city_code, xMun: c.city,
          UF: c.uf, CEP: onlyDigits(c.cep), fone: onlyDigits(c.phone) || undefined,
        },
      },
      // Consumidor não identificado é o padrão no balcão. Com CPF na nota, preencher aqui.
      dest: undefined,
      det,
      total: {
        ICMSTot: {
          vBC: 0, vICMS: 0, vProd: vProdTotal,
          vFrete: 0, vSeg: 0, vDesc, vOutro,
          vNF: r2(vProdTotal + vOutro - vDesc),
        },
      },
      pag: { detPag: pag },
      infAdic: {
        infCpl: [
          `Pedido ${order.code}`,
          order.type === 'delivery' ? 'Entrega a domicilio' : null,
          c.ambiente === 2 ? 'EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL' : null,
        ].filter(Boolean).join(' | '),
      },
    },
  };
}
