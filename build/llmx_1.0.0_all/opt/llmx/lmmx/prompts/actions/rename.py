"""Micro-prompt para renomear arquivos."""

RENAME_ACTION = {
    "prompt": """RENOMEAR:
run_command("mv '/caminho/antigo' '/caminho/novo'")

Sempre caminhos completos com aspas.
""",
    "tools": ["find_file", "run_command"],
    "keywords": ["renomear", "renomeie", "rename"],
}
