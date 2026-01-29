// sistema de confirmacao de ferramentas - tipos e politicas

/**
 * resultado possivel de uma confirmacao
 */
export enum ConfirmationOutcome {
    ProceedOnce = 'proceed_once',           // executar apenas esta vez
    ProceedAlways = 'proceed_always',       // sempre permitir nesta sessao
    Cancel = 'cancel',                      // cancelar operacao
}

/**
 * tipos de confirmacao
 */
export type ConfirmationType = 'exec' | 'edit' | 'info';

/**
 * detalhes de confirmacao para comandos shell
 */
export interface ExecConfirmationDetails {
    type: 'exec';
    title: string;
    command: string;
    description?: string;
}

/**
 * detalhes de confirmacao para edicao de arquivos
 */
export interface EditConfirmationDetails {
    type: 'edit';
    title: string;
    filePath: string;
    content: string;
}

/**
 * detalhes de confirmacao generica
 */
export interface InfoConfirmationDetails {
    type: 'info';
    title: string;
    description: string;
}

export type ConfirmationDetails =
    | ExecConfirmationDetails
    | EditConfirmationDetails
    | InfoConfirmationDetails;

/**
 * resultado da decisao de politica
 */
export type PolicyDecision = 'ALLOW' | 'DENY' | 'ASK_USER';

/**
 * ferramentas que sempre requerem confirmacao
 */
const DANGEROUS_TOOLS = new Set([
    'run_command',
    'run_sudo_command',
    'create_script',
    'run_script',
]);

/**
 * comandos shell que sempre requerem confirmacao
 */
const DANGEROUS_COMMANDS = [
    'rm', 'rm -rf', 'rm -r',
    'sudo', 'su',
    'chmod', 'chown',
    'mv', 'cp',  // podem sobrescrever arquivos
    'apt', 'apt-get', 'dnf', 'yum', 'pacman',
    'pip install', 'npm install',
    'reboot', 'shutdown', 'poweroff',
    'dd', 'mkfs', 'fdisk',
    '>', '>>', '|',  // redirecionamentos
];

/**
 * comandos seguros que nao precisam de confirmacao
 */
const SAFE_COMMANDS = [
    'ls', 'dir', 'pwd', 'cd',
    'cat', 'head', 'tail', 'less', 'more',
    'grep', 'find', 'locate', 'which', 'whereis',
    'echo', 'printf',
    'df', 'du', 'free', 'top', 'htop', 'ps',
    'uname', 'hostname', 'whoami', 'id',
    'date', 'cal', 'uptime',
    'file', 'stat', 'wc',
];

/**
 * ferramentas permitidas para a sessao atual
 */
const sessionAllowedTools = new Set<string>();

/**
 * prefixos de comandos permitidos para a sessao atual
 */
const sessionAllowedCommands = new Set<string>();

/**
 * permite uma ferramenta para a sessao atual
 */
export function allowToolForSession(toolName: string): void {
    sessionAllowedTools.add(toolName);
}

/**
 * permite um prefixo de comando para a sessao atual
 */
export function allowCommandForSession(commandPrefix: string): void {
    sessionAllowedCommands.add(commandPrefix);
}

/**
 * limpa permissoes da sessao
 */
export function clearSessionPermissions(): void {
    sessionAllowedTools.clear();
    sessionAllowedCommands.clear();
}

/**
 * extrai o comando raiz de uma linha de comando
 */
function getRootCommand(command: string): string {
    const trimmed = command.trim();
    // remove sudo se presente
    const withoutSudo = trimmed.startsWith('sudo ') ? trimmed.slice(5) : trimmed;
    // pega primeira palavra
    const firstWord = withoutSudo.split(/\s+/)[0];
    return firstWord || '';
}

/**
 * verifica se um comando eh seguro
 */
function isCommandSafe(command: string): boolean {
    const rootCmd = getRootCommand(command);

    // se esta na lista de permitidos da sessao
    if (sessionAllowedCommands.has(rootCmd)) {
        return true;
    }

    // se esta na lista de seguros
    if (SAFE_COMMANDS.includes(rootCmd)) {
        return true;
    }

    return false;
}

/**
 * verifica se um comando eh perigoso
 */
function isCommandDangerous(command: string): boolean {
    const lowerCmd = command.toLowerCase();

    // verifica cada padrao perigoso
    for (const pattern of DANGEROUS_COMMANDS) {
        if (lowerCmd.includes(pattern)) {
            return true;
        }
    }

    return false;
}

/**
 * decide se uma ferramenta precisa de confirmacao
 */
export function getToolPolicy(toolName: string, args: Record<string, unknown>): PolicyDecision {
    // se esta na lista de permitidos da sessao
    if (sessionAllowedTools.has(toolName)) {
        return 'ALLOW';
    }

    // ferramentas sempre perigosas
    if (DANGEROUS_TOOLS.has(toolName)) {
        // para run_command, analisar o comando
        if (toolName === 'run_command' && typeof args.command === 'string') {
            const command = args.command;

            // comandos seguros passam direto
            if (isCommandSafe(command)) {
                return 'ALLOW';
            }

            // sempre pedir confirmacao para comandos perigosos
            if (isCommandDangerous(command)) {
                return 'ASK_USER';
            }

            // comandos desconhecidos: pedir confirmacao
            return 'ASK_USER';
        }

        // outras ferramentas perigosas: sempre pedir
        return 'ASK_USER';
    }

    // ferramentas de leitura: permitir direto
    return 'ALLOW';
}

/**
 * cria detalhes de confirmacao para uma ferramenta
 */
export function createConfirmationDetails(
    toolName: string,
    args: Record<string, unknown>
): ConfirmationDetails {
    if (toolName === 'run_command' || toolName === 'run_sudo_command') {
        return {
            type: 'exec',
            title: toolName === 'run_sudo_command'
                ? '[!] Comando com Sudo'
                : '[!] Executar Comando',
            command: String(args.command || ''),
            description: String(args.description || ''),
        };
    }

    if (toolName === 'create_script' || toolName === 'run_script') {
        return {
            type: 'edit',
            title: toolName === 'create_script'
                ? '[!] Criar Script'
                : '[!] Executar Script',
            filePath: String(args.filename || args.script_name || ''),
            content: String(args.content || ''),
        };
    }

    // fallback generico
    return {
        type: 'info',
        title: `[!] ${toolName}`,
        description: JSON.stringify(args, null, 2),
    };
}
