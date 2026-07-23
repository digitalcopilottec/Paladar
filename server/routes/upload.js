import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRequired, requireRole } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const router = Router();
router.use(authRequired, requireRole('gerente'));

// Só imagens. Nada de SVG vindo de upload: SVG é executável no navegador
// (pode carregar script) e aqui ele seria servido no mesmo domínio do sistema.
const TIPOS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAX_BYTES = 8 * 1024 * 1024;

// Nome seguro: só o que a gente mesmo gera, sem nada vindo do cliente.
const NOMES = {
  logo: 'logo',
  fundo: 'totem-fundo',
};

router.post('/', (req, res) => {
  const { slot, data } = req.body || {};
  if (!NOMES[slot]) return res.status(400).json({ error: 'Destino inválido' });
  if (typeof data !== 'string') return res.status(400).json({ error: 'Arquivo ausente' });

  const m = /^data:([^;]+);base64,(.+)$/s.exec(data);
  if (!m) return res.status(400).json({ error: 'Formato inválido' });

  const [, mime, b64] = m;
  const ext = TIPOS[mime];
  if (!ext) return res.status(400).json({ error: 'Use PNG, JPG ou WEBP' });

  const buf = Buffer.from(b64, 'base64');
  if (buf.length > MAX_BYTES) return res.status(400).json({ error: 'Imagem maior que 8 MB' });
  if (buf.length < 100) return res.status(400).json({ error: 'Imagem vazia' });

  // Apaga versões antigas em outras extensões, senão sobra arquivo órfão.
  for (const e of Object.values(TIPOS)) {
    const antigo = path.join(UPLOADS_DIR, `${NOMES[slot]}.${e}`);
    if (fs.existsSync(antigo)) fs.unlinkSync(antigo);
  }

  const nome = `${NOMES[slot]}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, nome), buf);
  // ?v= força o navegador a largar a versão em cache.
  res.json({ url: `/uploads/${nome}?v=${Date.now()}`, bytes: buf.length });
});

// Diz o que já foi enviado, para as telas mostrarem o arquivo real.
export function getUploadedUrls() {
  const out = {};
  for (const [slot, base] of Object.entries(NOMES)) {
    out[slot] = null;
    for (const e of Object.values(TIPOS)) {
      const f = path.join(UPLOADS_DIR, `${base}.${e}`);
      if (fs.existsSync(f)) {
        out[slot] = `/uploads/${base}.${e}?v=${fs.statSync(f).mtimeMs}`;
        break;
      }
    }
  }
  return out;
}

router.get('/', (req, res) => res.json(getUploadedUrls()));

export default router;
