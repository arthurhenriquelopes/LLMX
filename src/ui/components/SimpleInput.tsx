import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { useFocus } from '../hooks/useFocus.js';
import clipboardy from 'clipboardy';
import { SuggestionsDisplay, Suggestion, MAX_SUGGESTIONS_TO_SHOW } from './SuggestionsDisplay.js';

export interface SimpleInputProps {
    placeholder?: string;
    onSubmit: (value: string) => void;
    disabled?: boolean;
    suggestions?: string[];
}

const COMMAND_DESCRIPTIONS: Record<string, string> = {
    '/help': 'Mostra mensagens de ajuda',
    '/model': 'Lista ou troca de modelo de IA',
    '/clear': 'Limpa o histórico do chat',
    '/exit': 'Encerra o aplicativo LLMX'
};

// Unified state to prevent cursor desync
interface InputState {
    value: string;
    cursorPos: number;
}

export function SimpleInput({ placeholder = 'Type your message...', onSubmit, disabled = false, suggestions = [] }: SimpleInputProps) {
    // State unificado
    const [inputState, setInputState] = useState<InputState>({ value: '', cursorPos: 0 });
    const { value, cursorPos } = inputState;

    // Suggestion State
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);

    const isFocused = useFocus();
    const potentialEscapeSequence = useRef(false);

    const showSuggestions = value.startsWith('/') && suggestions.length > 0;

    const filteredSuggestions: Suggestion[] = showSuggestions
        ? suggestions
            .filter(s => s.startsWith(value))
            .map(s => ({
                label: s,
                value: s,
                description: COMMAND_DESCRIPTIONS[s] || '',
                matchedIndex: 0
            }))
        : [];

    const hasSuggestions = filteredSuggestions.length > 0;

    // Helper para atualizar state atomicamente
    const updateInput = (newValue: string, newCursor: number) => {
        setInputState({ value: newValue, cursorPos: newCursor });
    };

    // Reset externo
    useEffect(() => {
        if (inputState.value === '' && cursorPos !== 0) {
            // No-op para resiliencia
        }
    }, [inputState.value]);

    // Disable mouse tracking to prevent garbage in terminal
    useEffect(() => {
        // Explicitly DISABLE mouse tracking modes that might be enabled
        process.stdout.write('\x1b[?1000l'); // Disable basic mouse tracking
        process.stdout.write('\x1b[?1002l'); // Disable button-event tracking
        process.stdout.write('\x1b[?1003l'); // Disable all-motion tracking
        process.stdout.write('\x1b[?1006l'); // Disable SGR extended mouse mode
        process.stdout.write('\x1b[?1004l'); // Disable focus reporting
        return () => {
            // Cleanup (keep disabled)
        };
    }, []);

    useInput((input, key) => {
        if (disabled) return;

        // --- COMPREHENSIVE Mouse/Focus Escape Sequence Filtering ---
        // Filter out ALL mouse-related escape sequences that may leak through

        // Full escape sequences
        if (input === '\x1b[I' || input === '\x1b[O') return;
        if (input.startsWith('\x1b[M')) return;
        if (input.startsWith('\x1b[<')) return; // SGR mouse mode

        // Partial sequences (when Ink splits them)
        if (input === '[I' || input === '[O') return;
        if (input.startsWith('[M') || input.startsWith('[<')) return;
        if (input === 'M' && potentialEscapeSequence.current) return;

        // Check for mouse coordinate garbage (common pattern: single chars like digits after [M)
        // Mouse reports look like: ESC[M<button><x><y> where x,y are characters
        if (/^\[M.{0,3}$/.test(input)) return;
        if (/^M[#\x20-\x7f]{0,3}$/.test(input)) return; // Partial mouse sequence

        let cleanInput = input;

        // --- Input Filtering ---
        if (cleanInput === '\x1b' || cleanInput === '\x1b[') {
            potentialEscapeSequence.current = true;
            return;
        }
        if (potentialEscapeSequence.current) {
            potentialEscapeSequence.current = false;
            // Filter partial escape sequences
            if (cleanInput === 'I' || cleanInput === 'O') return;
            if (cleanInput === '[I' || cleanInput === '[O') return;
            if (cleanInput.startsWith('M') || cleanInput.startsWith('[M')) return;
            if (cleanInput.startsWith('<') || cleanInput.startsWith('[<')) return;
        }
        if (cleanInput === '\x1b[I' || cleanInput === '\x1b[O') return;
        if (cleanInput === '[I' || cleanInput === '[O') return;

        // Remove ANY remaining escape sequences aggressively
        cleanInput = cleanInput.replace(/\x1b\[[^\x40-\x7e]*[\x40-\x7e]/g, ''); // Remove full ANSI sequences
        cleanInput = cleanInput.replace(/\x1b\[[IO]/g, ''); // Focus sequences
        cleanInput = cleanInput.replace(/\[M[^\n]{0,3}/g, ''); // Partial mouse sequences
        cleanInput = cleanInput.replace(/M[#\x20-\x3f][^\n]{0,2}/g, ''); // Mouse coordinate garbage

        if (cleanInput.length === 0 && !key.return && !key.delete && !key.backspace && !key.leftArrow && !key.rightArrow && !key.upArrow && !key.downArrow && !key.home && !key.end && !key.pageDown && !key.pageUp && !key.ctrl && !key.meta && !key.tab) {
            return;
        }

        // --- Navegação Sugestões ---
        if (hasSuggestions) {
            if (key.upArrow) {
                const newIndex = Math.max(0, suggestionIndex - 1);
                setSuggestionIndex(newIndex);
                if (newIndex < scrollOffset) setScrollOffset(newIndex);
                return;
            }
            if (key.downArrow) {
                const newIndex = Math.min(filteredSuggestions.length - 1, suggestionIndex + 1);
                setSuggestionIndex(newIndex);
                if (newIndex >= scrollOffset + MAX_SUGGESTIONS_TO_SHOW) setScrollOffset(newIndex - MAX_SUGGESTIONS_TO_SHOW + 1);
                return;
            }
            if (key.tab) {
                const selected = filteredSuggestions[suggestionIndex];
                if (selected) {
                    updateInput(selected.value + ' ', selected.value.length + 1);
                }
                return;
            }
        }

        // --- Navegação Input ---
        if (key.leftArrow) {
            updateInput(value, Math.max(0, cursorPos - 1));
            return;
        }
        if (key.rightArrow) {
            updateInput(value, Math.min(value.length, cursorPos + 1));
            return;
        }
        if (key.home || (key.ctrl && input === 'a')) {
            updateInput(value, 0);
            return;
        }
        if (key.end || (key.ctrl && input === 'e')) {
            updateInput(value, value.length);
            return;
        }

        // --- Edição ---
        if (key.backspace || key.delete || input === '\x08' || input === '\x7f') {
            if (cursorPos > 0) {
                const nextValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
                updateInput(nextValue, cursorPos - 1);
            }
            return;
        }

        if (input === '\x1b[3~') { // Del
            if (cursorPos < value.length) {
                const nextValue = value.slice(0, cursorPos) + value.slice(cursorPos + 1);
                updateInput(nextValue, cursorPos);
            }
            return;
        }

        if ((key.ctrl && input === 'u') || input === '\x15') {
            updateInput('', 0);
            return;
        }

        if ((key.ctrl && input === 'k') || input === '\x0b') {
            updateInput(value.slice(0, cursorPos), cursorPos);
            return;
        }

        // --- Clipboard ---
        if ((key.ctrl && input === 'c') || input === '\x03') {
            if (value) { try { clipboardy.writeSync(value); } catch (e) { } }
            return;
        }
        if ((key.ctrl && input === 'v') || input === '\x16') {
            try {
                const text = clipboardy.readSync();
                if (text) {
                    const cleanPaste = text.replace(/[\x00-\x09\x0b-\x1f\x7f\x1b]/g, '');
                    updateInput(
                        value.slice(0, cursorPos) + cleanPaste + value.slice(cursorPos),
                        cursorPos + cleanPaste.length
                    );
                }
            } catch (e) { }
            return;
        }

        if ((key.ctrl && input === 'd') || input === '\x04') {
            process.exit(0);
        }

        // --- Submit ---
        if (key.return) {
            if (value.trim()) {
                onSubmit(value);
                // Reset state
                setInputState({ value: '', cursorPos: 0 });
                setSuggestionIndex(0);
                setScrollOffset(0);
            }
            return;
        }

        if (key.ctrl || key.meta) return;

        cleanInput = cleanInput.replace(/[\x00-\x09\x0b-\x1f\x7f\x1b]/g, '');
        if (cleanInput.length > 0) {
            updateInput(
                value.slice(0, cursorPos) + cleanInput + value.slice(cursorPos),
                cursorPos + cleanInput.length
            );
        }
    });

    const borderColor = isFocused ? '#00266b' : 'gray';
    const showCursor = isFocused && !disabled;

    if (!value && isPlaceholderActive()) {
        return (
            <Box borderStyle="round" borderColor={borderColor} paddingX={1}>
                <Text color="#00266b">&gt; </Text>
                <Text dimColor>{placeholder}</Text>
                {showCursor && <Text inverse> </Text>}
            </Box>
        );
    }

    const beforeCursor = value.slice(0, cursorPos);
    const atCursor = value.slice(cursorPos, cursorPos + 1);
    const afterCursor = value.slice(cursorPos + 1);

    const suggestionsNode = hasSuggestions ? (
        <SuggestionsDisplay
            suggestions={filteredSuggestions}
            activeIndex={suggestionIndex}
            scrollOffset={scrollOffset}
            userInput={value}
            width={80}
        />
    ) : null;

    return (
        <>
            {suggestionsNode}
            <Box borderStyle="round" borderColor={borderColor} paddingX={1}>
                <Text color="#00266b">&gt; </Text>
                <Text>{beforeCursor}</Text>
                {showCursor ? (
                    <Text inverse>{atCursor || ' '}</Text>
                ) : (
                    <Text>{atCursor}</Text>
                )}
                <Text>{afterCursor}</Text>
            </Box>
        </>
    );

    function isPlaceholderActive() {
        return !value;
    }
}