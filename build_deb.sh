#!/bin/bash
# Script para criar pacote .deb do LLMX
# Uso: ./build_deb.sh [versao]

set -e

# Configurações
PROJECT_NAME="llmx"
VERSION=${1:-"1.0.0"}
ARCH="all"
PACKAGE_NAME="${PROJECT_NAME}_${VERSION}_${ARCH}"
BUILD_DIR="build/${PACKAGE_NAME}"
INSTALL_DIR="/opt/${PROJECT_NAME}"

echo "🔨 Criando pacote ${PACKAGE_NAME}..."

# 1. Preparar estrutura de diretórios
rm -rf build
mkdir -p "${BUILD_DIR}/DEBIAN"
mkdir -p "${BUILD_DIR}${INSTALL_DIR}"
mkdir -p "${BUILD_DIR}/usr/bin"
mkdir -p "${BUILD_DIR}/usr/share/applications"

# 2. Copiar arquivos do projeto
echo "📂 Copiando arquivos..."
cp -r lmmx "${BUILD_DIR}${INSTALL_DIR}/"
cp requirements.txt "${BUILD_DIR}${INSTALL_DIR}/"
cp README.md "${BUILD_DIR}${INSTALL_DIR}/"
cp LICENSE "${BUILD_DIR}${INSTALL_DIR}/" 2>/dev/null || true

# 3. Criar launcher script para /usr/bin
cat > "${BUILD_DIR}/usr/bin/${PROJECT_NAME}" << EOF
#!/bin/bash
# Launcher para LLMX instalado em /opt
cd "${INSTALL_DIR}"
if [ -f ".venv/bin/activate" ]; then
    source ".venv/bin/activate"
else
    echo "Erro: Ambiente virtual não encontrado em ${INSTALL_DIR}/.venv"
    echo "Tente reinstalar o pacote: sudo apt install --reinstall ./llmx_*.deb"
    exit 1
fi
python3 -m lmmx.main "\$@"
EOF
chmod +x "${BUILD_DIR}/usr/bin/${PROJECT_NAME}"

# 4. Criar arquivo .desktop
cat > "${BUILD_DIR}/usr/share/applications/${PROJECT_NAME}.desktop" << EOF
[Desktop Entry]
Version=${VERSION}
Type=Application
Name=LLMX
GenericName=AI Linux Assistant
Comment=Assistente Linux com IA usando Llama 3.3 70B
Exec=x-terminal-emulator -e ${PROJECT_NAME}
Icon=utilities-terminal
Terminal=false
Categories=System;Utility;
Keywords=ai;assistant;linux;terminal;llama;
EOF

# 5. Criar arquivo control (Metadados)
cat > "${BUILD_DIR}/DEBIAN/control" << EOF
Package: ${PROJECT_NAME}
Version: ${VERSION}
Section: utils
Priority: optional
Architecture: ${ARCH}
Depends: python3, python3-venv, python3-pip, x-terminal-emulator
Maintainer: Arthur Henrique <arthur@arthurhenrique.com>
Description: LLMX - AI Linux Assistant
 Um assistente de terminal inteligente para Linux (MX Linux)
 que utiliza Llama 3.3 70B para ajudar com comandos, scripts
 e informações do sistema.
EOF

# 6. Criar script postinst (Pós-instalação)
cat > "${BUILD_DIR}/DEBIAN/postinst" << EOF
#!/bin/bash
set -e

# Executa apenas na configuração
if [ "\$1" = "configure" ]; then
    echo "🐍 Configurando ambiente Python para LLMX..."
    
    cd "${INSTALL_DIR}"
    
    # Criar venv se não existir
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    
    # Instalar dependências
    source .venv/bin/activate
    
    echo "📦 Instalando dependências (pode demorar um pouco)..."
    pip install --no-cache-dir -r requirements.txt > /dev/null
    
    # Ajustar permissões
    chmod -R 755 "${INSTALL_DIR}"
    
    echo "✅ LLMX configurado com sucesso!"
    echo "ℹ️  Para configurar sua API Key, edite o arquivo: ${INSTALL_DIR}/.env"
    echo "   Ou execute 'llmx' e siga as instruções."

    # Atualizar menu
    if command -v update-desktop-database >/dev/null; then
        update-desktop-database
    fi
fi

exit 0
EOF
chmod 755 "${BUILD_DIR}/DEBIAN/postinst"

# 7. Criar script prerm (Pré-remoção) - opcional, para limpeza extra
cat > "${BUILD_DIR}/DEBIAN/prerm" << EOF
#!/bin/bash
set -e

if [ "\$1" = "remove" ]; then
    echo "🗑️  Removendo arquivos gerados (venv, cache)..."
    rm -rf "${INSTALL_DIR}/.venv"
    rm -rf "${INSTALL_DIR}/.env" 2>/dev/null || true
    rm -rf "${INSTALL_DIR}/lmmx/__pycache__"
fi

exit 0
EOF
chmod 755 "${BUILD_DIR}/DEBIAN/prerm"

# 8. Construir pacote
echo "📦 Construindo pacote .deb..."
dpkg-deb --build "${BUILD_DIR}"
mv "${BUILD_DIR}.deb" .

echo "🎉 Pacote criado: ${PACKAGE_NAME}.deb"
echo "ℹ️  Para instalar: sudo apt install ./${PACKAGE_NAME}.deb"
