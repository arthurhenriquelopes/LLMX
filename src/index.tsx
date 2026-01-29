import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import dotenv from 'dotenv';

// limpa terminal antes de iniciar
process.stdout.write('\x1Bc');

// carrega variaveis de ambiente
dotenv.config();

// renderiza o app
render(<App />);
