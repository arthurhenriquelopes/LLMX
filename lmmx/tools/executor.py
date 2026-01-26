"""Ferramentas de execucao de comandos com suporte a sudo e confirmacao do usuario."""

import subprocess
import shlex
from ..utils.console import confirm_sudo_command, confirm_command, print_command_output

# definicoes de ferramentas para chamada de funcao do groq
EXECUTOR_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Executa um comando shell. Para comandos que modificam o sistema, use run_sudo_command.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "O comando a ser executado (sem sudo)"
                    },
                    "require_confirmation": {
                        "type": "boolean",
                        "description": "Se deve pedir confirmação do usuário antes de executar",
                        "default": True
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_sudo_command",
            "description": "Executa um comando com privilégios sudo. SEMPRE requer confirmação do usuário.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "O comando a ser executado com sudo (sem incluir 'sudo' no comando)"
                    }
                },
                "required": ["command"]
            }
        }
    }
]


def run_command(command: str, require_confirmation: bool = True) -> str:
    """Executa um comando shell."""
    try:
        # verificacao de seguranca - rejeita comandos obviamente perigosos
        dangerous_patterns = ["rm -rf /", "rm -rf /*", ":(){", "mkfs", "dd if="]
        for pattern in dangerous_patterns:
            if pattern in command:
                return f"⛔ comando bloqueado por seguranca: {command}"
        
        # pede confirmacao se necessario
        if require_confirmation:
            if not confirm_command(command):
                return "❌ comando cancelado pelo usuario."
        
        # executa o comando
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        output = result.stdout.strip()
        error = result.stderr.strip()
        
        if result.returncode == 0:
            if output:
                return f"✅ comando executado com sucesso:\n{output}"
            else:
                return "✅ comando executado com sucesso (sem saida)."
        else:
            if error:
                return f"❌ erro (codigo {result.returncode}):\n{error}"
            else:
                return f"❌ comando falhou com codigo {result.returncode}"
    
    except subprocess.TimeoutExpired:
        return "⏱️ erro: comando demorou mais de 2 minutos e foi cancelado."
    except Exception as e:
        return f"❌ erro ao executar comando: {str(e)}"


def run_sudo_command(command: str) -> str:
    """Executa um comando com privilegios sudo."""
    try:
        # remove sudo se ja estiver no comando para evitar "sudo sudo"
        if command.strip().startswith("sudo "):
            command = command.strip()[5:]  # remove prefixo "sudo "
        
        # verificacao de seguranca - rejeita comandos obviamente perigosos
        dangerous_patterns = ["rm -rf /", "rm -rf /*", ":(){", "mkfs.", "dd if=/dev/zero", "chmod -R 777 /"]
        for pattern in dangerous_patterns:
            if pattern in command:
                return f"⛔ comando bloqueado por seguranca: sudo {command}"
        
        # sempre requer confirmacao para comandos sudo
        full_command = f"sudo {command}"
        if not confirm_sudo_command(full_command):
            return "❌ comando sudo cancelado pelo usuario."
        
        # executa com sudo
        result = subprocess.run(
            full_command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutos para comandos sudo (instalacao, etc.)
        )
        
        output = result.stdout.strip()
        error = result.stderr.strip()
        
        if result.returncode == 0:
            if output:
                return f"✅ comando sudo executado com sucesso:\n{output}"
            else:
                return "✅ comando sudo executado com sucesso."
        else:
            if error:
                return f"❌ erro sudo (codigo {result.returncode}):\n{error}"
            else:
                return f"❌ comando sudo falhou com codigo {result.returncode}"
    
    except subprocess.TimeoutExpired:
        return "⏱️ erro: comando sudo demorou mais de 5 minutos e foi cancelado."
    except Exception as e:
        return f"❌ erro ao executar comando sudo: {str(e)}"


def execute_executor_tool(tool_name: str, arguments: dict) -> str:
    """Executa uma ferramenta de execucao."""
    tools_map = {
        "run_command": run_command,
        "run_sudo_command": run_sudo_command,
    }
    
    if tool_name not in tools_map:
        return f"erro: tool '{tool_name}' nao encontrada."
    
    return tools_map[tool_name](**arguments)
