// eslint-disable-next-line @typescript-eslint/no-require-imports
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');
const express = require('express');
const cookieParser = require('cookie-parser');

const server = express();
let cachedNestApp;

async function bootstrapNestApp() {
  if (cachedNestApp) {
    return cachedNestApp;
  }

  // Dynamic import of AppModule to ensure decorators work
  const { AppModule } = require('../src/app.module');

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      const isAllowed = allowedOrigins.some(o => o === origin) ||
        origin.endsWith('.vercel.app') ||
        /\.vercel\.app$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  cachedNestApp = app;
  return app;
}

module.exports = async function handler(req, res) {
  try {
    await bootstrapNestApp();
    server(req, res);
  } catch (error) {
    console.error('NestJS bootstrap error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};
