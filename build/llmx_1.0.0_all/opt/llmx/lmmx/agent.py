"""Logica do agente com loop de chamada de ferramentas."""

import json
from .llm_client import LLMClient, RateLimitExhausted
from .model_config import model_config
from .tools import ALL_TOOLS, execute_tool, get_tools_by_names
from .utils.console import print_tool_call, print_error, print_warning, print_info, get_spinner
from .utils.logger import log_error, log_info, log_debug, log_tool_call, log_api_error, get_log_path
from .prompts import classify_request, get_prompt_for_category
from .prompts.composer import get_prompt_and_tools


class Agent:
    """Agente llmx com suporte a chamada de ferramentas."""
    
    MAX_RETRIES = 2  # numero maximo de tentativas em caso de erro
    
    def __init__(self):
        """Inicializa o agente."""
        self.client = self._create_client()
        log_info("Agent initialized")
    
    def _create_client(self):
        """Cria o cliente llm."""
        return LLMClient()
    
    def reload_model(self):
        """Recarrega o cliente com nova configuracao de modelo."""
        self.client = self._create_client()
        log_info(f"Model reloaded: {self.get_model_info()}")
    
    def get_model_info(self) -> str:
        """Obtem string de informacao do modelo atual."""
        return model_config.get_current_model()
    
    def run(self, user_message: str) -> str:
        """
        Processa uma mensagem do usuario e retorna a resposta.
        
        implementa o loop de chamada de ferramentas:
        1. classifica o request e seleciona prompt especializado
        2. envia mensagem para o groq com ferramentas disponiveis
        3. se o modelo retornar chamadas de ferramentas, executa e envia resultados de volta
        4. repete ate o modelo retornar uma resposta de texto final
        
        args:
            user_message: a entrada do usuario
            
        returns:
            a resposta de texto final do modelo
        """
        log_info(f"User message: {user_message[:100]}...")
        retries = 0
        
        # detecta acoes e obtem prompt + tools otimizados
        prompt, tool_names, actions = get_prompt_and_tools(user_message)
        
        if actions:
            # usa micro-prompts concatenados + tool pruning
            specialized_prompt = prompt
            tools_to_use = get_tools_by_names(tool_names)
            log_info(f"Actions: {actions}, Tools: {tool_names}")
        else:
            # fallback para sistema antigo de categorias
            category = classify_request(user_message)
            specialized_prompt = get_prompt_for_category(category)
            tools_to_use = ALL_TOOLS
            log_info(f"Category: {category}")
        
        while retries <= self.MAX_RETRIES:
            try:
                # obtem resposta inicial com prompt especializado
                with get_spinner():
                    response = self.client.chat(user_message, tools=tools_to_use, system_prompt=specialized_prompt)
                
                # loop de chamada de ferramentas
                iteration = 0
                max_iterations = 10  # evita loops infinitos
                
                while response.tool_calls and iteration < max_iterations:
                    iteration += 1
                    
                    # adiciona mensagem do assistente ao historico
                    self.client.add_assistant_message(response)
                    
                    # executa cada chamada de ferramenta
                    for tool_call in response.tool_calls:
                        tool_name = tool_call.function.name
                        
                        try:
                            arguments = json.loads(tool_call.function.arguments)
                        except json.JSONDecodeError as e:
                            log_error(e, f"Failed to parse arguments for {tool_name}")
                            arguments = {}
                        
                        # mostra qual ferramenta esta sendo chamada
                        arg_preview = str(arguments.get(list(arguments.keys())[0]) if arguments else "")
                        print_tool_call(tool_name, arg_preview)
                        
                        # loga e executa a ferramenta
                        log_tool_call(tool_name, arguments)
                        
                        try:
                            result = execute_tool(tool_name, arguments)
                            log_tool_call(tool_name, arguments, result)
                        except Exception as e:
                            log_error(e, f"Tool execution failed: {tool_name}")
                            result = f"erro ao executar {tool_name}: {str(e)}"
                        
                        # adiciona resultado a conversa
                        self.client.add_tool_result(
                            tool_call_id=tool_call.id,
                            tool_name=tool_name,
                            result=result
                        )
                    
                    # obtem resposta de acompanhamento
                    with get_spinner():
                        response = self.client.get_follow_up(tools=ALL_TOOLS)
                
                # verifica se houve iteracoes demais
                if iteration >= max_iterations:
                    log_error(Exception("Max iterations reached"), "Tool loop")
                    return "desculpe, a operacao ficou muito complexa. tente uma pergunta mais simples."
                
                # adiciona mensagem final do assistente ao historico
                if response.content:
                    self.client.add_assistant_message(response)
                    log_info(f"Response: {response.content[:100]}...")
                    return response.content
                else:
                    return "desculpe, nao consegui processar sua solicitacao."
            
            except RateLimitExhausted as e:
                # todas as chaves de api esgotadas - mostra mensagem amigavel
                log_error(e, "All API keys exhausted")
                print_info("⏳ limite diario atingido em todas as API keys.")
                return "limite diario atingido. tente novamente mais tarde ou adicione mais API keys no arquivo .env"
            
            except Exception as e:
                error_str = str(e)
                log_api_error(e, f"Retry {retries}/{self.MAX_RETRIES}")
                
                # verifica se e um erro de chamada de ferramenta (pode tentar de novo)
                if "tool_use_failed" in error_str or "Failed to call a function" in error_str:
                    retries += 1
                    if retries <= self.MAX_RETRIES:
                        print_warning(f"erro na chamada de ferramenta. tentando novamente ({retries}/{self.MAX_RETRIES})...")
                        log_info(f"Retrying after tool_use_failed error")
                        # limpa historico e tenta de novo com abordagem mais simples
                        self.client.clear_history()
                        continue
                    else:
                        log_error(e, "Max retries reached for tool_use_failed")
                        return "desculpe, nao consegui executar a operacao. tente reformular sua pergunta."
                else:
                    # outros erros - nao tenta de novo
                    log_error(e, "Unrecoverable error")
                    print_error(str(e))
                    return f"erro ao processar: {str(e)}\n\n💡 log salvo em: {get_log_path()}"
        
        return "erro inesperado. verifique os logs."
    
    def clear_history(self):
        """Limpa o historico da conversa."""
        self.client.clear_history()
        log_info("Conversation history cleared")
