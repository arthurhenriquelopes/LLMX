import React from 'react';
import { Box, Text, useStdout } from 'ink';

// logo com linhas separadas para degrade
const LOGO_LINES = [
    '      ___       ___       ___           __      ',
    '     /  /\\     /  /\\     /  /\\         |  |\\    ',
    '    /  /:/    /  /:/    /  /::|        |  |:|   ',
    '   /  /:/    /  /:/    /  /:|:|        |  |:|   ',
    '  /  /:/    /  /:/    /  /:/|:|__      |__|:|__ ',
    ' /__/:/    /__/:/    /__/:/_|:::::\\ ____/__/::::\\',
    ' \\  \\:\\    \\  \\:\\    \\__\\/  /~~/:/ \\__\\::::/~~~~',
    '  \\  \\:\\    \\  \\:\\         /  /:/     |~~|:|    ',
    '   \\  \\:\\    \\  \\:\\       /  /:/      |  |:|    ',
    '    \\  \\:\\    \\  \\:\\     /__/:/       |__|:|    ',
    '     \\__\\/     \\__\\/     \\__\\/         \\__\\|    ',
];

// cores do degrade azul (RGB)
export const BLUE_GRADIENT = [
    '#00D9FF', // cyan brilhante
    '#00C8FF', // cyan
    '#00B8FF', // azul claro
    '#00A8FF', // azul
    '#0098FF', // azul medio
    '#0088EE', // azul
    '#0078DD', // azul escuro
    '#0068CC', // azul escuro
    '#0058BB', // azul muito escuro
    '#0048AA', // azul muito escuro
    '#003899', // azul profundo
];

/**
 * componente de logo com tratamento de redimensionamento para evitar artefatos
 */
export function Logo() {
    // força re-render quando terminal redimensiona
    const { stdout } = useStdout();
    const width = stdout?.columns;

    return (
        <Box flexDirection="column" key={width}>
            {LOGO_LINES.map((line, idx) => (
                <Text key={idx} color={BLUE_GRADIENT[idx]}>
                    {line}
                </Text>
            ))}
        </Box>
    );
}
