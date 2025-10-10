
import http from 'node:http';
import { app } from './app';
import { connectDB, closeDB } from './db/connect';
import { env } from './config/env';

let server: http.Server;

async function start() {
  try {
    await connectDB();
    server = app.listen(env.PORT, () => {
      console.log(`✅ API listening on :${env.PORT} (${env.NODE_ENV})`);
    });
    server.headersTimeout = 65_000; // default 60_000 + a bit
    server.keepAliveTimeout = 60_000; // match reverse proxy if any
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  console.log(`\n↩️  Received ${signal}, shutting down...`);
  try {
    // stop accepting new connections
    await new Promise<void>((resolve) => server?.close(() => resolve()));
    await closeDB();
    console.log('✅ Clean shutdown completed');
    process.exit(0);
  } catch (err) {
    console.error('⚠️ Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
