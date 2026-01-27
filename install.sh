#!/bin/bash
# LLMX Installer - Instala dependências e adiciona ao menu de aplicativos

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║      🐧 LLMX Installer                    ║"
echo "║      Assistente Linux com IA              ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$PROJECT_DIR/.venv"

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" &> /dev/null
}

# 1. Verificar Python
echo -e "${YELLOW}[1/5]${NC} Verificando Python..."
if ! command_exists python3; then
    echo -e "${RED}Erro: Python3 não encontrado. Instale com: sudo apt install python3${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION encontrado"

# 2. Verificar/Criar ambiente virtual
echo -e "${YELLOW}[2/5]${NC} Configurando ambiente virtual..."
if [ ! -d "$VENV_DIR" ]; then
    echo "  Criando ambiente virtual..."
    python3 -m venv "$VENV_DIR" || {
        echo -e "${RED}Erro: Falha ao criar venv. Instale com: sudo apt install python3-venv${NC}"
        exit 1
    }
fi
echo -e "${GREEN}✓${NC} Ambiente virtual configurado"

# 3. Instalar dependências
echo -e "${YELLOW}[3/5]${NC} Instalando dependências..."
source "$VENV_DIR/bin/activate"
pip install -q -r "$PROJECT_DIR/requirements.txt"
echo -e "${GREEN}✓${NC} Dependências instaladas"

# 4. Verificar API Key
echo -e "${YELLOW}[4/5]${NC} Verificando configuração..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${YELLOW}⚠${NC}  Arquivo .env não encontrado!"
    echo ""
    echo -e "  Por favor, insira sua GROQ API Key:"
    echo -e "  (Obtenha em: ${BLUE}https://console.groq.com${NC})"
    read -p "  GROQ_API_KEY: " API_KEY
    echo "GROQ_API_KEY=$API_KEY" > "$PROJECT_DIR/.env"
    echo -e "${GREEN}✓${NC} API Key salva"
else
    echo -e "${GREEN}✓${NC} Configuração encontrada"
fi

# 5. Criar atalho no menu de aplicativos
echo -e "${YELLOW}[5/5]${NC} Criando atalho no menu..."

# Criar script launcher
LAUNCHER_SCRIPT="$PROJECT_DIR/lmmx-launcher.sh"
cat > "$LAUNCHER_SCRIPT" << EOF
#!/bin/bash
cd "$PROJECT_DIR"
source "$VENV_DIR/bin/activate"
python -m lmmx.main
exec bash
EOF
chmod +x "$LAUNCHER_SCRIPT"

# Criar arquivo .desktop
DESKTOP_FILE="$HOME/.local/share/applications/lmmx.desktop"
mkdir -p "$HOME/.local/share/applications"

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=LLMX
GenericName=AI Linux Assistant
Comment=Assistente Linux com IA usando Llama 3.3 70B
Exec=x-terminal-emulator -e "$LAUNCHER_SCRIPT"
Icon=utilities-terminal
Terminal=false
Categories=System;Utility;
Keywords=ai;assistant;linux;terminal;llama;
EOF

echo -e "${GREEN}✓${NC} Atalho criado no menu de aplicativos"

# Atualizar cache de aplicativos (se disponível)
if command_exists update-desktop-database; then
    update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Instalação concluída com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "Para executar o LLMX:"
echo -e "  ${BLUE}1.${NC} Procure por 'LLMX' no menu de aplicativos"
echo -e "  ${BLUE}2.${NC} Ou execute no terminal:"
echo -e "     ${YELLOW}cd $PROJECT_DIR${NC}"
echo -e "     ${YELLOW}source .venv/bin/activate${NC}"
echo -e "     ${YELLOW}python -m lmmx.main${NC}"
echo ""
