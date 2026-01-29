// componente de confirmacao de ferramentas

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import {
    type ConfirmationDetails,
    type ConfirmationOutcome,
    ConfirmationOutcome as Outcome,
} from '../../tools/confirmation.js';

interface ToolConfirmationProps {
    details: ConfirmationDetails;
    onConfirm: (outcome: ConfirmationOutcome) => void;
}

/**
 * componente que exibe dialog de confirmacao para ferramentas
 */
export function ToolConfirmation({ details, onConfirm }: ToolConfirmationProps) {
    const [selectedOption, setSelectedOption] = useState(0);
    const [hasResponded, setHasResponded] = useState(false);

    const options = [
        { key: 'y', label: 'Sim, executar', outcome: Outcome.ProceedOnce },
        { key: 'a', label: 'Sempre permitir', outcome: Outcome.ProceedAlways },
        { key: 'n', label: 'Cancelar', outcome: Outcome.Cancel },
    ];

    const handleConfirm = (outcome: ConfirmationOutcome) => {
        if (hasResponded) return; // previne múltiplas respostas
        setHasResponded(true);
        onConfirm(outcome);
    };

    useInput((input, key) => {
        if (hasResponded) return; // ignora input após resposta

        // navegacao com setas
        if (key.upArrow) {
            setSelectedOption(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedOption(prev => Math.min(options.length - 1, prev + 1));
        }

        // confirmar com enter
        if (key.return) {
            handleConfirm(options[selectedOption].outcome);
            return;
        }

        // atalhos de teclado
        const lowerInput = input.toLowerCase();
        if (lowerInput === 'y' || lowerInput === 's') {
            handleConfirm(Outcome.ProceedOnce);
        } else if (lowerInput === 'a') {
            handleConfirm(Outcome.ProceedAlways);
        } else if (lowerInput === 'n' || key.escape) {
            handleConfirm(Outcome.Cancel);
        }
    });

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="yellow"
            paddingX={1}
            paddingY={0}
        >
            {/* titulo */}
            <Box marginBottom={1}>
                <Text color="yellow" bold wrap="truncate">
                    {details.title}
                </Text>
            </Box>

            {/* conteudo baseado no tipo */}
            {details.type === 'exec' && (
                <Box flexDirection="column" marginBottom={1}>
                    <Text dimColor>Comando:</Text>
                    <Box
                        borderStyle="single"
                        borderColor="gray"
                        paddingX={1}
                    >
                        <Text color="cyan">{details.command}</Text>
                    </Box>
                    {details.description && (
                        <Text dimColor>Descricao: {details.description}</Text>
                    )}
                </Box>
            )}

            {details.type === 'edit' && (
                <Box flexDirection="column" marginBottom={1}>
                    <Text dimColor>Arquivo: {details.filePath}</Text>
                    <Box
                        borderStyle="single"
                        borderColor="gray"
                        paddingX={1}
                        height={5}
                        overflow="hidden"
                    >
                        <Text>{details.content.slice(0, 200)}...</Text>
                    </Box>
                </Box>
            )}

            {details.type === 'info' && (
                <Box marginBottom={1}>
                    <Text>{details.description}</Text>
                </Box>
            )}

            {/* opcoes */}
            <Box flexDirection="column">
                {options.map((opt, idx) => (
                    <Box key={opt.key}>
                        <Text
                            color={idx === selectedOption ? 'green' : undefined}
                            bold={idx === selectedOption}
                        >
                            {idx === selectedOption ? '> ' : '  '}
                            [{opt.key.toUpperCase()}] {opt.label}
                        </Text>
                    </Box>
                ))}
            </Box>

            {/* dica */}
            <Box marginTop={1}>
                <Text dimColor>
                    Use ↑↓ e Enter, ou pressione Y/A/N
                </Text>
            </Box>
        </Box>
    );
}
