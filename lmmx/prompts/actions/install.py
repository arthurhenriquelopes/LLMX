"""Micro-prompt para instalar pacotes."""

INSTALL_ACTION = {
    "prompt": """INSTALAÇÃO DE PACOTES:
Para instalar: use a ferramenta run_sudo_command com o comando "apt install -y <pacote>".
Antes de instalar, verifique se já existe com get_package_info.

NÃO tente adivinhar nomes de pacotes. Se falhar, pare e avise.
""",
    "tools": ["run_sudo_command", "get_package_info"],
    "keywords": ["instalar", "instale", "install", "apt install", "apt-get", "atualize", "update", "upgrade"],
}
