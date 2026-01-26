"""Composer de prompts: concatena micro-prompts e faz cache."""

from functools import lru_cache
from .actions import ACTIONS

# base minimalista (compartilhada por todos)
BASE_PROMPT = """Você é LLMx para Linux. Responda em português.

REGRAS OBRIGATÓRIAS:
1. Use SEMPRE o caminho REAL retornado pelas ferramentas (ex: /home/arthur/Desktop/arquivo.rar)
2. NUNCA use placeholders como '/caminho/completo/' ou '$USER'
3. Após executar com sucesso: diga apenas "Pronto! [ação]"
4. Seja DIRETO - não explique, apenas execute

IMPORTANTE SOBRE FERRAMENTAS:
- Use APENAS o formato nativo de tool calling (JSON)
- NÃO escreva chamadas de função no texto (como <function>...)
"""

# prompts pre-cacheados para combinacoes comuns
CACHED_COMBOS = {
    frozenset(["extract"]): None,
    frozenset(["compress"]): None,
    frozenset(["copy"]): None,
    frozenset(["move"]): None,
    frozenset(["delete"]): None,
    frozenset(["copy", "delete"]): None,
    frozenset(["extract", "delete"]): None,
    frozenset(["rename", "delete"]): None,
}


def _build_prompt(actions: frozenset) -> tuple[str, list]:
    """
    Constroi prompt concatenando micro-prompts.
    
    args:
        actions: conjunto de acoes detectadas
        
    returns:
        tupla (prompt_completo, lista_de_tools)
    """
    prompt_parts = [BASE_PROMPT]
    all_tools = set()
    
    for action in actions:
        if action in ACTIONS:
            action_data = ACTIONS[action]
            prompt_parts.append(action_data["prompt"])
            all_tools.update(action_data["tools"])
    
    # adiciona tools basicas sempre disponiveis
    all_tools.add("list_directory")
    
    full_prompt = "\n".join(prompt_parts)
    return full_prompt, list(all_tools)


@lru_cache(maxsize=32)
def compose_prompt(actions: frozenset) -> tuple[str, list]:
    """
    Compoe prompt com cache LRU.
    
    args:
        actions: frozenset de acoes (hashable para cache)
        
    returns:
        tupla (prompt, tools)
    """
    return _build_prompt(actions)


def get_composed_prompt(action_list: list) -> tuple[str, list]:
    """
    Interface publica para compor prompt.
    
    args:
        action_list: lista de strings de acoes
        
    returns:
        tupla (prompt, tools)
    """
    actions = frozenset(action_list)
    return compose_prompt(actions)


def detect_actions(message: str) -> list:
    """
    Detecta todas as acoes em uma mensagem.
    
    args:
        message: mensagem do usuario
        
    returns:
        lista de acoes detectadas
    """
    message_lower = message.lower()
    detected = []
    
    for action_name, action_data in ACTIONS.items():
        for keyword in action_data["keywords"]:
            if keyword in message_lower:
                if action_name not in detected:
                    detected.append(action_name)
                break
    
    return detected


def get_prompt_and_tools(message: str) -> tuple[str, list, list]:
    """
    Funcao principal: detecta acoes e retorna prompt + tools.
    
    args:
        message: mensagem do usuario
        
    returns:
        tupla (prompt, tools, acoes_detectadas)
    """
    actions = detect_actions(message)
    
    if not actions:
        # fallback para prompt base
        return BASE_PROMPT, ["run_command", "find_file", "list_directory"], []
    
    prompt, tools = get_composed_prompt(actions)
    return prompt, tools, actions
