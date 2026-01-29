// agente com suporte a confirmacao de ferramentas

import Groq from 'groq-sdk';
import { OpenAI } from 'openai';
import { executeTool, ALL_TOOLS, type ToolDefinition } from '../tools/index.js';
import { getPromptAndTools } from '../prompts/composer.js';
import { classifyRequest, getPromptForCategory } from '../prompts/router.js';
import { PROVIDERS, getProviderForModel, getApiKey, DEFAULT_MODEL } from '../config/models.js';
import {
    getToolPolicy,
    createConfirmationDetails,
    allowToolForSession,
    allowCommandForSession,
    type ConfirmationDetails,
    type ConfirmationOutcome,
    ConfirmationOutcome as Outcome,
} from '../tools/confirmation.js';

// clientes por provedor
const clients = new Map<string, any>();

/**
 * obtem ou cria cliente para provedor
 */
function getClient(provider: string): any {
    if (clients.has(provider)) {
        return clients.get(provider);
    }

    const config = PROVIDERS[provider];
    const apiKey = getApiKey(provider);

    if (!apiKey) {
        throw new Error(`API key nao encontrada para ${provider}. Configure ${config.envVar} no .env`);
    }

    let client: any;

    if (provider === 'groq') {
        client = new Groq({ apiKey });
    } else if (provider === 'google') {
        client = new OpenAI({
            apiKey,
            baseURL: `${config.baseUrl}/openai/`,
        });
    } else {
        client = new OpenAI({
            apiKey,
            baseURL: config.baseUrl,
        });
    }

    clients.set(provider, client);
    return client;
}

export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: any[];
    tool_call_id?: string;
    name?: string;
}

const SYSTEM_PROMPT = `Voce eh o LLMX, um assistente Linux especializado.

COMPORTAMENTO:
- Sempre responda em portugues brasileiro
- Seja direto e objetivo
- Foque em tarefas do sistema Linux
- Pode executar comandos, manipular arquivos, e gerenciar processos
- Use exemplos praticos quando explicar comandos

AREAS DE EXPERTISE:
- Comandos Linux (bash, shell scripting)
- Gerenciamento de arquivos e diretorios
- Processos e recursos do sistema
- Instalacao de pacotes
- Configuracao do sistema
- Automacao com scripts

NAO FACA:
- Conversas genericas fora do contexto Linux
- Explicacoes longas sem necessidade
- Respostas em outros idiomas

Sempre priorize solucoes praticas e comandos prontos para uso.`;

// historico de conversacao global
let conversationHistory: Message[] = [];
let currentModel = DEFAULT_MODEL;

/**
 * adiciona mensagem ao historico
 */
function addMessage(message: Message) {
    conversationHistory.push(message);
}

/**
 * limpa historico de conversacao
 */
export function clearHistory() {
    conversationHistory = [];
}

/**
 * troca modelo atual
 */
export function setModel(model: string) {
    currentModel = model;
}

/**
 * informacoes de uma tool call pendente
 */
export interface PendingToolCall {
    toolName: string;
    args: Record<string, unknown>;
    toolCallId: string;
    confirmationDetails: ConfirmationDetails;
}

/**
 * callback para pedir confirmacao
 */
export type ConfirmationCallback = (
    pending: PendingToolCall
) => Promise<ConfirmationOutcome>;

/**
 * opcoes do agente
 */
export interface AgentOptions {
    model?: string;
    onConfirmationRequired?: ConfirmationCallback;
    onToolExecuting?: (toolName: string, args: Record<string, unknown>) => void;
    onToolComplete?: (toolName: string, result: string) => void;
}

/**
 * executa agente com loop de tool calling completo
 * agora com suporte a confirmacao
 */
export async function runAgent(
    userMessage: string,
    modelOrOptions: string | AgentOptions = currentModel
): Promise<string> {
    // normaliza opcoes
    const options: AgentOptions = typeof modelOrOptions === 'string'
        ? { model: modelOrOptions }
        : modelOrOptions;

    const model = options.model || currentModel;

    try {
        const provider = getProviderForModel(model);
        const client = getClient(provider);

        // detecta acoes e obtem prompt + tools otimizados
        const { prompt, tools: toolNames, actions } = getPromptAndTools(userMessage);

        let systemPrompt: string;
        let tools: ToolDefinition[];

        if (actions.length > 0) {
            systemPrompt = prompt;
            tools = ALL_TOOLS.filter(t => toolNames.includes(t.function.name));
        } else {
            const category = classifyRequest(userMessage);
            systemPrompt = getPromptForCategory(category);
            tools = ALL_TOOLS;
        }

        // adiciona mensagem do usuario
        addMessage({ role: 'user', content: userMessage });

        // prepara mensagens com system prompt
        const messages: Message[] = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
        ];

        // loop de tool calling
        let iteration = 0;
        const maxIterations = 10;

        while (iteration < maxIterations) {
            iteration++;

            // chama api
            const response = await client.chat.completions.create({
                model,
                messages: messages as any,
                tools: tools.length > 0 ? tools as any : undefined,
            });

            const choice = response.choices[0];
            const assistantMessage = choice.message;

            // se nao tem tool calls, retorna resposta final
            if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
                const finalContent = assistantMessage.content || 'sem resposta';
                addMessage({ role: 'assistant', content: finalContent });
                return finalContent;
            }

            // adiciona mensagem do assistente com tool calls
            messages.push({
                role: 'assistant',
                content: assistantMessage.content || '',
                tool_calls: assistantMessage.tool_calls,
            });

            // executa cada tool call
            for (const toolCall of assistantMessage.tool_calls) {
                const toolName = toolCall.function.name;
                let args: Record<string, unknown> = {};

                try {
                    args = JSON.parse(toolCall.function.arguments);
                } catch (e) {
                    console.error(`Failed to parse arguments for ${toolName}:`, e);
                }

                // verifica politica de confirmacao
                const policy = getToolPolicy(toolName, args);

                let shouldExecute = true;

                if (policy === 'ASK_USER' && options.onConfirmationRequired) {
                    // cria detalhes de confirmacao
                    const confirmationDetails = createConfirmationDetails(toolName, args);

                    const pendingCall: PendingToolCall = {
                        toolName,
                        args,
                        toolCallId: toolCall.id,
                        confirmationDetails,
                    };

                    // pede confirmacao
                    const outcome = await options.onConfirmationRequired(pendingCall);

                    if (outcome === Outcome.Cancel) {
                        shouldExecute = false;
                        // adiciona mensagem de cancelamento
                        messages.push({
                            role: 'tool',
                            content: 'Operacao cancelada pelo usuario.',
                            tool_call_id: toolCall.id,
                            name: toolName,
                        });
                    } else if (outcome === Outcome.ProceedAlways) {
                        // permite para a sessao
                        allowToolForSession(toolName);
                        if (toolName === 'run_command' && typeof args.command === 'string') {
                            const rootCmd = args.command.trim().split(/\s+/)[0];
                            if (rootCmd) {
                                allowCommandForSession(rootCmd);
                            }
                        }
                    }
                } else if (policy === 'DENY') {
                    shouldExecute = false;
                    messages.push({
                        role: 'tool',
                        content: 'Operacao negada pela politica de seguranca.',
                        tool_call_id: toolCall.id,
                        name: toolName,
                    });
                }

                if (shouldExecute) {
                    // notifica que esta executando
                    options.onToolExecuting?.(toolName, args);

                    // executa a tool
                    const result = await executeTool(toolName, args);

                    // notifica que terminou
                    options.onToolComplete?.(toolName, result);

                    // adiciona resultado ao historico
                    messages.push({
                        role: 'tool',
                        content: result,
                        tool_call_id: toolCall.id,
                        name: toolName,
                    });
                }
            }
        }

        return 'desculpe, a operacao ficou muito complexa. tente uma pergunta mais simples.';

    } catch (error: any) {
        console.error('Agent error:', error);

        // re-lanca erros de rate limit para a UI tratar
        const errorMsg = error.message || '';
        if (errorMsg.includes('rate_limit') ||
            errorMsg.includes('rate limit') ||
            errorMsg.includes('429') ||
            errorMsg.includes('tokens per day')) {
            throw error;
        }

        if (errorMsg.includes('API key')) {
            return `❌ ${errorMsg}`;
        }

        return `erro ao processar: ${errorMsg}`;
    }
}

// mantem streamChat original para compatibilidade
export async function* streamChat(messages: Message[], model: string = currentModel) {
    const provider = getProviderForModel(model);
    const client = getClient(provider);

    const hasSystemPrompt = messages.some(m => m.role === 'system');
    const fullMessages = hasSystemPrompt
        ? messages
        : [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages];

    const stream = await client.chat.completions.create({
        messages: fullMessages as any,
        model,
        stream: true,
    });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
            yield content;
        }
    }
}

export async function sendMessage(messages: Message[], model: string = currentModel): Promise<string> {
    const provider = getProviderForModel(model);
    const client = getClient(provider);

    const hasSystemPrompt = messages.some(m => m.role === 'system');
    const fullMessages = hasSystemPrompt
        ? messages
        : [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages];

    const completion = await client.chat.completions.create({
        messages: fullMessages as any,
        model,
    });

    return completion.choices[0]?.message?.content || '';
}
