"""Micro-prompt para criacao de scripts."""

SCRIPT_ACTION = {
    "prompt": """CRIAR SCRIPT:
Use create_script para criar um script shell.
Exemplo:
Tool: create_script
Arguments: {"filename": "backup.sh", "content": "#!/bin/bash\\ncp -r ~/Documents ~/backup/"}

Depois use run_script para executar.
""",
    "tools": ["create_script", "run_script"],
    "keywords": ["script", "criar script", "crie script", "bash", "shell", "automatizar", "automatize"],
}
