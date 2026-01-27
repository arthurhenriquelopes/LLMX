"""Micro-prompt para deletar arquivos."""

DELETE_ACTION = {
    "prompt": """DELETAR:
run_command("rm -rf '/caminho/arquivo'")

Use -rf para pastas. Sempre caminhos completos com aspas.
""",
    "tools": ["find_file", "run_command"],
    "keywords": ["deletar", "delete", "remover", "remova", "apagar", "apague", "rm"],
}
