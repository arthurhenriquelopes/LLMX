"""Micro-prompts de acoes para o LLMX."""

from .extract import EXTRACT_ACTION
from .compress import COMPRESS_ACTION
from .copy import COPY_ACTION
from .move import MOVE_ACTION
from .rename import RENAME_ACTION
from .delete import DELETE_ACTION
from .create_dir import CREATE_DIR_ACTION
from .install import INSTALL_ACTION
from .script import SCRIPT_ACTION
from .query import QUERY_ACTION
from .hardware import HARDWARE_ACTION

# mapa de acao para micro-prompt e tools
ACTIONS = {
    "extract": EXTRACT_ACTION,
    "compress": COMPRESS_ACTION,
    "copy": COPY_ACTION,
    "move": MOVE_ACTION,
    "rename": RENAME_ACTION,
    "delete": DELETE_ACTION,
    "create_dir": CREATE_DIR_ACTION,
    "install": INSTALL_ACTION,
    "script": SCRIPT_ACTION,
    "query": QUERY_ACTION,
    "hardware": HARDWARE_ACTION,
}

__all__ = ["ACTIONS"]
