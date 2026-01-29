// implementacoes de ferramentas de executor - execucao de comando

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// padroes perigosos para bloqueio de seguranca
const DANGEROUS_PATTERNS = [
    'rm -rf /',
    'rm -rf /*',
    ':(){',
    'mkfs.',
    'dd if=/dev/zero',
    'chmod -R 777 /',
];

/**
 * verifica se comando e perigoso
 */
function isDangerous(command: string): boolean {
    return DANGEROUS_PATTERNS.some(pattern => command.includes(pattern));
}

/**
 * executa um comando shell
 */
export async function runCommand(command: string): Promise<string> {
    try {
        // verificacao de seguranca
        if (isDangerous(command)) {
            return `⛔ comando bloqueado por seguranca: ${command}`;
        }

        const { stdout, stderr } = await execAsync(command, {
            timeout: 120000, // 2 minutos
            maxBuffer: 1024 * 1024, // 1MB
        });

        const output = stdout.trim();
        const error = stderr.trim();

        if (error && !output) {
            return `❌ erro:\n${error}`;
        }

        if (output) {
            return `✅ comando executado com sucesso:\n${output}`;
        }

        return '✅ comando executado com sucesso (sem saida).';
    } catch (error: any) {
        if (error.killed) {
            return '⏱️ erro: comando demorou mais de 2 minutos e foi cancelado.';
        }
        return `❌ erro ao executar comando: ${error.message}`;
    }
}

/**
 * executa um comando com privilegios sudo
 */
export async function runSudoCommand(command: string): Promise<string> {
    try {
        // remove sudo se ja estiver no comando
        let cleanCommand = command.trim();
        if (cleanCommand.startsWith('sudo ')) {
            cleanCommand = cleanCommand.slice(5);
        }

        // verificacao de seguranca
        if (isDangerous(cleanCommand)) {
            return `⛔ comando bloqueado por seguranca: sudo ${cleanCommand}`;
        }

        const fullCommand = `sudo ${cleanCommand}`;

        const { stdout, stderr } = await execAsync(fullCommand, {
            timeout: 300000, // 5 minutos
            maxBuffer: 1024 * 1024 * 5, // 5MB
        });

        const output = stdout.trim();
        const error = stderr.trim();

        if (error && !output) {
            return `❌ erro sudo:\n${error}`;
        }

        if (output) {
            return `✅ comando sudo executado com sucesso:\n${output}`;
        }

        return '✅ comando sudo executado com sucesso.';
    } catch (error: any) {
        if (error.killed) {
            return '⏱️ erro: comando sudo demorou mais de 5 minutos e foi cancelado.';
        }
        return `❌ erro ao executar comando sudo: ${error.message}`;
    }
}

/**
 * executa uma ferramenta de executor
 */
export async function executeExecutorTool(toolName: string, args: any): Promise<string> {
    switch (toolName) {
        case 'run_command':
            return await runCommand(args.command);
        case 'run_sudo_command':
            return await runSudoCommand(args.command);
        default:
            return `erro: tool '${toolName}' nao encontrada.`;
    }
}
