"""Micro-prompt para criar diretorios."""

CREATE_DIR_ACTION = {
    "prompt": """CRIAR PASTA:
run_command("mkdir -p '/caminho/nova_pasta'")

Use -p para criar pastas pai se necessário.
""",
    "tools": ["run_command"],
    "keywords": ["criar pasta", "crie pasta", "crie a pasta", "mkdir", "nova pasta"],
}
