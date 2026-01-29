// testes unitarios para o sistema de confirmacao (orquestrador)

import { describe, it, expect, beforeEach } from 'vitest';
import {
    ConfirmationOutcome,
    getToolPolicy,
    createConfirmationDetails,
    allowToolForSession,
    allowCommandForSession,
    clearSessionPermissions,
} from './confirmation.js';

describe('Policy Engine (getToolPolicy)', () => {
    beforeEach(() => {
        // limpa permissoes entre testes
        clearSessionPermissions();
    });

    describe('ferramentas de leitura', () => {
        it('permite list_directory sem confirmacao', () => {
            const policy = getToolPolicy('list_directory', {});
            expect(policy).toBe('ALLOW');
        });

        it('permite find_file sem confirmacao', () => {
            const policy = getToolPolicy('find_file', { pattern: '*.txt' });
            expect(policy).toBe('ALLOW');
        });

        it('permite read_file sem confirmacao', () => {
            const policy = getToolPolicy('read_file', { path: '/home/test.txt' });
            expect(policy).toBe('ALLOW');
        });

        it('permite get_memory_info sem confirmacao', () => {
            const policy = getToolPolicy('get_memory_info', {});
            expect(policy).toBe('ALLOW');
        });

        it('permite get_disk_usage sem confirmacao', () => {
            const policy = getToolPolicy('get_disk_usage', {});
            expect(policy).toBe('ALLOW');
        });

        it('permite list_processes sem confirmacao', () => {
            const policy = getToolPolicy('list_processes', { sort_by: 'cpu' });
            expect(policy).toBe('ALLOW');
        });
    });

    describe('comandos seguros (run_command)', () => {
        it('permite ls sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'ls -la' });
            expect(policy).toBe('ALLOW');
        });

        it('permite pwd sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'pwd' });
            expect(policy).toBe('ALLOW');
        });

        it('permite cat sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'cat /etc/os-release' });
            expect(policy).toBe('ALLOW');
        });

        it('permite grep sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'grep -r "test" .' });
            expect(policy).toBe('ALLOW');
        });

        it('permite find sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'find . -name "*.ts"' });
            expect(policy).toBe('ALLOW');
        });

        it('permite ps sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'ps aux' });
            expect(policy).toBe('ALLOW');
        });

        it('permite df sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'df -h' });
            expect(policy).toBe('ALLOW');
        });

        it('permite free sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'free -m' });
            expect(policy).toBe('ALLOW');
        });

        it('permite uname sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'uname -a' });
            expect(policy).toBe('ALLOW');
        });

        it('permite whoami sem confirmacao', () => {
            const policy = getToolPolicy('run_command', { command: 'whoami' });
            expect(policy).toBe('ALLOW');
        });
    });

    describe('comandos perigosos (run_command)', () => {
        it('pede confirmacao para rm', () => {
            const policy = getToolPolicy('run_command', { command: 'rm arquivo.txt' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para rm -rf', () => {
            const policy = getToolPolicy('run_command', { command: 'rm -rf /tmp/pasta' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para sudo com comando perigoso', () => {
            const policy = getToolPolicy('run_command', { command: 'sudo apt install htop' });
            expect(policy).toBe('ASK_USER');
        });

        it('permite sudo com comando seguro (ls)', () => {
            // sudo ls ainda e permitido pq ls e seguro
            const policy = getToolPolicy('run_command', { command: 'sudo ls' });
            expect(policy).toBe('ALLOW');
        });

        it('pede confirmacao para apt', () => {
            const policy = getToolPolicy('run_command', { command: 'apt install htop' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para apt-get', () => {
            const policy = getToolPolicy('run_command', { command: 'apt-get update' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para mv', () => {
            const policy = getToolPolicy('run_command', { command: 'mv arquivo.txt /tmp/' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para cp', () => {
            const policy = getToolPolicy('run_command', { command: 'cp arquivo.txt /backup/' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para chmod', () => {
            const policy = getToolPolicy('run_command', { command: 'chmod 755 script.sh' });
            expect(policy).toBe('ASK_USER');
        });

        // Nota: redirecionamentos e pipes com comandos seguros sao permitidos
        // porque o root command (echo, cat) e seguro
        it('permite redirecionamento > com comando seguro (echo)', () => {
            // echo e seguro, entao o redirecionamento e permitido
            const policy = getToolPolicy('run_command', { command: 'echo "test" > file.txt' });
            expect(policy).toBe('ALLOW');
        });

        it('permite pipe | com comandos seguros', () => {
            // cat e grep sao seguros
            const policy = getToolPolicy('run_command', { command: 'cat file | grep test' });
            expect(policy).toBe('ALLOW');
        });

        it('pede confirmacao para reboot', () => {
            const policy = getToolPolicy('run_command', { command: 'reboot' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para shutdown', () => {
            const policy = getToolPolicy('run_command', { command: 'shutdown -h now' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para npm install', () => {
            const policy = getToolPolicy('run_command', { command: 'npm install express' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para pip install', () => {
            const policy = getToolPolicy('run_command', { command: 'pip install requests' });
            expect(policy).toBe('ASK_USER');
        });
    });

    describe('ferramentas sempre perigosas', () => {
        it('pede confirmacao para run_sudo_command', () => {
            const policy = getToolPolicy('run_sudo_command', { command: 'apt update' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para create_script', () => {
            const policy = getToolPolicy('create_script', { filename: 'test.sh', content: '#!/bin/bash' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para run_script', () => {
            const policy = getToolPolicy('run_script', { script_name: 'test.sh' });
            expect(policy).toBe('ASK_USER');
        });
    });

    describe('comandos desconhecidos', () => {
        it('pede confirmacao para comando desconhecido', () => {
            const policy = getToolPolicy('run_command', { command: 'custom_tool --flag' });
            expect(policy).toBe('ASK_USER');
        });

        it('pede confirmacao para comando sem argumentos', () => {
            const policy = getToolPolicy('run_command', { command: 'unknowncommand' });
            expect(policy).toBe('ASK_USER');
        });
    });

    describe('permissoes de sessao', () => {
        it('permite ferramenta apos allowToolForSession', () => {
            allowToolForSession('run_sudo_command');
            const policy = getToolPolicy('run_sudo_command', { command: 'apt update' });
            expect(policy).toBe('ALLOW');
        });

        it('permite comando apos allowCommandForSession', () => {
            allowCommandForSession('rm');
            const policy = getToolPolicy('run_command', { command: 'rm arquivo.txt' });
            expect(policy).toBe('ALLOW');
        });

        it('clearSessionPermissions limpa permissoes de ferramentas', () => {
            allowToolForSession('run_sudo_command');
            clearSessionPermissions();
            const policy = getToolPolicy('run_sudo_command', { command: 'apt update' });
            expect(policy).toBe('ASK_USER');
        });

        it('clearSessionPermissions limpa permissoes de comandos', () => {
            allowCommandForSession('rm');
            clearSessionPermissions();
            const policy = getToolPolicy('run_command', { command: 'rm arquivo.txt' });
            expect(policy).toBe('ASK_USER');
        });

        it('permite multiplas ferramentas na sessao', () => {
            allowToolForSession('run_sudo_command');
            allowToolForSession('create_script');

            expect(getToolPolicy('run_sudo_command', { command: 'apt update' })).toBe('ALLOW');
            expect(getToolPolicy('create_script', { filename: 'test.sh' })).toBe('ALLOW');
        });

        it('permite multiplos comandos na sessao', () => {
            allowCommandForSession('rm');
            allowCommandForSession('mv');

            expect(getToolPolicy('run_command', { command: 'rm file.txt' })).toBe('ALLOW');
            expect(getToolPolicy('run_command', { command: 'mv a.txt b.txt' })).toBe('ALLOW');
        });
    });
});

describe('createConfirmationDetails', () => {
    describe('comandos shell', () => {
        it('cria detalhes para run_command', () => {
            const details = createConfirmationDetails('run_command', {
                command: 'rm -rf /tmp/test',
                description: 'Remove pasta temporaria',
            });

            expect(details.type).toBe('exec');
            expect(details.title).toBe('[!] Executar Comando');
            if (details.type === 'exec') {
                expect(details.command).toBe('rm -rf /tmp/test');
                expect(details.description).toBe('Remove pasta temporaria');
            }
        });

        it('cria detalhes para run_sudo_command', () => {
            const details = createConfirmationDetails('run_sudo_command', {
                command: 'apt install htop',
            });

            expect(details.type).toBe('exec');
            expect(details.title).toBe('[!] Comando com Sudo');
            if (details.type === 'exec') {
                expect(details.command).toBe('apt install htop');
            }
        });
    });

    describe('scripts', () => {
        it('cria detalhes para create_script', () => {
            const details = createConfirmationDetails('create_script', {
                filename: 'backup.sh',
                content: '#!/bin/bash\ncp -r ~/Documents ~/backup/',
            });

            expect(details.type).toBe('edit');
            expect(details.title).toBe('[!] Criar Script');
            if (details.type === 'edit') {
                expect(details.filePath).toBe('backup.sh');
                expect(details.content).toContain('#!/bin/bash');
            }
        });

        it('cria detalhes para run_script', () => {
            const details = createConfirmationDetails('run_script', {
                script_name: 'backup.sh',
            });

            expect(details.type).toBe('edit');
            expect(details.title).toBe('[!] Executar Script');
            if (details.type === 'edit') {
                expect(details.filePath).toBe('backup.sh');
            }
        });
    });

    describe('fallback generico', () => {
        it('cria detalhes info para ferramenta desconhecida', () => {
            const details = createConfirmationDetails('unknown_tool', {
                param1: 'value1',
                param2: 123,
            });

            expect(details.type).toBe('info');
            expect(details.title).toBe('[!] unknown_tool');
            if (details.type === 'info') {
                expect(details.description).toContain('param1');
                expect(details.description).toContain('value1');
            }
        });
    });
});

describe('ConfirmationOutcome', () => {
    it('tem valor ProceedOnce', () => {
        expect(ConfirmationOutcome.ProceedOnce).toBe('proceed_once');
    });

    it('tem valor ProceedAlways', () => {
        expect(ConfirmationOutcome.ProceedAlways).toBe('proceed_always');
    });

    it('tem valor Cancel', () => {
        expect(ConfirmationOutcome.Cancel).toBe('cancel');
    });
});
