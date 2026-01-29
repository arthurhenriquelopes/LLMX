// router para classificar requests do usuario e selecionar prompt apropriado

import {
    BASE_PROMPT,
    FILESYSTEM_PROMPT,
    SYSTEM_INFO_PROMPT,
    COMMANDS_PROMPT,
    SCRIPTS_PROMPT,
} from './base.js';

export type Category = 'filesystem' | 'system_info' | 'commands' | 'scripts' | 'general';

// categorias e suas keywords
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
    filesystem: [
        'listar', 'lista', 'ls', 'pasta', 'diretorio', 'diretório', 'folder',
        'arquivos', 'files', 'tamanho', 'size', 'buscar',
        'encontrar', 'find', 'procurar', 'search', 'ler', 'read', 'conteudo',
        'conteúdo', 'abrir', 'visualizar', 'mostrar', 'ver', 'caminho', 'path',
        'onde esta', 'onde está', 'executavel', 'executável', 'which',
    ],
    system_info: [
        'disco', 'disk', 'espaco', 'espaço', 'storage', 'memoria', 'memória',
        'ram', 'memory', 'cpu', 'processador', 'processo', 'processos',
        'process', 'pacote', 'pacotes', 'package', 'instalado',
        'sistema', 'system', 'info', 'informacao', 'informação', 'uptime',
        'kernel', 'versao', 'versão',
    ],
    commands: [
        'executar', 'execute', 'rodar', 'run',
        'compactar', 'compacte', 'compress', 'zip', 'rar', 'tar', 'descompactar',
        'extract', 'copiar', 'copie', 'copy', 'cp', 'mover', 'mova', 'move', 'mv',
        'renomear', 'renomeie', 'rename', 'deletar', 'delete', 'rm', 'remover',
        'instalar', 'instale', 'install', 'desinstalar', 'uninstall',
        'atualizar', 'atualize', 'update', 'upgrade', 'apt',
        'criar pasta', 'crie pasta', 'mkdir',
    ],
    scripts: [
        'script', 'scripts', 'bash', 'shell', 'automacao', 'automação',
        'automatizar', 'automatize', 'automate', 'cron', 'cronjob', 'agendar', 'schedule',
        'criar script', 'create script', 'escrever script', 'write script',
        'limpeza automatica', 'limpeza automática',
    ],
    general: [],
};

// keywords de acao que tem prioridade absoluta (bypass normal scoring)
const PRIORITY_KEYWORDS: Record<string, string[]> = {
    commands: [
        'compactar', 'compacte', 'rar', 'zip', 'tar',
        'extrair', 'extraia', 'extract', 'unrar', 'unzip', 'descompactar', 'descompacte',
        'copiar', 'copie', 'mover', 'mova',
        'instalar', 'instale', 'deletar', 'delete', 'remover', 'remova',
        'renomear', 'renomeie', 'criar pasta', 'crie pasta', 'crie a pasta',
        'atualize', 'atualizar', 'apt install', 'apt update', 'apt upgrade',
    ],
    scripts: [
        'criar script', 'crie script', 'crie um script',
        'automatize', 'automatizar', 'automacao', 'automação',
    ],
    filesystem: [
        'caminho do', 'onde esta o', 'onde está o', 'qual o caminho',
    ],
};

// mapa de categoria para prompt
const CATEGORY_PROMPTS: Record<Category, string> = {
    filesystem: FILESYSTEM_PROMPT,
    system_info: SYSTEM_INFO_PROMPT,
    commands: COMMANDS_PROMPT,
    scripts: SCRIPTS_PROMPT,
    general: BASE_PROMPT,
};

/**
 * classifica o request do usuario em uma categoria
 */
export function classifyRequest(userMessage: string): Category {
    const messageLower = userMessage.toLowerCase();

    // primeiro verifica keywords de prioridade
    for (const [category, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (messageLower.includes(keyword)) {
                return category as Category;
            }
        }
    }

    // depois conta matches por categoria normal
    const scores: Partial<Record<Category, number>> = {};

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const score = keywords.filter(keyword => messageLower.includes(keyword)).length;
        if (score > 0) {
            scores[category as Category] = score;
        }
    }

    // retorna categoria com maior score, ou general se nenhum match
    if (Object.keys(scores).length > 0) {
        return Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0] as Category;
    }

    return 'general';
}

/**
 * retorna o prompt especializado para uma categoria
 */
export function getPromptForCategory(category: Category): string {
    return CATEGORY_PROMPTS[category] || BASE_PROMPT;
}

/**
 * classifica o request e retorna o prompt apropriado
 */
export function getPromptForRequest(userMessage: string): { category: Category; prompt: string } {
    const category = classifyRequest(userMessage);
    const prompt = getPromptForCategory(category);
    return { category, prompt };
}
