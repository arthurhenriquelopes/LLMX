// composer de prompts: concatena micro-prompts e faz cache

import { ACTIONS, type Action } from './actions.js';

// base minimalista (compartilhada por todos)
const COMPOSER_BASE_PROMPT = `Você é o LLMX, um assistente Linux inteligente. Responda sempre em português brasileiro COM ACENTUAÇÃO.

REGRAS:
1. Use SEMPRE o caminho REAL retornado pelas ferramentas
2. NUNCA use placeholders como '/caminho/completo/' ou '$USER'
3. Após executar uma tarefa, responda de forma natural e informativa
4. Mostre os RESULTADOS das operações, não apenas "Pronto!"

FORMATO DE RESPOSTA:
- Para listagens: mostre os itens encontrados
- Para informações: apresente os dados de forma clara
- Para operações: confirme o que foi feito com detalhes
- Use acentos corretamente (é, ã, ç, etc.)

IMPORTANTE SOBRE FERRAMENTAS:
- Use APENAS o formato nativo de tool calling (JSON)
- NÃO escreva chamadas de função no texto
`;

interface ComposedResult {
    prompt: string;
    tools: string[];
}

// cache manual simples (equivalente ao lru_cache do python)
const promptCache = new Map<string, ComposedResult>();

/**
 * constroi prompt concatenando micro-prompts
 */
function buildPrompt(actions: string[]): ComposedResult {
    const promptParts: string[] = [COMPOSER_BASE_PROMPT];
    const allTools = new Set<string>();

    for (const action of actions) {
        if (action in ACTIONS) {
            const actionData = ACTIONS[action];
            promptParts.push(actionData.prompt);
            actionData.tools.forEach(tool => allTools.add(tool));
        }
    }

    // adiciona tools basicas sempre disponiveis
    allTools.add('list_directory');

    const fullPrompt = promptParts.join('\n');
    return {
        prompt: fullPrompt,
        tools: Array.from(allTools),
    };
}

/**
 * compoe prompt com cache
 */
export function composePrompt(actions: string[]): ComposedResult {
    const cacheKey = actions.sort().join(',');

    if (promptCache.has(cacheKey)) {
        return promptCache.get(cacheKey)!;
    }

    const result = buildPrompt(actions);
    promptCache.set(cacheKey, result);
    return result;
}

/**
 * detecta todas as acoes em uma mensagem
 */
export function detectActions(message: string): string[] {
    const messageLower = message.toLowerCase();
    const detected: string[] = [];

    for (const [actionName, actionData] of Object.entries(ACTIONS)) {
        for (const keyword of actionData.keywords) {
            if (messageLower.includes(keyword)) {
                if (!detected.includes(actionName)) {
                    detected.push(actionName);
                }
                break;
            }
        }
    }

    return detected;
}

/**
 * funcao principal: detecta acoes e retorna prompt + tools
 */
export function getPromptAndTools(message: string): {
    prompt: string;
    tools: string[];
    actions: string[];
} {
    const actions = detectActions(message);

    if (actions.length === 0) {
        // fallback para prompt base
        return {
            prompt: COMPOSER_BASE_PROMPT,
            tools: ['run_command', 'find_file', 'list_directory'],
            actions: [],
        };
    }

    const { prompt, tools } = composePrompt(actions);
    return { prompt, tools, actions };
}
