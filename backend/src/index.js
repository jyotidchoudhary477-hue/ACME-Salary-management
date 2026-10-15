import { config } from './config.js';
import { getDb } from './db/connection.js';
import { migrate } from './db/migrate.js';
import { ensureDemoUser } from './services/authService.js';
import { createApp } from './app.js';

const db = migrate(getDb());
ensureDemoUser(db);
const app = createApp(db);

const server = app.listen(config.port, config.host, () => {
  const count = db.prepare('SELECT COUNT(*) AS c FROM employees').get().c;
  console.log(
    `${config.appName} API listening on http://localhost:${config.port} [${config.env}] · ${count} employees · db=${config.dbPath}`
  );
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[startup] Port ${config.port} is already in use. Stop the other process (e.g. fuser -k ${config.port}/tcp) and restart.`
    );
    process.exit(1);
  }
  throw err;
});
