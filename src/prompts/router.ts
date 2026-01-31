// router para classificar requests do usuario e selecionar prompt apropriado
// REFATORADO: Agora usamos uma abordagem 'Agentic' unificada.
// O LLM recebe todas as ferramentas e o prompt base robusto, decidindo sozinho o que fazer.

import { BASE_PROMPT } from './base.js';

export type Category = 'agentic';

/**
 * Classificação agora é pass-through.
 * Não tentamos adivinhar a intenção com keywords simples.
 * Deixamos o modelo (Llama 3.3) raciocinar sobre o pedido completo.
 */
export function classifyRequest(userMessage: string): Category {
    return 'agentic';
}

/**
 * Retorna sempre o prompt unificado e poderoso.
 */
export function getPromptForCategory(category: Category): string {
    return BASE_PROMPT;
}

/**
 * Função principal de roteamento.
 */
export function getPromptForRequest(userMessage: string): { category: Category; prompt: string } {
    return {
        category: 'agentic',
        prompt: BASE_PROMPT
    };
}

