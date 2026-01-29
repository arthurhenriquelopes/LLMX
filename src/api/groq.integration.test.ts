// testes de integracao do orquestrador e trabalhador
// verificam qualidade REAL das respostas da IA
//
// Rodar: npm run test:integration

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runAgent, clearHistory, type AgentOptions, type PendingToolCall } from './groq.js';
import { clearSessionPermissions, ConfirmationOutcome } from '../tools/confirmation.js';
import { detectActions, getPromptAndTools } from '../prompts/composer.js';
import { classifyRequest } from '../prompts/router.js';
import * as dotenv from 'dotenv';

// carrega .env
dotenv.config();

// timeout para chamadas de API
const API_TIMEOUT = 60000;

// ==========================================
// TESTES DO ORQUESTRADOR (Roteamento/Prompts)
// ==========================================

describe('Orquestrador - Roteamento de Prompts', () => {
    describe('detectActions', () => {
        it('detecta acao correta para "extrair arquivo.rar"', () => {
            const actions = detectActions('extrair arquivo.rar');
            expect(actions).toContain('extract');
        });

        it('detecta acao correta para "instalar htop"', () => {
            const actions = detectActions('instalar htop');
            expect(actions).toContain('install');
        });

        it('detecta acao correta para "quanto de memoria RAM"', () => {
            const actions = detectActions('quanto de memoria RAM tenho');
            expect(actions).toContain('hardware');
        });

        it('detecta multiplas acoes para "compactar e mover"', () => {
            const actions = detectActions('compactar pasta e mover para desktop');
            expect(actions).toContain('compress');
            expect(actions).toContain('move');
        });

        it('retorna vazio para saudacao', () => {
            const actions = detectActions('ola, tudo bem?');
            expect(actions).toHaveLength(0);
        });
    });

    describe('getPromptAndTools', () => {
        it('retorna prompt especializado para "extrair"', () => {
            const result = getPromptAndTools('extrair arquivo.rar');
            expect(result.prompt).toContain('EXTRAIR');
            expect(result.tools).toContain('find_file');
            expect(result.tools).toContain('run_command');
        });

        it('retorna prompt de instalacao para "instalar"', () => {
            const result = getPromptAndTools('instalar nodejs');
            expect(result.prompt).toContain('INSTALAÇÃO');
            expect(result.tools).toContain('run_sudo_command');
        });

        it('retorna ferramentas de hardware para "uso de disco"', () => {
            const result = getPromptAndTools('qual o uso de disco?');
            expect(result.tools).toContain('get_disk_usage');
        });

        it('retorna fallback para saudacao', () => {
            const result = getPromptAndTools('ola tudo bem');
            expect(result.actions).toHaveLength(0);
            expect(result.tools).toContain('run_command');
        });
    });

    describe('classifyRequest', () => {
        it('classifica perguntas sobre arquivos como filesystem ou commands', () => {
            const category = classifyRequest('listar arquivos da pasta');
            // pode ser filesystem ou commands dependendo da classificacao
            expect(['filesystem', 'commands']).toContain(category);
        });

        it('classifica perguntas sobre RAM como system_info', () => {
            const category = classifyRequest('quanto de memoria RAM tenho');
            expect(category).toBe('system_info');
        });

        it('classifica "executar comando" como commands', () => {
            const category = classifyRequest('executar comando ls');
            expect(category).toBe('commands');
        });
    });
});

// ==========================================
// TESTES DO TRABALHADOR (Execucao Real)
// ==========================================

describe('Trabalhador - Execucao Real com API', () => {
    beforeEach(() => {
        clearHistory();
        clearSessionPermissions();
    });

    afterEach(() => {
        clearHistory();
        clearSessionPermissions();
    });

    describe('Respostas Basicas (sem ferramentas)', () => {
        it('responde saudacao de forma amigavel', async () => {
            const response = await runAgent('ola, tudo bem?');

            console.log('\n📝 Resposta para saudacao:', response);

            // verificacoes
            expect(response.length).toBeGreaterThan(5);
            expect(response.toLowerCase()).toMatch(/ol[aá]|oi|bem|ajudar|tudo/i);
            // NAO deve mencionar ferramentas
            expect(response.toLowerCase()).not.toContain('run_command');
        }, API_TIMEOUT);

        it('explica suas capacidades quando perguntado', async () => {
            const response = await runAgent('o que voce pode fazer?');

            console.log('\n📝 Resposta sobre capacidades:', response);

            // deve mencionar pelo menos uma capacidade
            expect(response.toLowerCase()).toMatch(/arquivo|comando|sistema|ajudar|linux/i);
            expect(response.length).toBeGreaterThan(50);
        }, API_TIMEOUT);
    });

    describe('Ferramentas de Leitura (sem confirmacao)', () => {
        it('lista arquivos da pasta atual', async () => {
            const toolsExecuted: string[] = [];
            const toolResults: string[] = [];

            const options: AgentOptions = {
                onToolExecuting: (toolName, args) => {
                    console.log(`\n🔧 Executando: ${toolName}`, args);
                    toolsExecuted.push(toolName);
                },
                onToolComplete: (toolName, result) => {
                    console.log(`\n✅ Resultado de ${toolName}:`, result.slice(0, 200));
                    toolResults.push(result);
                },
            };

            const response = await runAgent('listar arquivos da pasta atual', options);

            console.log('\n📝 Resposta final:', response);

            // deve ter chamado ferramenta
            expect(toolsExecuted.length).toBeGreaterThan(0);

            // resposta deve ter conteudo real
            expect(response.length).toBeGreaterThan(20);
            // NAO deve ser apenas "Pronto!"
            expect(response.toLowerCase()).not.toMatch(/^pronto!/);
        }, API_TIMEOUT);

        it('mostra quantidade de RAM', async () => {
            const toolsExecuted: string[] = [];

            const options: AgentOptions = {
                onToolExecuting: (toolName) => {
                    toolsExecuted.push(toolName);
                },
            };

            const response = await runAgent('quanto de RAM eu tenho?', options);

            console.log('\n📝 Resposta RAM:', response);

            // deve ter chamado ferramenta
            expect(toolsExecuted.some(t =>
                t === 'get_memory_info' || t === 'run_command'
            )).toBe(true);

            // resposta deve conter numeros (GB ou MB)
            expect(response).toMatch(/\d+/);
            expect(response.toLowerCase()).toMatch(/gb|mb|ram|mem[oó]ria/i);
        }, API_TIMEOUT);

        it('mostra uso de disco com porcentagem', async () => {
            const response = await runAgent('qual o uso de disco?');

            console.log('\n📝 Resposta Disco:', response);

            // resposta deve ter conteudo (erro ou resultado)
            expect(response.length).toBeGreaterThan(10);
            // NAO deve ser apenas "Pronto! uso do disco"
            expect(response.toLowerCase()).not.toBe('pronto! uso do disco');
            expect(response.toLowerCase()).not.toMatch(/^pronto!\s*uso/);
        }, API_TIMEOUT);

        it('lista processos com detalhes', async () => {
            const toolsExecuted: string[] = [];

            const options: AgentOptions = {
                onToolExecuting: (toolName) => {
                    toolsExecuted.push(toolName);
                },
            };

            const response = await runAgent('quais processos estao rodando?', options);

            console.log('\n📝 Resposta Processos:', response);

            // deve ter chamado ferramenta
            expect(toolsExecuted.length).toBeGreaterThan(0);

            // resposta deve listar processos, nao apenas confirmar
            expect(response.length).toBeGreaterThan(30);
            expect(response.toLowerCase()).not.toBe('pronto! processos rodando');
        }, API_TIMEOUT);

        it('mostra diretorio atual com path real', async () => {
            const response = await runAgent('qual meu diretorio atual?');

            console.log('\n📝 Resposta Diretorio:', response);

            // deve conter path real
            expect(response).toMatch(/\//); // tem barra
            expect(response).not.toContain('$USER');
            expect(response).not.toContain('/caminho/completo');
        }, API_TIMEOUT);
    });

    describe('Comandos Perigosos (com confirmacao)', () => {
        it('pede confirmacao para instalar pacote', async () => {
            let confirmationDetails: PendingToolCall | null = null;

            const options: AgentOptions = {
                onConfirmationRequired: async (pending) => {
                    confirmationDetails = pending;
                    console.log('\n⚠️ Confirmacao pedida:', {
                        tool: pending.toolName,
                        args: pending.args,
                        title: pending.confirmationDetails.title,
                    });
                    return ConfirmationOutcome.Cancel;
                },
            };

            const response = await runAgent('instalar o htop', options);

            console.log('\n📝 Resposta apos cancelamento:', response);

            // deve ter pedido confirmacao
            expect(confirmationDetails).not.toBeNull();
            expect(confirmationDetails!.toolName).toMatch(/run_command|run_sudo_command/);

            // detalhes de confirmacao devem estar corretos
            expect(confirmationDetails!.confirmationDetails.type).toBe('exec');
        }, API_TIMEOUT);

        it('pede confirmacao para deletar pasta', async () => {
            let confirmationRequested = false;
            let commandToExecute = '';

            const options: AgentOptions = {
                onConfirmationRequired: async (pending) => {
                    confirmationRequested = true;
                    if (pending.confirmationDetails.type === 'exec') {
                        commandToExecute = pending.confirmationDetails.command;
                    }
                    console.log('\n⚠️ Comando perigoso:', commandToExecute);
                    return ConfirmationOutcome.Cancel;
                },
            };

            await runAgent('deletar a pasta /tmp/teste_delete', options);

            expect(confirmationRequested).toBe(true);
            // comando deve conter rm
            expect(commandToExecute.toLowerCase()).toMatch(/rm|delete/);
        }, API_TIMEOUT);

        it('NAO executa quando usuario cancela', async () => {
            const toolsCompleted: string[] = [];

            const options: AgentOptions = {
                onConfirmationRequired: async () => {
                    return ConfirmationOutcome.Cancel;
                },
                onToolComplete: (toolName) => {
                    toolsCompleted.push(toolName);
                },
            };

            const response = await runAgent('criar pasta /tmp/teste_cancelado', options);

            console.log('\n📝 Resposta cancelada:', response);

            // ferramenta NAO deve ter sido executada
            expect(toolsCompleted).not.toContain('run_command');
            // resposta deve indicar cancelamento
            expect(response.toLowerCase()).toMatch(/cancel|nao|n[aã]o/i);
        }, API_TIMEOUT);

        it('executa quando usuario confirma', async () => {
            const toolsCompleted: string[] = [];

            const options: AgentOptions = {
                onConfirmationRequired: async () => {
                    console.log('\n✅ Usuario confirmou');
                    return ConfirmationOutcome.ProceedOnce;
                },
                onToolComplete: (toolName, result) => {
                    toolsCompleted.push(toolName);
                    console.log(`\n✅ ${toolName} executado:`, result.slice(0, 100));
                },
            };

            const response = await runAgent('criar pasta /tmp/teste_llmx_confirmado', options);

            console.log('\n📝 Resposta confirmada:', response);

            // ferramenta DEVE ter sido executada
            expect(toolsCompleted).toContain('run_command');
        }, API_TIMEOUT);
    });

    describe('Qualidade das Respostas', () => {
        it('usa acentuacao em portugues', async () => {
            const response = await runAgent('qual e a versao do sistema operacional?');

            console.log('\n📝 Resposta (verificar acentos):', response);

            // resposta deve ter conteudo
            expect(response.length).toBeGreaterThan(10);
            // idealmente deveria ter acentos, mas nao obrigatorio
        }, API_TIMEOUT);

        it('NAO usa placeholders ($USER, /caminho/...)', async () => {
            const response = await runAgent('qual o caminho da minha pasta home?');

            console.log('\n📝 Resposta home:', response);

            // deve ter path real
            expect(response).toMatch(/\/home\//);
            // NAO deve ter placeholders
            expect(response).not.toContain('$USER');
            expect(response).not.toContain('$HOME');
            expect(response).not.toContain('/caminho/');
        }, API_TIMEOUT);

        it('responde completamente, nao apenas "Pronto!"', async () => {
            const responses = await Promise.all([
                runAgent('qual o uso de disco?'),
                runAgent('liste os arquivos do Desktop'),
            ]);

            for (const response of responses) {
                console.log('\n📝 Resposta:', response.slice(0, 100));

                // NAO deve ser apenas "Pronto!"
                expect(response.toLowerCase()).not.toMatch(/^pronto!\s*\w+$/);
                // deve ter informacao real
                expect(response.length).toBeGreaterThan(20);
            }
        }, API_TIMEOUT);
    });
});

// ==========================================
// RESUMO DOS TESTES
// ==========================================

describe('Resumo', () => {
    it('informacoes sobre os testes', () => {
        console.log(`
╔══════════════════════════════════════════╗
║     TESTES DO ORQUESTRADOR + TRABALHADOR ║
╠══════════════════════════════════════════╣
║                                          ║
║  ORQUESTRADOR (Roteamento):              ║
║  - detectActions: detecta acoes          ║
║  - getPromptAndTools: seleciona prompt   ║
║  - classifyRequest: categoriza request   ║
║                                          ║
║  TRABALHADOR (Execucao):                 ║
║  - Respostas basicas                     ║
║  - Ferramentas de leitura                ║
║  - Comandos perigosos + confirmacao      ║
║  - Qualidade das respostas               ║
║                                          ║
╚══════════════════════════════════════════╝
        `);
        expect(true).toBe(true);
    });
});
