"""Micro-prompt para copia de arquivos."""

COPY_ACTION = {
    "prompt": """COPIAR:
run_command("cp -r '/origem' '/destino/'")

Use -r para pastas. Sempre use caminhos completos com aspas.
""",
    "tools": ["find_file", "run_command"],
    "keywords": ["copiar", "copie", "copy", "cp"],
}
