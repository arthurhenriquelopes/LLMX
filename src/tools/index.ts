// despachante principal de execucao de ferramentas

import { executeFilesystemTool } from './filesystem.js';
import { executeSystemTool } from './system.js';
import { executeExecutorTool } from './executor.js';
import { FILESYSTEM_TOOLS, SYSTEM_TOOLS, EXECUTOR_TOOLS } from './definitions.js';

// conjuntos de nomes de ferramentas para verificacao rapida
const filesystemToolNames = new Set(FILESYSTEM_TOOLS.map(t => t.function.name));
const systemToolNames = new Set(SYSTEM_TOOLS.map(t => t.function.name));
const executorToolNames = new Set(EXECUTOR_TOOLS.map(t => t.function.name));

/**
 * executa uma ferramenta pelo nome com os argumentos fornecidos
 */
export async function executeTool(toolName: string, args: any): Promise<string> {
    // ferramentas de sistema de arquivos
    if (filesystemToolNames.has(toolName)) {
        return await executeFilesystemTool(toolName, args);
    }

    // ferramentas de sistema
    if (systemToolNames.has(toolName)) {
        return await executeSystemTool(toolName, args);
    }

    // ferramentas de execucao
    if (executorToolNames.has(toolName)) {
        return await executeExecutorTool(toolName, args);
    }

    return `erro: tool '${toolName}' nao encontrada.`;
}

// re-exporta tudo para uso facil
export * from './definitions.js';
export * from './filesystem.js';
export * from './system.js';
export * from './executor.js';
