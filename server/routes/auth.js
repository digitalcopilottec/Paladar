import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, authRequired } from '../auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Informe usuário e senha' });
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(String(username).trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }
  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role } });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

export default router;
