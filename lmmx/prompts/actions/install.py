"""Micro-prompt para instalar pacotes."""

INSTALL_ACTION = {
    "prompt": """INSTALAR PACOTE:
1. PRIMEIRO: get_package_info("pacote") para verificar se já está instalado
2. Se NÃO instalado: run_sudo_command("apt install -y pacote")
3. PARE após uma tentativa - não tente variações!

IMPORTANTE:
- Use APENAS run_sudo_command (não run_command com sudo)
- Use -y para confirmar automaticamente
- Se falhar, informe o erro - NÃO tente outras formas
""",
    "tools": ["run_sudo_command", "get_package_info"],
    "keywords": ["instalar", "instale", "install", "apt install", "apt-get"],
}
