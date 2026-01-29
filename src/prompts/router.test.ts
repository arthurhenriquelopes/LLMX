// testes unitarios para o router de prompts

import { describe, it, expect } from 'vitest';
import { classifyRequest, getPromptForRequest, type Category } from './router.js';

describe('classifyRequest', () => {
    describe('filesystem category', () => {
        it('classifica "ver pasta de downloads" como filesystem', () => {
            expect(classifyRequest('ver pasta de downloads')).toBe('filesystem');
        });

        it('classifica "ls no diretorio atual" como filesystem', () => {
            expect(classifyRequest('ls no diretorio atual')).toBe('filesystem');
        });

        it('classifica "buscar arquivo readme" como filesystem', () => {
            expect(classifyRequest('buscar arquivo readme')).toBe('filesystem');
        });

        it('classifica "onde esta o executavel node" como filesystem (priority)', () => {
            expect(classifyRequest('onde esta o executavel node')).toBe('filesystem');
        });

        it('classifica "qual o caminho do python" como filesystem (priority)', () => {
            expect(classifyRequest('qual o caminho do python')).toBe('filesystem');
        });
    });

    describe('system_info category', () => {
        it('classifica "uso de memoria RAM" como system_info', () => {
            expect(classifyRequest('uso de memoria RAM')).toBe('system_info');
        });

        it('classifica "espaco em disco" como system_info', () => {
            expect(classifyRequest('espaco em disco')).toBe('system_info');
        });

        it('classifica "quais processos estao rodando" como system_info', () => {
            expect(classifyRequest('quais processos estao rodando')).toBe('system_info');
        });

        it('classifica "versao do kernel" como system_info', () => {
            expect(classifyRequest('versao do kernel')).toBe('system_info');
        });
    });

    describe('commands category', () => {
        it('classifica "compactar pasta em rar" como commands (priority)', () => {
            expect(classifyRequest('compactar pasta em rar')).toBe('commands');
        });

        it('classifica "copiar arquivo para desktop" como commands (priority)', () => {
            expect(classifyRequest('copiar arquivo para desktop')).toBe('commands');
        });

        it('classifica "instalar nodejs" como commands (priority)', () => {
            expect(classifyRequest('instalar nodejs')).toBe('commands');
        });

        it('classifica "deletar pasta tmp" como commands (priority)', () => {
            expect(classifyRequest('deletar pasta tmp')).toBe('commands');
        });

        it('classifica "renomear arquivo" como commands (priority)', () => {
            expect(classifyRequest('renomear arquivo')).toBe('commands');
        });

        it('classifica "criar pasta nova" como commands (priority)', () => {
            expect(classifyRequest('criar pasta nova')).toBe('commands');
        });
    });

    describe('scripts category', () => {
        it('classifica "criar script de backup" como scripts (priority)', () => {
            expect(classifyRequest('criar script de backup')).toBe('scripts');
        });

        it('classifica "automatizar limpeza" como scripts (priority)', () => {
            expect(classifyRequest('automatizar limpeza')).toBe('scripts');
        });

        it('classifica "agendar cronjob" como scripts', () => {
            expect(classifyRequest('agendar cronjob')).toBe('scripts');
        });
    });

    describe('general category', () => {
        it('classifica "ola tudo bem" como general', () => {
            expect(classifyRequest('ola tudo bem')).toBe('general');
        });

        it('classifica "me ajuda com algo" como general', () => {
            expect(classifyRequest('me ajuda com algo')).toBe('general');
        });

        it('classifica mensagem vazia como general', () => {
            expect(classifyRequest('')).toBe('general');
        });
    });

    describe('priority keywords override normal scoring', () => {
        it('compactar tem prioridade sobre filesystem keywords', () => {
            // "compactar pasta" contem "pasta" (filesystem) mas "compactar" (commands priority)
            expect(classifyRequest('compactar pasta de arquivos')).toBe('commands');
        });

        it('automatizar tem prioridade de script', () => {
            // "automatizar" e priority de scripts
            expect(classifyRequest('automatizar limpeza de arquivos')).toBe('scripts');
        });
    });
});

describe('getPromptForRequest', () => {
    it('retorna categoria e prompt para filesystem', () => {
        const result = getPromptForRequest('ver pasta de downloads');
        expect(result.category).toBe('filesystem');
        expect(result.prompt).toBeDefined();
        expect(result.prompt.length).toBeGreaterThan(0);
    });

    it('retorna categoria e prompt para general', () => {
        const result = getPromptForRequest('ola');
        expect(result.category).toBe('general');
        expect(result.prompt).toBeDefined();
    });
});
