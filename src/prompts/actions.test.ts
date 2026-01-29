// testes unitarios para as definicoes de acoes

import { describe, it, expect } from 'vitest';
import { ACTIONS, type Action } from './actions.js';

describe('ACTIONS definitions', () => {
    const expectedActions = [
        'extract',
        'compress',
        'copy',
        'move',
        'rename',
        'delete',
        'create_dir',
        'install',
        'script',
        'query',
        'hardware',
    ];

    it('contem todas as acoes esperadas', () => {
        for (const action of expectedActions) {
            expect(ACTIONS).toHaveProperty(action);
        }
    });

    describe.each(expectedActions)('action %s', (actionName) => {
        const action = ACTIONS[actionName] as Action;

        it('tem prompt definido', () => {
            expect(action.prompt).toBeDefined();
            expect(action.prompt.length).toBeGreaterThan(0);
        });

        it('tem tools definidos', () => {
            expect(action.tools).toBeDefined();
            expect(Array.isArray(action.tools)).toBe(true);
            expect(action.tools.length).toBeGreaterThan(0);
        });

        it('tem keywords definidas', () => {
            expect(action.keywords).toBeDefined();
            expect(Array.isArray(action.keywords)).toBe(true);
            expect(action.keywords.length).toBeGreaterThan(0);
        });

        it('keywords sao todas lowercase', () => {
            for (const keyword of action.keywords) {
                expect(keyword).toBe(keyword.toLowerCase());
            }
        });
    });
});

describe('action tool mappings', () => {
    it('extract usa find_file e run_command', () => {
        expect(ACTIONS.extract.tools).toContain('find_file');
        expect(ACTIONS.extract.tools).toContain('run_command');
    });

    it('install usa run_sudo_command', () => {
        expect(ACTIONS.install.tools).toContain('run_sudo_command');
    });

    it('script usa create_script e run_script', () => {
        expect(ACTIONS.script.tools).toContain('create_script');
        expect(ACTIONS.script.tools).toContain('run_script');
    });

    it('hardware usa get_memory_info e get_disk_usage', () => {
        expect(ACTIONS.hardware.tools).toContain('get_memory_info');
        expect(ACTIONS.hardware.tools).toContain('get_disk_usage');
    });

    it('query usa get_package_info e list_processes', () => {
        expect(ACTIONS.query.tools).toContain('get_package_info');
        expect(ACTIONS.query.tools).toContain('list_processes');
    });
});
