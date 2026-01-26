"""Micro-prompt para extracao de arquivos."""

EXTRACT_ACTION = {
    "prompt": """EXTRAIR ARQUIVO:
1. PRIMEIRO: find_file("*nome*") - encontre o arquivo
2. DEPOIS: use o CAMINHO REAL retornado (ex: /home/user/Desktop/arquivo.rar)
3. run_command("mkdir -p destino && unrar x '/CAMINHO_REAL_DO_FIND' destino/")

IMPORTANTE: Use o caminho EXATO retornado pelo find_file, NÃO use placeholders!
Formatos: unrar x (rar), unzip -d (zip), tar -xzf -C (tar.gz)
""",
    "tools": ["find_file", "run_command"],
    "keywords": ["extrair", "extraia", "extract", "unrar", "unzip", "descompactar", "descompacte"],
}
