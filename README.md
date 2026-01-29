
<img width="362" height="170" alt="llmx" src="https://github.com/user-attachments/assets/090b0dd3-314d-4c88-8603-c1dd316da33f" />

# LLMX

Assistente de terminal pra Linux usando LLMs. Rápido, prático e com acesso real ao seu sistema.

## O que faz

Basicamente responde suas perguntas sobre o sistema, acha arquivos, roda comandos e cria scripts. Tudo pelo terminal, sem frescura.

## Novidades da v2

Suporte a múltiplos providers (Groq e OpenRouter), confirmação antes de rodar comandos perigosos, e um dialog bonitinho quando a API estoura o rate limit.

## Requisitos

Linux com Node.js 20+. Só isso.

## Instalação

Pega uma key no [Groq](https://console.groq.com) (é grátis), depois:

```bash
git clone https://github.com/arthurhenriquelopes/LLMX.git
cd LLMX
cp .env.example .env
# coloca sua key no .env
./install.sh
```

Agora roda `llmx` de qualquer lugar.

## Comandos

`/help` lista tudo, `/model` troca modelo, `/clear` limpa histórico, `/exit` sai.

## Modelos

Groq: llama-3.3-70b-versatile (padrão), llama-3.1-70b, mixtral-8x7b

OpenRouter: gemini-2.0-flash, claude-3.5-sonnet, etc

## Dev

```bash
npm run dev    # watch mode
npm run build  # compila
npm test       # testes
```

## Por que TypeScript?

A versão Python bugava no resize do terminal e era difícil de debugar. Com Ink (React pra CLI) ficou bem mais limpo.

## Licença

MIT

---

Inspirado no [Gemini CLI](https://github.com/google-gemini/gemini-cli).
