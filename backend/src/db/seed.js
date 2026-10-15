
import { fileURLToPath } from 'url';
import { seed } from './seed/index.js';

export { seed } from './seed/index.js';

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  const result = seed();
  console.log(`Seeded ${result.count} employees in ${result.elapsedMs}ms → ${result.dbPath}`);
}
