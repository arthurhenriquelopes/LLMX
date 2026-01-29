// definicoes de ferramentas para api groq - registro consolidado de ferramentas

export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, any>;
            required: string[];
        };
    };
}

// ferramentas de sistema de arquivos
export const FILESYSTEM_TOOLS: ToolDefinition[] = [
    {
        type: 'function',
        function: {
            name: 'list_directory',
            description: 'Lista arquivos e pastas em um diretorio. Retorna nome, tipo e tamanho.',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Caminho do diretorio para listar. Use ~ para home do usuario.',
                    },
                    show_hidden: {
                        type: 'boolean',
                        description: 'Se deve mostrar arquivos ocultos (comecam com .)',
                        default: false,
                    },
                },
                required: ['path'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'find_file',
            description: 'Procura arquivos por nome em um diretorio e subdiretorios.',
            parameters: {
                type: 'object',
                properties: {
                    pattern: {
                        type: 'string',
                        description: "Padrao de nome do arquivo (ex: '*.pdf', 'documento*')",
                    },
                    search_path: {
                        type: 'string',
                        description: 'Diretorio onde procurar. Padrao: home do usuario.',
                        default: '~',
                    },
                    max_results: {
                        type: 'integer',
                        description: 'Numero maximo de resultados',
                        default: 20,
                    },
                },
                required: ['pattern'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'read_file',
            description: 'Le o conteudo de um arquivo de texto.',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Caminho do arquivo para ler',
                    },
                    max_lines: {
                        type: 'integer',
                        description: 'Numero maximo de linhas para ler',
                        default: 100,
                    },
                },
                required: ['path'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_file_size',
            description: 'Obtem o tamanho de um arquivo ou diretorio.',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Caminho do arquivo ou diretorio',
                    },
                },
                required: ['path'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_path',
            description: 'Obtem o caminho absoluto de um arquivo, comando ou aplicativo.',
            parameters: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Nome do arquivo, comando ou aplicativo',
                    },
                },
                required: ['name'],
            },
        },
    },
];

// ferramentas de sistema
export const SYSTEM_TOOLS: ToolDefinition[] = [
    {
        type: 'function',
        function: {
            name: 'get_disk_usage',
            description: 'Mostra uso de espaco em disco das particoes.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_memory_info',
            description: 'Mostra informacoes sobre uso de memoria RAM e swap.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_system_info',
            description: 'Mostra informacoes do sistema: OS, kernel, hostname, uptime.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_processes',
            description: 'Lista os processos que mais consomem CPU ou memoria.',
            parameters: {
                type: 'object',
                properties: {
                    sort_by: {
                        type: 'string',
                        description: "Ordenar por 'cpu' ou 'memory'",
                        enum: ['cpu', 'memory'],
                        default: 'cpu',
                    },
                    limit: {
                        type: 'integer',
                        description: 'Numero de processos para mostrar',
                        default: 10,
                    },
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_package_info',
            description: 'Obtem informacoes sobre um pacote instalado ou disponivel.',
            parameters: {
                type: 'object',
                properties: {
                    package_name: {
                        type: 'string',
                        description: 'Nome do pacote para consultar',
                    },
                },
                required: ['package_name'],
            },
        },
    },
];

// ferramentas de executor
export const EXECUTOR_TOOLS: ToolDefinition[] = [
    {
        type: 'function',
        function: {
            name: 'run_command',
            description: 'Executa um comando shell. Para comandos que modificam o sistema, use run_sudo_command.',
            parameters: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: 'O comando a ser executado (sem sudo)',
                    },
                },
                required: ['command'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'run_sudo_command',
            description: 'Executa um comando com privilegios sudo. SEMPRE requer confirmacao do usuario.',
            parameters: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: "O comando a ser executado com sudo (sem incluir 'sudo' no comando)",
                    },
                },
                required: ['command'],
            },
        },
    },
];

// todas as ferramentas disponiveis
export const ALL_TOOLS = [...FILESYSTEM_TOOLS, ...SYSTEM_TOOLS, ...EXECUTOR_TOOLS];

// busca por nome
export const TOOLS_BY_NAME = new Map(
    ALL_TOOLS.map(tool => [tool.function.name, tool])
);

/**
 * retorna apenas as ferramentas especificadas
 */
export function getToolsByNames(toolNames: string[]): ToolDefinition[] {
    return toolNames
        .map(name => TOOLS_BY_NAME.get(name))
        .filter(Boolean) as ToolDefinition[];
}
