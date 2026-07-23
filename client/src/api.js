const TOKEN_KEY = 'paladar_token';
const USER_KEY = 'paladar_user';

export const auth = {
  get token() { return localStorage.getItem(TOKEN_KEY); },
  get user() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } },
  set(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth.token ? { Authorization: 'Bearer ' + auth.token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { auth.clear(); location.hash = '#/login'; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export const money = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Custo unitário de insumo é por grama/ml e costuma ser fração de centavo
// (carvão = R$ 0,004/g). Com 2 casas viraria "R$ 0,00" e pareceria de graça.
export const moneyFine = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 3, maximumFractionDigits: 3,
  });

// O telefone é guardado só com dígitos; aqui volta a ficar legível para o atendente.
export const phoneFmt = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return p || '';
};

// Data de hoje no fuso local (YYYY-MM-DD). toISOString() devolveria a data UTC,
// que à noite já virou o dia seguinte e não bate com os registros do banco.
export const todayLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
