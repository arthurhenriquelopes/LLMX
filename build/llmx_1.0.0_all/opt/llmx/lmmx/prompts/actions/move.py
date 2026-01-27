"""Micro-prompt para mover arquivos."""

MOVE_ACTION = {
    "prompt": """MOVER:
run_command("mv '/origem' '/destino/'")

Sempre caminhos completos com aspas.
""",
    "tools": ["find_file", "run_command"],
    "keywords": ["mover", "mova", "move", "mv"],
}
