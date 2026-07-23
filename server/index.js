import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import orderRoutes from './routes/orders.js';
import tableRoutes from './routes/tables.js';
import cashRoutes from './routes/cash.js';
import financialRoutes from './routes/financial.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import publicRoutes from './routes/public.js';
import kitchenRoutes from './routes/kitchen.js';
import stockRoutes from './routes/stock.js';
import deliveryRoutes from './routes/delivery.js';
import fiscalRoutes from './routes/fiscal.js';
import buffetRoutes, { publicDisplay } from './routes/buffet.js';
import uploadRoutes, { UPLOADS_DIR } from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Limite alto: as imagens sobem em base64 dentro do JSON.
app.use(express.json({ limit: '12mb' }));

// Arquivos enviados pelo lojista (logo, arte do totem).
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'Paladar API' }));
app.use('/api/public', publicRoutes);
app.use('/api/public', publicDisplay);
app.use('/api/buffet', buffetRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/fiscal', fiscalRoutes);
app.use('/api/users', userRoutes);

// Front-end compilado (produção)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Rota não encontrada' });
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🍽️  Paladar rodando em http://localhost:${PORT}`);
});
