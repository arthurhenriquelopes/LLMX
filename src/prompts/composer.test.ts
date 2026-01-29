// testes unitarios para o composer de prompts

import { describe, it, expect, beforeEach } from 'vitest';
import { detectActions, composePrompt, getPromptAndTools } from './composer.js';

describe('detectActions', () => {
    describe('single action detection', () => {
        it('detecta acao extract para "extrair arquivo.rar"', () => {
            const actions = detectActions('extrair arquivo.rar');
            expect(actions).toContain('extract');
        });

        it('detecta acao compress para "compactar pasta"', () => {
            const actions = detectActions('compactar pasta');
            expect(actions).toContain('compress');
        });

        it('detecta acao copy para "copiar arquivo"', () => {
            const actions = detectActions('copiar arquivo');
            expect(actions).toContain('copy');
        });

        it('detecta acao move para "mover arquivo"', () => {
            const actions = detectActions('mover arquivo');
            expect(actions).toContain('move');
        });

        it('detecta acao rename para "renomear arquivo"', () => {
            const actions = detectActions('renomear arquivo');
            expect(actions).toContain('rename');
        });

        it('detecta acao delete para "deletar arquivo"', () => {
            const actions = detectActions('deletar arquivo');
            expect(actions).toContain('delete');
        });

        it('detecta acao create_dir para "criar pasta"', () => {
            const actions = detectActions('criar pasta nova');
            expect(actions).toContain('create_dir');
        });

        it('detecta acao install para "instalar pacote"', () => {
            const actions = detectActions('instalar nodejs');
            expect(actions).toContain('install');
        });

        it('detecta acao script para "criar script"', () => {
            const actions = detectActions('criar script de backup');
            expect(actions).toContain('script');
        });

        it('detecta acao query para "versao instalada"', () => {
            const actions = detectActions('qual versao do python instalado');
            expect(actions).toContain('query');
        });

        it('detecta acao hardware para "uso de memoria"', () => {
            const actions = detectActions('quanto de memoria RAM tenho');
            expect(actions).toContain('hardware');
        });
    });

    describe('multiple action detection', () => {
        it('detecta compress e move para "compactar e mover"', () => {
            const actions = detectActions('compactar pasta e mover para desktop');
            expect(actions).toContain('compress');
            expect(actions).toContain('move');
            expect(actions.length).toBe(2);
        });

        it('detecta copy e rename para "copiar e renomear"', () => {
            const actions = detectActions('copiar arquivo e renomear para novo nome');
            expect(actions).toContain('copy');
            expect(actions).toContain('rename');
        });

        it('detecta extract e delete para "extrair e deletar original"', () => {
            const actions = detectActions('extrair rar e deletar o arquivo original');
            expect(actions).toContain('extract');
            expect(actions).toContain('delete');
        });
    });

    describe('no action detection', () => {
        it('retorna array vazio para "ola tudo bem"', () => {
            const actions = detectActions('ola tudo bem');
            expect(actions).toHaveLength(0);
        });

        it('retorna array vazio para mensagem vazia', () => {
            const actions = detectActions('');
            expect(actions).toHaveLength(0);
        });
    });
});

describe('composePrompt', () => {
    it('retorna prompt e tools para acao extract', () => {
        const result = composePrompt(['extract']);
        expect(result.prompt).toContain('EXTRAIR');
        expect(result.tools).toContain('find_file');
        expect(result.tools).toContain('run_command');
    });

    it('retorna prompt e tools para acao install', () => {
        const result = composePrompt(['install']);
        expect(result.prompt).toContain('INSTALAÇÃO');
        expect(result.tools).toContain('run_sudo_command');
        expect(result.tools).toContain('get_package_info');
    });

    it('combina prompts para multiplas acoes', () => {
        const result = composePrompt(['compress', 'move']);
        expect(result.prompt).toContain('COMPACTAR');
        expect(result.prompt).toContain('MOVER');
        expect(result.tools).toContain('run_command');
        expect(result.tools).toContain('find_file');
    });

    it('sempre inclui list_directory como tool basica', () => {
        const result = composePrompt(['extract']);
        expect(result.tools).toContain('list_directory');
    });

    it('usa cache para mesmas acoes', () => {
        const result1 = composePrompt(['extract', 'move']);
        const result2 = composePrompt(['move', 'extract']); // ordem diferente, mas mesmo cache key
        expect(result1.prompt).toBe(result2.prompt);
    });
});

describe('getPromptAndTools', () => {
    it('retorna prompt, tools e actions para mensagem com acao', () => {
        const result = getPromptAndTools('extrair arquivo.rar');
        expect(result.actions).toContain('extract');
        expect(result.prompt).toContain('EXTRAIR');
        expect(result.tools.length).toBeGreaterThan(0);
    });

    it('retorna fallback para mensagem sem acao', () => {
        const result = getPromptAndTools('ola tudo bem');
        expect(result.actions).toHaveLength(0);
        expect(result.tools).toContain('run_command');
        expect(result.tools).toContain('find_file');
        expect(result.tools).toContain('list_directory');
    });

    it('detecta e compoe multiplas acoes', () => {
        const result = getPromptAndTools('compactar pasta e mover para desktop');
        expect(result.actions).toContain('compress');
        expect(result.actions).toContain('move');
        expect(result.prompt).toContain('COMPACTAR');
        expect(result.prompt).toContain('MOVER');
    });
});
