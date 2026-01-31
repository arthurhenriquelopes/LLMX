import React from 'react';
import { Box, Text } from 'ink';
import { ExpandableText, MAX_WIDTH } from './ExpandableText.js';

export interface Suggestion {
    label: string;
    value: string;
    description?: string;
    matchedIndex?: number;
}

interface SuggestionsDisplayProps {
    suggestions: Suggestion[];
    activeIndex: number;
    isLoading?: boolean;
    width?: number; // Optional, defaults to auto/full
    scrollOffset: number;
    userInput: string;
    maxSuggestions?: number;
}

// Cores simplificadas
const THEME = {
    text: {
        primary: '#E0E0E0',
        secondary: '#808080',
        accent: '#00D9FF' // Cyan
    }
};

export const MAX_SUGGESTIONS_TO_SHOW = 8;
export { MAX_WIDTH };

export function SuggestionsDisplay({
    suggestions,
    activeIndex,
    isLoading = false,
    width,
    scrollOffset,
    userInput,
    maxSuggestions = MAX_SUGGESTIONS_TO_SHOW,
}: SuggestionsDisplayProps) {

    if (isLoading) {
        return (
            <Box paddingX={1}>
                <Text color="gray">Loading suggestions...</Text>
            </Box>
        );
    }

    if (suggestions.length === 0) {
        return null;
    }

    // Calculate the visible slice based on scrollOffset
    const startIndex = scrollOffset;
    const endIndex = Math.min(
        scrollOffset + maxSuggestions,
        suggestions.length,
    );
    const visibleSuggestions = suggestions.slice(startIndex, endIndex);

    // Calcula largura da coluna de comando
    const maxLabelLength = Math.max(
        ...suggestions.map((s) => s.label.length),
    );
    const commandColumnWidth = Math.max(maxLabelLength + 2, 15); // Min 15 chars

    return (
        <Box flexDirection="column" paddingX={1} borderStyle="single" borderColor="gray">
            {scrollOffset > 0 && <Text color={THEME.text.primary}>▲</Text>}

            {visibleSuggestions.map((suggestion, index) => {
                const originalIndex = startIndex + index;
                const isActive = originalIndex === activeIndex;
                const textColor = isActive ? THEME.text.accent : THEME.text.secondary;

                return (
                    <Box key={`${suggestion.value}-${originalIndex}`} flexDirection="row">
                        {/* Coluna Comando */}
                        <Box width={commandColumnWidth} flexShrink={0}>
                            <ExpandableText
                                label={suggestion.label}
                                matchedIndex={suggestion.matchedIndex}
                                userInput={userInput}
                                textColor={textColor}
                            />
                        </Box>

                        {/* Coluna Descrição */}
                        {suggestion.description && (
                            <Box flexGrow={1} paddingLeft={2}>
                                <Text color={isActive ? THEME.text.primary : 'gray'} wrap="truncate">
                                    {suggestion.description}
                                </Text>
                            </Box>
                        )}

                        {/* Indicador Ativo */}
                        {isActive && (
                            <Box marginLeft={1}>
                                <Text color={THEME.text.accent}>{'<'}</Text>
                            </Box>
                        )}
                    </Box>
                );
            })}

            {endIndex < suggestions.length && <Text color="gray">▼</Text>}

            <Box marginTop={0}>
                <Text color="gray" dimColor>
                    ({activeIndex + 1}/{suggestions.length}) {suggestions[activeIndex]?.description}
                </Text>
            </Box>
        </Box>
    );
}
