"""Utilitarios de log para o llmx."""

import os
import logging
from datetime import datetime
from pathlib import Path

# diretorio de logs
LOG_DIR = Path(__file__).parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# arquivo de log com data
LOG_FILE = LOG_DIR / f"lmmx_{datetime.now().strftime('%Y-%m-%d')}.log"

# configurar logger
logger = logging.getLogger("lmmx")
logger.setLevel(logging.DEBUG)

# handler para arquivo
file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter(
    '%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
file_handler.setFormatter(file_formatter)

# adicionar handler
if not logger.handlers:
    logger.addHandler(file_handler)


def log_error(error: Exception, context: str = None):
    """Loga um erro com contexto."""
    msg = f"{context}: {str(error)}" if context else str(error)
    logger.error(msg)
    logger.debug(f"Exception type: {type(error).__name__}")


def log_info(message: str):
    """Loga uma mensagem de informacao."""
    logger.info(message)


def log_debug(message: str):
    """Loga uma mensagem de depuracao."""
    logger.debug(message)


def log_tool_call(tool_name: str, arguments: dict, result: str = None):
    """Loga uma chamada de ferramenta."""
    logger.info(f"Tool: {tool_name} | Args: {arguments}")
    if result:
        # trunca resultados longos
        result_preview = result[:200] + "..." if len(result) > 200 else result
        logger.debug(f"Result: {result_preview}")


def log_api_error(error: Exception, request_context: str = None):
    """Loga erros de api com detalhes completos."""
    logger.error(f"API Error: {str(error)}")
    if request_context:
        logger.debug(f"Request context: {request_context}")


def get_log_path() -> Path:
    """Obtem o caminho do arquivo de log atual."""
    return LOG_FILE
