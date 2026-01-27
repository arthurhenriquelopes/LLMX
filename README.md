
<img width="362" height="170" alt="llmx" src="https://github.com/user-attachments/assets/090b0dd3-314d-4c88-8603-c1dd316da33f" />

Assistente de terminal pra Linux usando LLMs. Rapido, pratico e com acesso real ao seu sistema.

## O que faz

- Responde perguntas sobre o sistema (RAM, disco, processos)
- Encontra e manipula arquivos
- Executa comandos user e sudo
- Cria scripts de automação
- Funciona com Groq e OpenRouter*

## Requisitos

- **Sistema**: Linux (Debian-based recomendado)
- **Python**: 3.10 ou superior
- **Pacotes**: `python3-venv`

## Instalação

```bash
curl -fsSL https://github.com/arthurhenriquelopes/LLMX/releases/latest/download/llmx_latest_all.deb -o llmx.deb && sudo dpkg -i llmx.deb && rm llmx.deb
```

Ou, alternativamente:

```bash
git clone https://github.com/arthurhenriquelopes/LLMX.git
cd LLMX
chmod +x install.sh
./install.sh
```

O script de instalação cria um atalho no menu de aplicativos automaticamente.

## Configuração

Você precisa de uma API key. Rode o programa e use `/key` pra adicionar sua propria key. Suas keys podem ser verificadas em `~/.llmx/api_keys.txt`.

## Uso

```bash
python -m lmmx
```

<p>
  <img width="49%" src="https://github.com/user-attachments/assets/b91e5395-8fdd-4759-aeb4-1a193c8dcfb3" />
  <img width="49%" src="https://github.com/user-attachments/assets/3185c6ca-620d-4b8b-8bd9-a723387bf322" />
</p>

## Comandos

`/model` - trocar modelo
`/key` - adicionar chave de API
`/keys` - ver chaves salvas
`/clear` - limpar histórico
`/exit` - sair

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
