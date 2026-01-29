import { useStdin, useStdout, useInput } from 'ink';
import { useEffect, useState } from 'react';

// codigos de escape ansi para habilitar/desabilitar relatorio de foco do terminal
export const ENABLE_FOCUS_REPORTING = '\x1b[?1004h';
export const DISABLE_FOCUS_REPORTING = '\x1b[?1004l';

// codigos de escape ansi para eventos de foco
export const FOCUS_IN = '\x1b[I';
export const FOCUS_OUT = '\x1b[O';

export const useFocus = () => {
    const { stdin } = useStdin();
    const { stdout } = useStdout();
    const [isFocused, setIsFocused] = useState(true);

    useEffect(() => {
        const handleData = (data: Buffer) => {
            const sequence = data.toString();
            if (sequence.includes(FOCUS_IN)) {
                setIsFocused(true);
            } else if (sequence.includes(FOCUS_OUT)) {
                setIsFocused(false);
            }
        };

        // habilita relatorio de foco
        stdout?.write(ENABLE_FOCUS_REPORTING);
        stdin?.on('data', handleData);

        return () => {
            // desabilita relatorio de foco na limpeza
            stdout?.write(DISABLE_FOCUS_REPORTING);
            stdin?.removeListener('data', handleData);
        };
    }, [stdin, stdout]);

    // contorno: se o usuario digitar algo, devemos estar focados
    useInput(() => {
        if (!isFocused) {
            setIsFocused(true);
        }
    });

    return isFocused;
};
