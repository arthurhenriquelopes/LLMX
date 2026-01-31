// componente para exibir comandos em execucao com borda

import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from './Spinner.js';

interface CommandBoxProps {
    command: string;
    status: 'running' | 'completed' | 'error';
    result?: string;
    compact?: boolean;
}

/**
 * exibe um comando com borda branca e spinner (estilo Gemini CLI)
 */
export function CommandBox({ command, status, result, compact = false }: CommandBoxProps) {
    const borderColor = status === 'error' ? 'red' : 'gray';

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={borderColor}
            paddingX={1}
            marginY={compact ? 0 : 1}
        >
            {/* header com comando */}
            <Box>
                {status === 'running' && <Spinner color="cyan" />}
                {status === 'error' && <Text color="red">✗</Text>}
                <Text color="gray"> $ </Text>
                <Text color="white" bold>{command}</Text>
            </Box>

            {/* resultado se houver */}
            {result && (
                <Box marginTop={1}>
                    <Text dimColor wrap="truncate">
                        {result.length > 200 ? result.slice(0, 200) + '...' : result}
                    </Text>
                </Box>
            )}
        </Box>
    );
}

interface ThinkingBoxProps {
    message?: string;
}

/**
 * exibe indicador de "pensando" com spinner
 */
export function ThinkingBox({ message = 'Pensando...' }: ThinkingBoxProps) {
    return (
        <Box marginY={1}>
            <Spinner color="yellow" />
            <Text color="yellow"> {message}</Text>
        </Box>
    );
}

interface ToolExecutionProps {
    toolName: string;
    args?: Record<string, unknown>;
    status: 'running' | 'completed' | 'error';
    result?: string;
}

/**
 * exibe execucao de ferramenta com borda branca
 */
export function ToolExecution({ toolName, args, status, result }: ToolExecutionProps) {
    const borderColor = status === 'error' ? 'red' : 'gray';

    // formata argumentos de forma legivel
    const formatArgs = (args: Record<string, unknown> | undefined): string => {
        if (!args) return '';
        const entries = Object.entries(args);
        if (entries.length === 0) return '';

        // mostra apenas args importantes
        const importantKeys = ['command', 'path', 'pattern', 'filename', 'content'];
        const filtered = entries.filter(([key]) => importantKeys.includes(key));

        if (filtered.length === 0) {
            // fallback para primeiro argumento
            const [key, value] = entries[0];
            return `${key}: ${String(value).slice(0, 50)}`;
        }

        return filtered.map(([key, value]) => {
            const strValue = String(value);
            return `${key}: ${strValue.length > 50 ? strValue.slice(0, 50) + '...' : strValue}`;
        }).join(', ');
    };

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={borderColor}
            paddingX={1}
            paddingY={0}
            marginY={0}
        >
            {/* header com ferramenta */}
            <Box>
                {status === 'running' && <Spinner color="cyan" />}
                {status === 'error' && <Text color="red">✗</Text>}
                <Text color="#00266b" bold> {toolName}</Text>
                {args && (
                    <Text dimColor> ({formatArgs(args)})</Text>
                )}
            </Box>

            {/* resultado truncado */}
            {result && status !== 'running' && (
                <Box marginLeft={2}>
                    <Text dimColor wrap="truncate">
                        {result.length > 100 ? result.slice(0, 100) + '...' : result}
                    </Text>
                </Box>
            )}
        </Box>
    );
}
