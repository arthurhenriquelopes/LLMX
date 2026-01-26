"""Router para classificar requests do usuario e selecionar prompt apropriado."""

from .base import BASE_PROMPT
from .filesystem import FILESYSTEM_PROMPT
from .system_info import SYSTEM_INFO_PROMPT
from .commands import COMMANDS_PROMPT
from .scripts import SCRIPTS_PROMPT

# categorias e suas keywords
CATEGORY_KEYWORDS = {
    "filesystem": [
        "listar", "lista", "ls", "pasta", "diretorio", "diretório", "folder",
        "arquivos", "files", "tamanho", "size", "buscar",
        "encontrar", "find", "procurar", "search", "ler", "read", "conteudo",
        "conteúdo", "abrir", "visualizar", "mostrar", "ver", "caminho", "path", 
        "onde esta", "onde está", "executavel", "executável", "which"
    ],
    "system_info": [
        "disco", "disk", "espaco", "espaço", "storage", "memoria", "memória",
        "ram", "memory", "cpu", "processador", "processo", "processos", 
        "process", "pacote", "pacotes", "package", "instalado",
        "sistema", "system", "info", "informacao", "informação", "uptime",
        "kernel", "versao", "versão"
    ],
    "commands": [
        "executar", "execute", "rodar", "run",
        "compactar", "compacte", "compress", "zip", "rar", "tar", "descompactar",
        "extract", "copiar", "copie", "copy", "cp", "mover", "mova", "move", "mv",
        "renomear", "renomeie", "rename", "deletar", "delete", "rm", "remover",
        "instalar", "instale", "install", "desinstalar", "uninstall", 
        "atualizar", "atualize", "update", "upgrade", "apt",
        "criar pasta", "crie pasta", "mkdir"
    ],
    "scripts": [
        "script", "scripts", "bash", "shell", "automacao", "automação",
        "automatizar", "automatize", "automate", "cron", "cronjob", "agendar", "schedule",
        "criar script", "create script", "escrever script", "write script",
        "limpeza automatica", "limpeza automática"
    ]
}

# keywords de acao que tem prioridade absoluta (bypass normal scoring)
PRIORITY_KEYWORDS = {
    "commands": [
        "compactar", "compacte", "rar", "zip", "tar",
        "extrair", "extraia", "extract", "unrar", "unzip", "descompactar", "descompacte",
        "copiar", "copie", "mover", "mova",
        "instalar", "instale", "deletar", "delete", "remover", "remova",
        "renomear", "renomeie", "criar pasta", "crie pasta", "crie a pasta",
        "atualize", "atualizar", "apt install", "apt update", "apt upgrade"
    ],
    "scripts": [
        "criar script", "crie script", "crie um script", 
        "automatize", "automatizar", "automacao", "automação"
    ],
    "filesystem": [
        "caminho do", "onde esta o", "onde está o", "qual o caminho"
    ]
}

# mapa de categoria para prompt
CATEGORY_PROMPTS = {
    "filesystem": FILESYSTEM_PROMPT,
    "system_info": SYSTEM_INFO_PROMPT,
    "commands": COMMANDS_PROMPT,
    "scripts": SCRIPTS_PROMPT,
    "general": BASE_PROMPT
}


def classify_request(user_message: str) -> str:
    """
    Classifica o request do usuario em uma categoria.
    
    args:
        user_message: mensagem do usuario
        
    returns:
        categoria identificada (filesystem, system_info, commands, scripts, general)
    """
    message_lower = user_message.lower()
    
    # primeiro verifica keywords de prioridade
    for category, keywords in PRIORITY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in message_lower:
                return category
    
    # depois conta matches por categoria normal
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in message_lower)
        if score > 0:
            scores[category] = score
    
    # retorna categoria com maior score, ou general se nenhum match
    if scores:
        return max(scores, key=scores.get)
    return "general"


def get_prompt_for_category(category: str) -> str:
    """
    Retorna o prompt especializado para uma categoria.
    
    args:
        category: categoria do request
        
    returns:
        prompt especializado
    """
    return CATEGORY_PROMPTS.get(category, BASE_PROMPT)


def get_prompt_for_request(user_message: str) -> tuple[str, str]:
    """
    Classifica o request e retorna o prompt apropriado.
    
    args:
        user_message: mensagem do usuario
        
    returns:
        tupla (categoria, prompt)
    """
    category = classify_request(user_message)
    prompt = get_prompt_for_category(category)
    return category, prompt
