import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SimpleInputProps {
    placeholder?: string;
    onSubmit: (value: string) => void;
    disabled?: boolean;
}

import { useFocus } from '../hooks/useFocus.js';

export function SimpleInput({ placeholder = 'Type your message...', onSubmit, disabled = false }: SimpleInputProps) {
    const [value, setValue] = useState('');
    const isFocused = useFocus();

    useInput((input, key) => {
        if (disabled) return;

        // filtra codigos de foco do terminal (\x1b[I e \x1b[O)
        // verifica se a entrada comeca exatamente ou contem as sequencias de controle
        if (input.includes('\x1b[I') || input.includes('\x1b[O') || input.startsWith('\x1b[')) {
            return;
        }

        if (key.return) {
            if (value.trim()) {
                onSubmit(value);
                setValue('');
            }
            return;
        }

        if (key.backspace || key.delete) {
            setValue(v => v.slice(0, -1));
            return;
        }

        // caracteres regulares (ignora ctrl/meta e sequencias de escape)
        if (!key.ctrl && !key.meta && input.length === 1 && /^[\x20-\x7E]$/.test(input)) {
            setValue(v => v + input);
        }
    });

    const displayText = value || placeholder;
    const isPlaceholder = !value;
    const borderColor = isFocused ? '#00266b' : 'gray';

    // cursor visual
    const cursor = isFocused ? <Text inverse>T</Text> : null;
    // usando um bloco solido para cursor
    const showCursor = isFocused && !disabled;

    return (
        <Box borderStyle="round" borderColor={borderColor} paddingX={1}>
            <Text color="#00266b">&gt; </Text>
            <Text dimColor={isPlaceholder}>{displayText}</Text>
            {showCursor && <Text inverse> </Text>}
        </Box>
    );
}
