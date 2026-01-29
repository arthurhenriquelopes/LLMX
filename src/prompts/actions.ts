// micro-prompts de ações para o llmx

export interface Action {
    prompt: string;
    tools: string[];
    keywords: string[];
}

export const EXTRACT_ACTION: Action = {
    prompt: `EXTRAIR ARQUIVO:
1. PRIMEIRO: find_file("*nome*") - encontre o arquivo
2. DEPOIS: use o CAMINHO REAL retornado
3. run_command("mkdir -p destino && unrar x '/CAMINHO_REAL' destino/")

Formatos: unrar x (rar), unzip -d (zip), tar -xzf -C (tar.gz)
Após extrair, informe: "Arquivo extraído para [pasta]"
`,
    tools: ['find_file', 'run_command'],
    keywords: ['extrair', 'extraia', 'extract', 'unrar', 'unzip', 'descompactar', 'descompacte'],
};

export const COMPRESS_ACTION: Action = {
    prompt: `COMPACTAR:
run_command("cd ~/pasta && rar a ~/Desktop/saida.rar .")

Formatos: rar a (rar), zip -r (zip), tar -czf (tar.gz)
Após compactar, informe: "Arquivo criado: [caminho]"
`,
    tools: ['run_command'],
    keywords: ['compactar', 'compacte', 'compress', 'zipar', 'arquivar'],
};

export const COPY_ACTION: Action = {
    prompt: `COPIAR:
run_command("cp -r '/origem' '/destino/'")

Use -r para pastas. Após copiar, informe: "Copiado para [destino]"
`,
    tools: ['find_file', 'run_command'],
    keywords: ['copiar', 'copie', 'copy', 'cp'],
};

export const MOVE_ACTION: Action = {
    prompt: `MOVER:
run_command("mv '/origem' '/destino/'")

Após mover, informe: "Movido para [destino]"
`,
    tools: ['find_file', 'run_command'],
    keywords: ['mover', 'mova', 'move', 'mv'],
};

export const RENAME_ACTION: Action = {
    prompt: `RENOMEAR:
run_command("mv '/caminho/antigo' '/caminho/novo'")

Após renomear, informe: "Renomeado de [antigo] para [novo]"
`,
    tools: ['find_file', 'run_command'],
    keywords: ['renomear', 'renomeie', 'rename'],
};

export const DELETE_ACTION: Action = {
    prompt: `DELETAR:
run_command("rm -rf '/caminho/arquivo'")

Use -rf para pastas. Após deletar, informe: "[arquivo/pasta] removido"
`,
    tools: ['find_file', 'run_command'],
    keywords: ['deletar', 'delete', 'remover', 'remova', 'apagar', 'apague', 'rm'],
};

export const CREATE_DIR_ACTION: Action = {
    prompt: `CRIAR PASTA:
run_command("mkdir -p '/caminho/nova_pasta'")

Após criar, informe: "Pasta criada: [caminho]"
`,
    tools: ['run_command'],
    keywords: ['criar pasta', 'crie pasta', 'crie a pasta', 'mkdir', 'nova pasta'],
};

export const INSTALL_ACTION: Action = {
    prompt: `INSTALAÇÃO DE PACOTES:
Para instalar: use run_sudo_command com "apt install -y <pacote>"
Antes de instalar, verifique se já existe com get_package_info.

Após instalar, informe: "[pacote] instalado com sucesso"
Se cancelado pelo usuário, informe: "Instalação cancelada"
`,
    tools: ['run_sudo_command', 'get_package_info'],
    keywords: ['instalar', 'instale', 'install', 'apt install', 'apt-get', 'atualize', 'update', 'upgrade'],
};

export const SCRIPT_ACTION: Action = {
    prompt: `CRIAR SCRIPT:
Use create_script para criar um script shell.
Exemplo:
Tool: create_script
Arguments: {"filename": "backup.sh", "content": "#!/bin/bash\\ncp -r ~/Documents ~/backup/"}

Após criar, mostre o conteúdo do script e onde foi salvo.
`,
    tools: ['create_script', 'run_script'],
    keywords: ['script', 'criar script', 'crie script', 'bash', 'shell', 'automatizar', 'automatize'],
};

export const QUERY_ACTION: Action = {
    prompt: `CONSULTAR SOFTWARE/PROCESSOS:
Para verificar pacotes: get_package_info("nome_pacote")
Para ver processos: list_processes("cpu") ou list_processes("memory")
Para info do sistema: get_system_info()

SEMPRE mostre os resultados encontrados de forma organizada.
`,
    tools: ['get_package_info', 'list_processes', 'get_system_info'],
    keywords: ['instalado', 'versao', 'processo', 'processos', 'rodando', 'executando', 'pacote', 'software'],
};

export const HARDWARE_ACTION: Action = {
    prompt: `CONSULTAR HARDWARE/RECURSOS:
Para memória RAM: get_memory_info()
Para uso de disco: get_disk_usage()
Para info do sistema (CPU, kernel): get_system_info()

SEMPRE apresente os dados de forma clara:
- "Memória: X GB usados de Y GB (Z%)"
- "Disco: X% usado (Y GB de Z GB)"
`,
    tools: ['get_memory_info', 'get_disk_usage', 'get_system_info'],
    keywords: ['ram', 'memoria', 'disco', 'espaco', 'cpu', 'hardware', 'kernel', 'sistema operacional'],
};

// mapa de ação para micro-prompt e tools
export const ACTIONS: Record<string, Action> = {
    extract: EXTRACT_ACTION,
    compress: COMPRESS_ACTION,
    copy: COPY_ACTION,
    move: MOVE_ACTION,
    rename: RENAME_ACTION,
    delete: DELETE_ACTION,
    create_dir: CREATE_DIR_ACTION,
    install: INSTALL_ACTION,
    script: SCRIPT_ACTION,
    query: QUERY_ACTION,
    hardware: HARDWARE_ACTION,
};
