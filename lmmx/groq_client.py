"""Cliente da api groq para llmx com chaves de fallback."""

import os
from groq import Groq
from dotenv import load_dotenv
from .utils.console import print_warning, print_info

# carrega variaveis de ambiente
load_dotenv()


class GroqClient:
    """Cliente para interagir com a api groq com fallback de multiplas chaves."""
    
    MODEL = "llama-3.3-70b-versatile"
    
    def __init__(self):
        """Inicializa o cliente groq com chaves de fallback."""
        # carrega todas as chaves de api disponiveis
        self.api_keys = []
        for key_name in ["GROQ_API_KEY", "GROQ_API_KEY_2", "GROQ_API_KEY_3"]:
            key = os.getenv(key_name)
            if key:
                self.api_keys.append(key)
        
        if not self.api_keys:
            raise ValueError(
                "nenhuma GROQ_API_KEY encontrada. "
                "configure as variaveis de ambiente ou crie um arquivo .env"
            )
        
        self.current_key_index = 0
        self._init_client()
        self.conversation_history = []
        
        # prompt de sistema em portugues
        self.system_prompt = """Você é o LLMx, um assistente de IA especializado em Linux, especificamente para o MX Linux.

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
        """Inicializa ou reinicializa o cliente groq com a chave atual."""
        self.client = Groq(api_key=self.api_keys[self.current_key_index])
    
    def _switch_to_next_key(self) -> bool:
        """
        Troca para a proxima chave de api disponivel.
        
        returns:
            true se trocou com sucesso, false se nao houver mais chaves.
        """
        if self.current_key_index < len(self.api_keys) - 1:
            self.current_key_index += 1
            self._init_client()
            key_num = self.current_key_index + 1
            print_warning(f"limite atingido. trocando para api key {key_num}/{len(self.api_keys)}...")
            return True
        return False
    
    def _is_rate_limit_error(self, error: Exception) -> bool:
        """Verifica se o erro e de limite de taxa (rate limit)."""
        error_str = str(error).lower()
        return "rate_limit" in error_str or "429" in error_str or "rate limit" in error_str
    
    def test_connection(self) -> str:
        """Testa a conexao com a api groq."""
        try:
            response = self.client.chat.completions.create(
                model=self.MODEL,
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
        kwargs = {
            "model": self.MODEL,
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


class RateLimitExhausted(Exception):
    """Excecao lancada quando todas as chaves de api atingiram seus limites de taxa."""
    pass
