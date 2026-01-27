"""Cliente llm unificado para multiplos provedores (groq, openrouter)."""

import os
from groq import Groq
from openai import OpenAI
from dotenv import load_dotenv
from .utils.console import print_warning, print_info
from .model_config import model_config, PROVIDERS

# carrega variaveis de ambiente
load_dotenv()


class LLMClient:
    """Cliente unificado para interagir com multiplos provedores llm."""
    
    def __init__(self):
        """Inicializa o cliente com o provedor e modelo configurado."""
        self.model_config = model_config
        self._init_client()
        self.conversation_history = []
        
        # prompt de sistema em portugues
        self.system_prompt = """Você é o LLMX, um assistente de IA especializado em Linux, especificamente para o MX Linux.

Suas capacidades:
- Responder perguntas sobre o sistema Linux
- Localizar arquivos e diretórios
- Verificar uso de disco, memória e processos
- Executar comandos no sistema (com confirmação do usuário)
- Criar scripts shell para automação

Regras importantes:
1. Sempre responda em português brasileiro
2. Seja conciso e direto nas respostas
3. Use as ferramentas disponíveis para obter informações reais do sistema
4. Para comandos que modificam o sistema, sempre use as ferramentas apropriadas que pedem confirmação
5. Explique o que você está fazendo antes de executar comandos
6. Se não tiver certeza, pergunte ao usuário antes de executar

Você tem acesso a ferramentas para: listar diretórios, encontrar arquivos, verificar tamanhos, ler arquivos, executar comandos, criar scripts, e obter informações do sistema."""
    
    def _init_client(self):
        """Inicializa o cliente com base no provedor atual."""
        provider = self.model_config.get_current_provider()
        provider_config = self.model_config.get_provider_config(provider)
        api_key = self.model_config.get_api_key(provider)
        
        if not api_key:
            raise ValueError(
                f"nenhuma chave de api encontrada para {provider}. "
                "configure as variaveis de ambiente ou crie um arquivo .env"
            )
        
        if provider == "groq":
            # usa o cliente groq nativo
            self.client = Groq(api_key=api_key)
        else:
            # para openrouter e outros provedores openai-compativeis
            base_url = provider_config.get("base_url")
            self.client = OpenAI(api_key=api_key, base_url=base_url)
        
        self.current_provider = provider
    
    def _switch_to_next_key(self) -> bool:
        """
        Troca para a proxima chave de api disponivel.
        
        returns:
            true se trocou com sucesso, false se nao houver mais chaves.
        """
        if self.model_config.switch_api_key():
            self._init_client()
            keys = self.model_config.get_all_api_keys()
            key_idx = self.model_config._current_key_index + 1
            print_warning(f"limite atingido. trocando para api key {key_idx}/{len(keys)}...")
            return True
        return False
    
    def _is_rate_limit_error(self, error: Exception) -> bool:
        """Verifica se o erro e de limite de taxa (rate limit)."""
        error_str = str(error).lower()
        return "rate_limit" in error_str or "429" in error_str or "rate limit" in error_str
    
    def test_connection(self) -> str:
        """Testa a conexao com a api."""
        try:
            model = self.model_config.get_current_model()
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Diga 'Conexão OK' em uma linha."}],
                max_tokens=20
            )
            return response.choices[0].message.content
        except Exception as e:
            if self._is_rate_limit_error(e) and self._switch_to_next_key():
                return self.test_connection()
            return f"erro de conexao: {str(e)}"
    
    def _make_request(self, messages: list, tools: list = None):
        """Faz uma requisicao com fallback automatico de chave em caso de rate limit."""
        model = self.model_config.get_current_model()
        
        kwargs = {
            "model": model,
            "messages": messages,
            "max_tokens": 4096,
            "temperature": 0.7,
        }
        
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
        
        try:
            response = self.client.chat.completions.create(**kwargs)
            return response.choices[0].message
        except Exception as e:
            if self._is_rate_limit_error(e):
                if self._switch_to_next_key():
                    # tenta novamente com nova chave
                    return self._make_request(messages, tools)
                else:
                    # todas as chaves esgotadas
                    raise RateLimitExhausted("limite diario atingido em todas as api keys. tente novamente mais tarde.")
            raise
    
    def chat(self, user_message: str, tools: list = None, system_prompt: str = None) -> dict:
        """Envia uma mensagem e obtem uma resposta."""
        # adiciona mensagem do usuario ao historico
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        # limita o historico para evitar erro de contexto muito grande
        self._truncate_history()
        
        # usa o prompt fornecido ou o padrao
        prompt = system_prompt if system_prompt else self.system_prompt
        
        # prepara mensagens com o prompt de sistema
        messages = [
            {"role": "system", "content": prompt}
        ] + self.conversation_history
        
        return self._make_request(messages, tools)
    
    def _truncate_history(self, max_messages: int = 10):
        """Trunca o historico mantendo apenas as ultimas mensagens."""
        if len(self.conversation_history) > max_messages:
            # mantem apenas as ultimas N mensagens
            self.conversation_history = self.conversation_history[-max_messages:]
    
    def add_tool_result(self, tool_call_id: str, tool_name: str, result: str):
        """Adiciona o resultado de uma ferramenta ao historico da conversa."""
        # trunca resultados muito grandes para evitar erro 400
        max_result_len = 500
        if len(result) > max_result_len:
            result = result[:max_result_len] + "\n... [resultado truncado]"
        
        self.conversation_history.append({
            "role": "tool",
            "tool_call_id": tool_call_id,
            "name": tool_name,
            "content": result
        })
    
    def add_assistant_message(self, message):
        """Adiciona uma mensagem do assistente ao historico da conversa."""
        msg = {
            "role": "assistant",
            "content": message.content or "",
        }
        
        # apenas inclui tool_calls se houver chamadas de ferramentas reais
        if message.tool_calls:
            msg["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                } for tc in message.tool_calls
            ]
        
        self.conversation_history.append(msg)
    
    def get_follow_up(self, tools: list = None) -> dict:
        """Obtem uma resposta de acompanhamento apos a execucao da ferramenta."""
        messages = [
            {"role": "system", "content": self.system_prompt}
        ] + self.conversation_history
        
        return self._make_request(messages, tools)
    
    def clear_history(self):
        """Limpa o historico da conversa."""
        self.conversation_history = []
    
    def reload(self):
        """Reinicia o cliente com a nova configuracao de modelo."""
        self.model_config.reset_key_index()
        self._init_client()


class RateLimitExhausted(Exception):
    """Excecao lancada quando todas as chaves de api atingiram seus limites de taxa."""
    pass


# alias para compatibilidade
GroqClient = LLMClient
