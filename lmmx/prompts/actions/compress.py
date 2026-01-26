"""Micro-prompt para compactacao de arquivos."""

COMPRESS_ACTION = {
    "prompt": """COMPACTAR:
1. run_command("cd ~/pasta && rar a ~/Desktop/saída.rar .")

Formatos: rar a (rar), zip -r (zip), tar -czf (tar.gz)
Sempre use cd para entrar na pasta antes de compactar.
""",
    "tools": ["run_command"],
    "keywords": ["compactar", "compacte", "compress", "zipar", "arquivar"],
}
