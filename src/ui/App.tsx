import React, { useState, useCallback } from 'react';
import { Box, Text, useStdout } from 'ink';
import { runAgent, clearHistory, setModel, type PendingToolCall, type AgentOptions } from '../api/groq.js';
import { DEFAULT_MODEL, PROVIDERS, getAllModels } from '../config/models.js';
import { SimpleInput } from './components/SimpleInput.js';
import { Logo, BLUE_GRADIENT } from './components/Logo.js';
import { ToolConfirmation } from './components/ToolConfirmation.js';
import { ThinkingBox, ToolExecution } from './components/CommandBox.js';
import { RateLimitDialog, isRateLimitError, type RateLimitAction } from './components/RateLimitDialog.js';
import { type ConfirmationOutcome, ConfirmationOutcome as Outcome } from '../tools/confirmation.js';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export function App() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentModel, setCurrentModel] = useState(DEFAULT_MODEL);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingToolCall | null>(null);
    const [confirmationResolver, setConfirmationResolver] = useState<((outcome: ConfirmationOutcome) => void) | null>(null);
    const [currentTool, setCurrentTool] = useState<{ name: string; args: Record<string, unknown>; status: 'running' | 'completed' | 'error'; result?: string } | null>(null);
    const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
    const { stdout } = useStdout();
    const [refreshKey, setRefreshKey] = useState(0);

    // hide system cursor on mount, show on unmount
    React.useEffect(() => {
        stdout?.write('\x1B[?25l');

        const onResize = () => {
            stdout?.write('\x1Bc');
            setRefreshKey(prev => prev + 1);
        };

        if (stdout) {
            stdout.on('resize', onResize);
        }

        return () => {
            stdout?.write('\x1B[?25h');
            if (stdout) {
                stdout.off('resize', onResize);
            }
        };
    }, [stdout]);

    const handleCommand = (input: string): boolean => {
        const cmd = input.toLowerCase().trim();

        if (cmd === '/exit') {
            process.exit(0);
        }

        if (cmd === '/clear') {
            setMessages([]);
            clearHistory();
            return true;
        }

        if (cmd === '/help') {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `Comandos disponiveis:
/help - Mostra esta mensagem
/model - Lista modelos disponiveis
/model <nome> - Troca para um modelo
/clear - Limpa historico
/exit - Sai do LLMX

Funcionalidades:
- Gerenciar arquivos (listar, buscar, ler)
- Ver info do sistema (disco, RAM, processos)
- Executar comandos shell
- Criar scripts de automacao`
            }]);
            return true;
        }

        if (cmd === '/model') {
            const allModels = getAllModels();
            const modelList = Object.entries(PROVIDERS).map(([provider, config]) => {
                const providerModels = config.models.map(m =>
                    m === currentModel ? `  • ${m} (atual)` : `  • ${m}`
                ).join('\n');
                return `${config.name}:\n${providerModels}`;
            }).join('\n\n');

            setMessages(prev => [...prev, {
                role: 'system',
                content: `Modelos disponiveis:\n\n${modelList}\n\nUse: /model <nome> para trocar`
            }]);
            return true;
        }

        if (cmd.startsWith('/model ')) {
            const newModel = input.slice(7).trim();
            const allModels = getAllModels();
            const modelExists = allModels.some(m => m.model === newModel);

            if (!modelExists) {
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `❌ Modelo '${newModel}' nao encontrado. Use /model para ver modelos disponiveis.`
                }]);
                return true;
            }

            setCurrentModel(newModel);
            setModel(newModel);
            setMessages(prev => [...prev, {
                role: 'system',
                content: `✓ Modelo trocado para: ${newModel}`
            }]);
            return true;
        }

        return false;
    };

    // callback para confirmacao
    const handleConfirmationRequired = useCallback((pending: PendingToolCall): Promise<ConfirmationOutcome> => {
        return new Promise((resolve) => {
            setPendingConfirmation(pending);
            setConfirmationResolver(() => resolve);
        });
    }, []);

    // quando usuario responde a confirmacao
    const handleConfirmationResponse = useCallback((outcome: ConfirmationOutcome) => {
        if (confirmationResolver) {
            confirmationResolver(outcome);
        }
        setPendingConfirmation(null);
        setConfirmationResolver(null);
    }, [confirmationResolver]);

    const handleSubmit = async (input: string) => {
        if (!input.trim() || isProcessing) return;

        if (input.startsWith('/')) {
            const handled = handleCommand(input);
            if (handled) return;
        }

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);

        setIsProcessing(true);

        try {
            const options: AgentOptions = {
                model: currentModel,
                onConfirmationRequired: handleConfirmationRequired,
                onToolExecuting: (toolName, args) => {
                    setCurrentTool({ name: toolName, args, status: 'running' });
                },
                onToolComplete: (toolName, result) => {
                    setCurrentTool(prev => prev ? { ...prev, status: 'completed', result } : null);
                    // limpa apos um breve delay
                    setTimeout(() => setCurrentTool(null), 500);
                },
            };

            const response = await runAgent(input, options);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            // verifica se e erro de rate limit
            if (isRateLimitError(error)) {
                setShowRateLimitDialog(true);
            } else {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${errorMsg}` }]);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // handler para acoes do dialog de rate limit
    const handleRateLimitAction = useCallback((action: RateLimitAction) => {
        setShowRateLimitDialog(false);

        if (action === 'change_model') {
            // mostra lista de modelos
            const allModels = getAllModels();
            const modelList = Object.entries(PROVIDERS).map(([provider, config]) => {
                const providerModels = config.models.map(m =>
                    m === currentModel ? `  • ${m} (atual)` : `  • ${m}`
                ).join('\n');
                return `${config.name}:\n${providerModels}`;
            }).join('\n\n');

            setMessages(prev => [...prev, {
                role: 'system',
                content: `Troque para outro modelo:\n\n${modelList}\n\nUse: /model <nome> para trocar`
            }]);
        } else if (action === 'renew_key') {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `Para renovar sua chave API do Groq:\n\n1. Acesse: https://console.groq.com/keys\n2. Crie uma nova chave\n3. Edite o arquivo .env no projeto:\n   GROQ_API_KEY=sua_nova_chave\n4. Reinicie o LLMX`
            }]);
        }
        // cancel = apenas fecha o dialog
    }, [currentModel]);

    return (
        <Box flexDirection="column" key={refreshKey}>
            <Logo />

            <Text>
                <Text color="#00266b">◆</Text> LLMX v2.0.0
            </Text>
            <Text dimColor>Assistente Linux • Multi-provider</Text>
            <Text dimColor>/help para comandos • /model para modelos</Text>
            <Text>{''}</Text>

            <Text color="green">✓ conectado ({currentModel})</Text>
            <Text>{'\n\n'}</Text>

            {/* mensagens */}
            {messages.map((msg, idx) => (
                <Box key={idx} flexDirection="column" marginBottom={1}>
                    {msg.role === 'user' ? (
                        <Text dimColor>› {msg.content}</Text>
                    ) : msg.role === 'system' ? (
                        <Text color="cyan">{msg.content}</Text>
                    ) : (
                        <Text>{msg.content}</Text>
                    )}
                </Box>
            ))}

            {/* dialog de confirmacao */}
            {pendingConfirmation && (
                <Box marginY={1}>
                    <ToolConfirmation
                        details={pendingConfirmation.confirmationDetails}
                        onConfirm={handleConfirmationResponse}
                    />
                </Box>
            )}

            {/* dialog de rate limit */}
            {showRateLimitDialog && (
                <RateLimitDialog
                    currentModel={currentModel}
                    onAction={handleRateLimitAction}
                />
            )}

            {/* indicador de processamento com spinner */}
            {isProcessing && !pendingConfirmation && !currentTool && (
                <ThinkingBox message="Pensando..." />
            )}

            {/* ferramenta em execucao com borda branca */}
            {currentTool && (
                <ToolExecution
                    toolName={currentTool.name}
                    args={currentTool.args}
                    status={currentTool.status}
                    result={currentTool.result}
                />
            )}

            {/* entrada - desabilitada durante confirmacao ou rate limit */}
            <SimpleInput
                placeholder="Digite sua pergunta ou comando"
                onSubmit={handleSubmit}
                disabled={isProcessing || pendingConfirmation !== null || showRateLimitDialog}
            />

            {/* barra de status */}
            <Box marginTop={1} justifyContent="space-between">
                <Text dimColor>~/LLMX</Text>
                <Box>
                    {currentModel.split('').map((char, i) => {
                        const colorIdx = Math.floor((i / currentModel.length) * BLUE_GRADIENT.length);
                        const color = BLUE_GRADIENT[Math.min(colorIdx, BLUE_GRADIENT.length - 1)];
                        return <Text key={i} color={color}>{char}</Text>;
                    })}
                </Box>
                <Text dimColor>| RAM: 64MB</Text>
            </Box>
        </Box>
    );
}
