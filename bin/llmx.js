#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// obtem o diretorio deste script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// encontra e carrega .env do diretorio de instalacao
const envPath = join(__dirname, '..', '.env');
config({ path: envPath });

// agora importa e roda o app
import('../dist/index.js');
