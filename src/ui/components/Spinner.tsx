// componente spinner animado para indicar processamento

import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

// frames do spinner (estilo dots)
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface SpinnerProps {
    color?: string;
    label?: string;
}

/**
 * componente de spinner animado
 */
export function Spinner({ color = 'cyan', label }: SpinnerProps) {
    const [frameIndex, setFrameIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length);
        }, 80);

        return () => clearInterval(interval);
    }, []);

    return (
        <Text color={color}>
            {SPINNER_FRAMES[frameIndex]}
            {label && <Text> {label}</Text>}
        </Text>
    );
}
