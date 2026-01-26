# LLMx

Assistente de terminal pra Linux usando LLMs. Faz as coisas que você pediria pro ChatGPT, só que direto no terminal e com acesso real ao seu sistema.

## O que faz

- Responde perguntas sobre o sistema (RAM, disco, processos)
- Encontra e manipula arquivos
- Executa comandos (sempre pede confirmação)
- Cria scripts de automação
- Funciona com Groq e OpenRouter

## Instalação

```bash
git clone https://github.com/arthurhenriquelopes/LLMX.git
cd LLMX
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuração

Você precisa de uma API key. Rode o programa e use `/key` pra adicionar:

```bash
python -m lmmx
```

```
› /key

═══ Gerenciar Chaves de API ═══

Adicionar nova chave:
  1. groq
  2. openrouter
  0. cancelar

Provedor (0-2): 1
Cole a chave de API do groq: gsk_xxxxx
✓ chave do groq salva com sucesso!
```

Pega sua key em:
- Groq: https://console.groq.com/keys
- OpenRouter: https://openrouter.ai/keys

## Uso

```bash
python -m lmmx
```

Alguns exemplos:

```
› quanta RAM tenho?
Você tem 16GB de RAM, 8.2GB em uso.

› liste a pasta Downloads
[lista os arquivos]

› compacte a pasta Documents pra zip no Desktop
→ cd ~/Documents && zip -r ~/Desktop/documents.zip .
Confirmar? [Y/n]: 
```

## Comandos

- `/model` - trocar modelo
- `/key` - adicionar chave de API
- `/keys` - ver chaves salvas
- `/clear` - limpar histórico
- `/exit` - sair

## Modelos disponíveis

**Groq** (rápido)
- llama-3.3-70b-versatile
- llama-3.1-8b-instant
- mixtral-8x7b-32768

**OpenRouter** (mais opções)
- mistralai/devstral-2512:free
- e outros

## Estrutura

```
lmmx/
├── agent.py          # loop principal
├── llm_client.py     # cliente pra APIs
├── tools/            # ferramentas do sistema
└── prompts/          # prompts especializados
    └── actions/      # micro-prompts por ação
```

## Licença

MIT
