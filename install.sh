#!/usr/bin/env bash

set -e

echo "🚀 Installing LLMX..."

# verifica se node.js esta instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nao encontrado!"
    echo "📦 Instalando Node.js via apt..."
    sudo apt update
    sudo apt install -y nodejs npm
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js $NODE_VERSION detectado. Recomendado: v20+"
fi

# instala dependencias
echo "📦 Instalando dependencias npm..."
npm install

# cria stub de devtools (fix critico)
echo "🔧 Criando stub para react-devtools-core..."
mkdir -p node_modules/react-devtools-core
echo "export default {};" > node_modules/react-devtools-core/index.js
echo '{"main":"index.js","type":"module"}' > node_modules/react-devtools-core/package.json

# build
echo "🔨 Compilando TypeScript..."
npm run build

# verifica .env
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env nao encontrado!"
    echo "📝 Crie um arquivo .env com sua GROQ_API_KEY:"
    echo ""
    echo "GROQ_API_KEY=your_key_here"
    echo ""
fi

# instala globalmente com npm link
echo "🔗 Instalando globalmente..."
sudo npm link

echo ""
echo "✅ LLMX instalado com sucesso!"
echo ""
echo "💡 Para usar, digite em qualquer terminal:"
echo "   llmx"
echo ""
echo "📝 Nao esqueca de configurar sua GROQ_API_KEY no arquivo .env"
