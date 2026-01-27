"""Pacote de ferramentas do llmx."""

from .filesystem import FILESYSTEM_TOOLS, execute_filesystem_tool
from .system import SYSTEM_TOOLS, execute_system_tool
from .executor import EXECUTOR_TOOLS, execute_executor_tool
from .scripts import SCRIPT_TOOLS, execute_script_tool

# todas as ferramentas disponiveis para o agente
ALL_TOOLS = FILESYSTEM_TOOLS + SYSTEM_TOOLS + EXECUTOR_TOOLS + SCRIPT_TOOLS

# dicionario para lookup rapido por nome
TOOLS_BY_NAME = {t["function"]["name"]: t for t in ALL_TOOLS}


def get_tools_by_names(tool_names: list) -> list:
    """
    Retorna apenas as ferramentas especificadas.
    
    args:
        tool_names: lista de nomes de ferramentas
        
    returns:
        lista de definicoes de ferramentas
    """
    return [TOOLS_BY_NAME[name] for name in tool_names if name in TOOLS_BY_NAME]

def execute_tool(tool_name: str, arguments: dict) -> str:
    """Executa uma ferramenta pelo nome com os argumentos fornecidos."""
    
    # ferramentas de sistema de arquivos
    filesystem_tool_names = [t["function"]["name"] for t in FILESYSTEM_TOOLS]
    if tool_name in filesystem_tool_names:
        return execute_filesystem_tool(tool_name, arguments)
    
    # ferramentas de sistema
    system_tool_names = [t["function"]["name"] for t in SYSTEM_TOOLS]
    if tool_name in system_tool_names:
        return execute_system_tool(tool_name, arguments)
    
    # ferramentas de execucao
    executor_tool_names = [t["function"]["name"] for t in EXECUTOR_TOOLS]
    if tool_name in executor_tool_names:
        return execute_executor_tool(tool_name, arguments)
    
    # ferramentas de script
    script_tool_names = [t["function"]["name"] for t in SCRIPT_TOOLS]
    if tool_name in script_tool_names:
        return execute_script_tool(tool_name, arguments)
    
    return f"erro: tool '{tool_name}' nao encontrada."
