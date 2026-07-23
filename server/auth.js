import jwt from 'jsonwebtoken';

const SECRET = process.env.PALADAR_SECRET || 'paladar-dev-secret-troque-em-producao';
const EXPIRES = '12h';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, username: user.username, role: user.role },
    SECRET,
    { expiresIn: EXPIRES }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada' });
  }
}

// Restringe rota a papéis específicos. Admin sempre passa.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    if (req.user.role === 'admin' || roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Acesso negado para o seu perfil' });
  };
}
