
<img width="362" height="170" alt="llmx" src="https://github.com/user-attachments/assets/090b0dd3-314d-4c88-8603-c1dd316da33f" />

# LLMX

Assistente de terminal pra Linux usando LLMs. Rápido, prático e com acesso real ao seu sistema.

## O que faz

- Responde perguntas sobre o sistema (RAM, disco, processos)
- Encontra e manipula arquivos
- Executa comandos user e sudo
- Cria scripts de automação
- Interface com input box estilo Gemini CLI

## Requisitos

- **Sistema**: Linux (Debian-based recomendado)
- **Node.js**: v20.0.0 ou superior
- **npm**: Incluído com Node.js

## Instalação

### Opção 1: Script automático (recomendado)

```bash
git clone https://github.com/arthurhenriquelopes/LLMX.git
### 1. Obter API key

**Groq (recomendado - grátis):**
- Acesse [console.groq.com](https://console.groq.com)
- Crie uma conta e gere uma API key

**Manus (opcional - modelos grátis):**
- Obtenha sua chave em [manus.nz](https://manus.nz)
- Modelos disponíveis: `gpt-4o-mini`, `claude-3-5-sonnet`, `gemini-2.0-flash-exp`

**Google AI Studio (opcional - grátis):**
- Obtenha sua chave em [aistudio.google.com](https://aistudio.google.com)
- Modelos disponíveis: `gemini-2.0-flash-exp`, `gemini-1.5-flash`, `gemini-1.5-pro`

### 2. Clonar e instalar

```bash
git clone https://github.com/arthurhenriquelopes/LLMX.git
cd LLMX
cp .env.example .env
# Edite .env e adicione suas API keys
```

### 3. Instalar globalmente

```bash
./install.sh
```

Agora é só rodar `llmx` de qualquer lugar!

## Uso

Após instalação, use de **qualquer pasta**:

```bash
llmx
```

Você verá:

```
      ___       ___       ___           __      
     /  /\     /  /\     /  /\         |  |\    
    /  /:/    /  /:/    /  /::|        |  |:|   
   /  /:/    /  /:/    /  /:|:|        |  |:|   
  /  /:/    /  /:/    /  /:/|:|__      |__|:|__ 
 /__/:/    /__/:/    /__/:/_|:::::\ ____/__/::::\
 \  \:\    \  \:\    \__\/  /~~/:/ \__\::::/~~~~
  \  \:\    \  \:\         /  /:/     |~~|:|    
   \  \:\    \  \:\       /  /:/      |  |:|    
    \  \:\    \  \:\     /__/:/       |__|:|    
     \__\/     \__\/     \__\/         \__\|    

◆ LLMX v1.0.0
Assistente Linux • Llama 3.3 70B • Groq
/help para comandos • /exit para sair

✓ conectado (llama-3.3-70b-versatile)
╭──────────────────────────────────────────────────────────────╮
│ > Type your message or @path/to/file                         │
╰──────────────────────────────────────────────────────────────╯
```

## Comandos

- `/help` - listar comandos
- `/model` - trocar modelo
- `/clear` - limpar histórico
- `/exit` - sair

## Modelos disponíveis

**Groq** (rápido e gratuito):
- llama-3.3-70b-versatile (padrão)
- llama-3.1-70b-versatile
- mixtral-8x7b-32768

## Estrutura do Projeto (TypeScript)

```
LLMX/
├── src/
│   ├── index.tsx           # Entry point
│   ├── api/
│   │   └── groq.ts        # Groq API client
│   ├── config/
│   │   └── models.ts      # Model definitions
│   └── ui/
│       ├── App.tsx        # Main component
│       └── components/
│           └── SimpleInput.tsx  # Input box
├── bin/
│   └── llmx.js            # Global CLI wrapper
├── dist/                  # Compiled output
├── package.json
└── tsconfig.json
```

## Desenvolvimento

```bash
# Watch mode (recarrega ao salvar)
npm run dev

# Build manual
npm run build

# Type checking
npm run typecheck
```

## Tecnologias

- **TypeScript** - Type safety
- **Ink** - React para CLIs (UI components)
- **Groq SDK** - API client oficial
- **esbuild** - Bundling rápido

## Migração Python → TypeScript

A versão antiga em Python ainda está disponível no branch `python-legacy`. A nova versão TypeScript oferece:

- ✅ UI melhor com bordas e cores
- ✅ Resize de terminal sem artifacts
- ✅ Componentes reutilizáveis (React)
- ✅ Type safety
- ✅ Build otimizado (1.9MB bundle)

## Licença

MIT

---

**Nota**: Este projeto foi inspirado pelo [Gemini CLI](https://github.com/google-gemini/gemini-cli).
