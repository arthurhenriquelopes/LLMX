// componente de dialog de erro de rate limit

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export type RateLimitAction = 'change_model' | 'renew_key' | 'cancel';

interface RateLimitDialogProps {
    currentModel: string;
    onAction: (action: RateLimitAction) => void;
}

/**
 * dialog amigavel quando o limite de API e atingido
 */
export function RateLimitDialog({ currentModel, onAction }: RateLimitDialogProps) {
    const [selectedOption, setSelectedOption] = useState(0);

    const options: { key: RateLimitAction; label: string }[] = [
        { key: 'change_model', label: 'Alterar modelo' },
        { key: 'renew_key', label: 'Renovar chave API' },
        { key: 'cancel', label: 'Cancelar' },
    ];

    useInput((input, key) => {
        // navegacao com setas
        if (key.upArrow) {
            setSelectedOption(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedOption(prev => Math.min(options.length - 1, prev + 1));
        }

        // confirmar com enter
        if (key.return) {
            onAction(options[selectedOption].key);
        }

        // atalhos numericos
        if (input === '1') onAction('change_model');
        if (input === '2') onAction('renew_key');
        if (input === '3' || key.escape) onAction('cancel');
    });

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="yellow"
            paddingX={2}
            paddingY={1}
            marginY={1}
            width={60}
        >
            {/* titulo */}
            <Text color="yellow" bold>
                [!] Limite de API atingido!
            </Text>

            {/* mensagem */}
            <Box marginTop={1}>
                <Text>
                    Modelo: <Text color="cyan" bold>{currentModel}</Text>
                </Text>
            </Box>

            {/* opcoes */}
            <Box flexDirection="column" marginTop={1}>
                {options.map((opt, idx) => (
                    <Box key={opt.key}>
                        <Text
                            color={idx === selectedOption ? 'green' : undefined}
                            bold={idx === selectedOption}
                        >
                            {idx === selectedOption ? '› ' : '  '}
                            [{idx + 1}] {opt.label}
                        </Text>
                    </Box>
                ))}
            </Box>

            {/* dica */}
            <Box marginTop={1}>
                <Text dimColor>
                    ↑↓ + Enter ou 1/2/3
                </Text>
            </Box>
        </Box>
    );
}

/**
 * verifica se o erro e de rate limit
 */
export function isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        return msg.includes('rate_limit') ||
            msg.includes('rate limit') ||
            msg.includes('429') ||
            msg.includes('tokens per day') ||
            msg.includes('too many requests');
    }
    return false;
}

/**
 * extrai o tempo de espera da mensagem de erro
 */
export function extractWaitTime(error: unknown): string | null {
    if (error instanceof Error) {
        // procura por padrao "try again in Xm Ys"
        const match = error.message.match(/try again in (\d+m?\d*\.?\d*s?)/i);
        if (match) {
            return match[1];
        }
    }
    return null;
}
