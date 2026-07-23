import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authRequired, requireRole } from '../auth.js';

const router = Router();
router.use(authRequired, requireRole('gerente'));

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT id, name, username, email, role, active, created_at FROM users ORDER BY name').all());
});

router.post('/', (req, res) => {
  const { name, username, email = '', password, role = 'garcom', pin = null } = req.body || {};
  if (!name || !username || !password) return res.status(400).json({ error: 'Nome, usuário e senha são obrigatórios' });
  const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
  if (exists) return res.status(400).json({ error: 'Usuário já existe' });
  const info = db.prepare(
    `INSERT INTO users (name, username, email, password_hash, role, pin) VALUES (?,?,?,?,?,?)`
  ).run(name, username, email, bcrypt.hashSync(password, 10), role, pin);
  res.status(201).json(db.prepare('SELECT id, name, username, email, role, active FROM users WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Usuário não encontrado' });
  const { name, email, role, active, password } = req.body || {};
  db.prepare('UPDATE users SET name=?, email=?, role=?, active=? WHERE id=?')
    .run(name ?? u.name, email ?? u.email, role ?? u.role, active ?? u.active, u.id);
  if (password) db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), u.id);
  res.json(db.prepare('SELECT id, name, username, email, role, active FROM users WHERE id = ?').get(u.id));
});

export default router;
