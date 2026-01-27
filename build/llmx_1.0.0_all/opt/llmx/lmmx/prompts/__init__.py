"""Pacote de prompts especializados para o llmx."""

from .router import classify_request, get_prompt_for_category
from .base import BASE_PROMPT
from .filesystem import FILESYSTEM_PROMPT
from .system_info import SYSTEM_INFO_PROMPT
from .commands import COMMANDS_PROMPT
from .scripts import SCRIPTS_PROMPT

__all__ = [
    'classify_request',
    'get_prompt_for_category',
    'BASE_PROMPT',
    'FILESYSTEM_PROMPT',
    'SYSTEM_INFO_PROMPT', 
    'COMMANDS_PROMPT',
    'SCRIPTS_PROMPT',
]
