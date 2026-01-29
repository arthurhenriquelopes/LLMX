// configuracao de modelos e provedores

export interface Provider {
    name: string;
    baseUrl?: string;
    models: string[];
    envVar: string;
}

export const PROVIDERS: Record<string, Provider> = {
    groq: {
        name: 'Groq',
        models: [
            'llama-3.3-70b-versatile',
            'llama-3.1-70b-versatile',
            'mixtral-8x7b-32768',
        ],
        envVar: 'GROQ_API_KEY',
    },
    manus: {
        name: 'Manus',
        baseUrl: 'https://api.manus.nz/v1',
        models: [
            'gpt-4o-mini',
            'gpt-4o',
            'claude-3-5-sonnet-20241022',
            'gemini-2.0-flash-exp',
        ],
        envVar: 'MANUS_API_KEY',
    },
    google: {
        name: 'Google AI Studio',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        models: [
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
        ],
        envVar: 'GOOGLE_API_KEY',
    },
};

// modelo padrao
export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
export const DEFAULT_PROVIDER = 'groq';

/**
 * obtem provedor do modelo
 */
export function getProviderForModel(model: string): string {
    for (const [provider, config] of Object.entries(PROVIDERS)) {
        if (config.models.includes(model)) {
            return provider;
        }
    }
    return DEFAULT_PROVIDER;
}

/**
 * obtem api key do ambiente
 */
export function getApiKey(provider: string): string | undefined {
    const config = PROVIDERS[provider];
    if (!config) return undefined;
    return process.env[config.envVar];
}

/**
 * lista todos os modelos disponiveis
 */
export function getAllModels(): Array<{ provider: string; model: string }> {
    const models: Array<{ provider: string; model: string }> = [];

    for (const [provider, config] of Object.entries(PROVIDERS)) {
        for (const model of config.models) {
            models.push({ provider, model });
        }
    }

    return models;
}
