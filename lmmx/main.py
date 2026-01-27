"""Llmx - ponto de entrada principal."""

import sys
from .agent import Agent
from .model_config import model_config, AVAILABLE_MODELS, PROVIDERS, get_provider_for_model
from .api_keys import save_api_key, list_providers_with_keys, has_key_for_provider
from .utils.console import (
    print_welcome, 
    print_user_prompt, 
    print_assistant_response,
    print_error,
    print_info,
    print_success,
    print_warning,
    console,
    Text
)


def print_help():
    """Mostra mensagem de ajuda."""
    help_text = """
**Comandos:**
  `/exit`     Sair do LLMX
  `/clear`    Limpar histórico
  `/model`    Trocar modelo
  `/key`      Adicionar chave de API
  `/keys`     Ver chaves salvas
  `/help`     Mostrar esta ajuda

**Exemplos:**
  "Qual o tamanho da pasta Downloads?"
  "Quanta memória RAM estou usando?"
  "Crie um script para limpar cache"
"""
    print_assistant_response(help_text)


def handle_key_command():
    """Trata o comando /key - adicionar nova chave de api."""
    console.print()
    console.print(Text("═══ Gerenciar Chaves de API ═══", style="bold dodger_blue1"))
    console.print()
    
    # mostra chaves existentes primeiro
    keys = list_providers_with_keys()
    if keys:
        console.print(Text("Chaves salvas:", style="dim"))
        for provider, key_list in keys.items():
            for i, (masked, _) in enumerate(key_list):
                console.print(Text(f"  {provider}: {masked}", style="cyan"))
        console.print()
    
    # mostra provedores disponiveis
    console.print(Text("Adicionar nova chave:", style="dim"))
    console.print(Text("  1. groq", style="white"))
    console.print(Text("  2. openrouter", style="white"))
    console.print(Text("  0. cancelar", style="white"))
    console.print()
    
    console.print(Text("Provedor (0-2): ", style="dim"), end="")
    choice = input().strip()
    
    if choice == "0" or not choice:
        print_info("cancelado")
        return
    elif choice == "1":
        provider = "groq"
    elif choice == "2":
        provider = "openrouter"
    else:
        print_error("opção inválida")
        return
    
    console.print(Text(f"Cole a chave de API do {provider}: ", style="dim"), end="")
    key = input().strip()
    
    if not key:
        print_error("chave não pode ser vazia")
        return
    
    if save_api_key(provider, key):
        print_success(f"chave do {provider} salva com sucesso!")
    else:
        print_warning("chave já existe ou erro ao salvar")


def handle_keys_list():
    """Trata o comando /keys - listar chaves salvas."""
    console.print()
    console.print(Text("═══ Chaves de API Salvas ═══", style="bold dodger_blue1"))
    console.print()
    
    keys = list_providers_with_keys()
    
    if not keys:
        print_info("nenhuma chave salva. use /key para adicionar.")
        return
    
    for provider, key_list in keys.items():
        console.print(Text(f"── {provider} ({len(key_list)} chaves) ──", style="bold yellow"))
        for i, (masked, _) in enumerate(key_list):
            console.print(Text(f"  {i+1}. {masked}", style="cyan"))
        console.print()


def handle_model_command(agent: Agent):
    """Trata o comando /model - selecao interativa de modelo."""
    from .model_config import PROVIDERS
    
    console.print()
    console.print(Text("═══ Seleção de Modelo ═══", style="bold dodger_blue1"))
    console.print()
    
    # mostra modelo atual
    current_model = model_config.get_current_model()
    current_provider = model_config.get_current_provider()
    console.print(Text(f"Atual: {current_model} ({PROVIDERS[current_provider]['name']})", style="dim"))
    console.print()
    
    # monta lista de modelos com indices
    all_models = []
    idx = 1
    
    for provider_id, provider in PROVIDERS.items():
        console.print(Text(f"── {provider['name']} ──", style="bold yellow"))
        for model_id, model_name in provider["models"].items():
            style = "cyan" if model_id == current_model else "white"
            console.print(Text(f"  {idx}. {model_id}", style=style))
            all_models.append(model_id)
            idx += 1
        console.print()
    
    console.print(Text("Digite o número do modelo (ou Enter para manter): ", style="dim"), end="")
    choice = input().strip()
    
    if not choice:
        print_info("Modelo mantido")
        return
    
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(all_models):
            new_model = all_models[idx]
        else:
            print_error("opção inválida")
            return
    except ValueError:
        # talvez tenham digitado o nome do modelo
        if choice in all_models:
            new_model = choice
        else:
            print_error("opção inválida")
            return
    
    # salva e recarrega
    try:
        model_config.set_model(new_model)
        agent.reload_model()
        console.print()
        print_success(f"modelo alterado para {new_model}")
    except Exception as e:
        print_error(str(e))


def main():
    """Ponto de entrada principal para o llmx."""
    print_welcome()
    
    try:
        agent = Agent()
        print_success(f"conectado ({model_config.get_current_model()})")
    except ValueError as e:
        print_error(str(e))
        print_info("verifique suas chaves com /key")
        sys.exit(1)
    except Exception as e:
        from .utils.logger import log_error, get_log_path
        log_error(e, "Erro fatal ao inicializar")
        print_error(f"erro ao inicializar: {str(e)}")
        print_info(f"log salvo em: {get_log_path()}")
        sys.exit(1)
    
    # loop principal
    while True:
        try:
            user_input = print_user_prompt()
            
            # verifica comandos com barra
            if user_input.startswith('/'):
                cmd = user_input.lower().strip()
                
                if cmd in ['/exit', '/quit', '/sair', '/q']:
                    console.print()
                    print_info("ate mais!")
                    break
                
                elif cmd in ['/clear', '/limpar', '/cls']:
                    if agent:
                        agent.clear_history()
                    console.clear()
                    print_welcome()
                    print_success(f"historico limpo ({model_config.get_current_model()})")
                    continue
                
                elif cmd in ['/help', '/ajuda', '/?']:
                    print_help()
                    continue
                
                elif cmd == '/model':
                    if agent:
                        handle_model_command(agent)
                    continue
                
                elif cmd in ['/key', '/api']:
                    handle_key_command()
                    continue
                
                elif cmd == '/keys':
                    handle_keys_list()
                    continue
                
                else:
                    print_error(f"comando desconhecido: {cmd}")
                    print_info("use /help para ver comandos disponiveis")
                    continue
            
            # comandos legados (sem barra)
            if user_input.lower() in ['sair', 'exit', 'quit', 'q']:
                console.print()
                print_info("ate mais!")
                break
            
            # ignora entrada vazia
            if not user_input.strip():
                continue
            
            # processa a mensagem
            if agent:
                response = agent.run(user_input)
                print_assistant_response(response)
            else:
                print_error("agente nao inicializado corretamente")
        
        except KeyboardInterrupt:
            console.print()
            print_info("use /exit para sair")
            continue
        except EOFError:
            console.print()
            print_info("ate mais!")
            break
        except Exception as e:
            from .utils.logger import log_error, get_log_path
            log_error(e, "Erro durante execucao")
            print_error(f"erro inesperado: {str(e)}")
            print_info(f"detalhes salvos em: {get_log_path()}")
            continue


if __name__ == "__main__":
    main()
