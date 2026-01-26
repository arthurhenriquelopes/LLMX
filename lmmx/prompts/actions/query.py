"""Micro-prompt para consulta de software e processos."""

QUERY_ACTION = {
    "prompt": """CONSULTAR SOFTWARE/PROCESSOS:
Para verificar pacotes instalados: get_package_info("nome_pacote")
Para ver processos: list_processes("cpu") ou list_processes("memory")
Para informações do sistema: get_system_info()

Responda de forma direta com os dados encontrados.
""",
    "tools": ["get_package_info", "list_processes", "get_system_info"],
    "keywords": ["instalado", "versão", "processo", "processos", "rodando", "executando", "pacote", "software"],
}
