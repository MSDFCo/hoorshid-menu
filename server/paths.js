// Central path resolution — everything is relative to the project root,
// so scripts behave the same whether started from the root or from server/.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(SERVER_DIR, '..');
export const DATA_DIR = path.join(ROOT, 'data');
export const UPLOADS_DIR = path.join(ROOT, 'uploads');
export const SEED_FILE = path.join(ROOT, 'seed', 'menu.json');
export const CLIENT_DIST = path.join(ROOT, 'client', 'dist');
export const ENV_FILE = path.join(ROOT, '.env');
export const DB_FILE = path.join(DATA_DIR, 'hoorshid.sqlite');
