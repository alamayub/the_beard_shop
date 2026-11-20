import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import authRoutes from './server/src/routes/authRoutes.ts';
import publicRoutes from './server/src/routes/publicRoutes.ts';
import adminRoutes from './server/src/routes/adminRoutes.ts';
import { renderDetailMetaHtml } from './server/src/services/seoMeta.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '4mb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a few minutes.' },
  });

  app.use('/api', apiLimiter);

  // API routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timezone: 'Asia/Kathmandu' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', publicRoutes);
  app.use('/api/admin', adminRoutes);

  // Global API error middleware
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (req.path.startsWith('/api')) {
        console.error('API Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      return next(err);
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.get(['/services/:slug', '/blog/:slug'], async (req, res, next) => {
      try {
        const template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const injected = await renderDetailMetaHtml(template, req);
        if (!injected) return next();
        const html = await vite.transformIndexHtml(req.originalUrl, injected);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(html);
      } catch (err) {
        console.warn('Dev SEO meta injection fallback:', err);
        next();
      }
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    const prodTemplate = fs.existsSync(path.join(distDir, 'index.html'))
      ? fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8')
      : '';

    app.use(express.static(distDir));

    app.get(['/services/:slug', '/blog/:slug'], async (req, res) => {
      try {
        const injected = prodTemplate ? await renderDetailMetaHtml(prodTemplate, req) : null;
        if (injected) {
          return res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(injected);
        }
      } catch (err) {
        console.warn('Prod SEO meta injection fallback:', err);
      }
      return res.sendFile(path.join(distDir, 'index.html'));
    });

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Salon server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
