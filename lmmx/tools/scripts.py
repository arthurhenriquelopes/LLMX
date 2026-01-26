"""Ferramentas de criacao e gerencimento de scripts."""

import os
import stat
from pathlib import Path
from ..utils.console import confirm_command

# definicoes de ferramentas
SCRIPT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_script",
            "description": "Cria um script shell e salva em um arquivo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Nome do arquivo do script (ex: limpar_cache.sh)"
                    },
                    "content": {
                        "type": "string",
                        "description": "Conteúdo completo do script (incluindo shebang)"
                    },
                    "directory": {
                        "type": "string",
                        "description": "Diretório onde salvar o script. Padrão: diretório atual",
                        "default": "."
                    },
                    "executable": {
                        "type": "boolean",
                        "description": "Se deve tornar o script executável",
                        "default": True
                    }
                },
                "required": ["filename", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_script",
            "description": "Executa um script existente. Requer confirmação do usuário.",
            "parameters": {
                "type": "object",
                "properties": {
                    "script_path": {
                        "type": "string",
                        "description": "Caminho para o script a ser executado"
                    },
                    "use_sudo": {
                        "type": "boolean",
                        "description": "Se deve executar com sudo",
                        "default": False
                    }
                },
                "required": ["script_path"]
            }
        }
    }
]


def create_script(filename: str, content: str, directory: str = ".", executable: bool = True) -> str:
    """Cria um arquivo de script shell."""
    try:
        # expande o caminho
        directory = os.path.expanduser(directory)
        dir_path = Path(directory)
        
        # cria o diretorio se nao existir
        dir_path.mkdir(parents=True, exist_ok=True)
        
        # caminho completo
        script_path = dir_path / filename
        
        # adiciona shebang se nao estiver presente
        if not content.strip().startswith("#!"):
            content = "#!/bin/bash\n\n" + content
        
        # escreve o script
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # torna executavel se solicitado
        if executable:
            script_path.chmod(script_path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
        
        abs_path = script_path.resolve()
        
        result = f"✅ script criado: {abs_path}\n"
        if executable:
            result += f"📝 para executar:\n   ./{filename}\n   ou\n   bash {abs_path}"
        
        return result
    
    except PermissionError:
        return f"❌ erro: sem permissao para criar arquivo em '{directory}'."
    except Exception as e:
        return f"❌ erro ao criar script: {str(e)}"


def run_script(script_path: str, use_sudo: bool = False) -> str:
    """Executa um arquivo de script."""
    import subprocess
    from ..utils.console import confirm_sudo_command
    
    try:
        script_path = os.path.expanduser(script_path)
        path = Path(script_path)
        
        if not path.exists():
            return f"❌ erro: script '{script_path}' nao encontrado."
        
        if not path.is_file():
            return f"❌ erro: '{script_path}' nao e um arquivo."
        
        # constroi o comando
        if use_sudo:
            cmd = f"sudo bash {path.resolve()}"
            if not confirm_sudo_command(cmd):
                return "❌ execucao do script cancelada pelo usuario."
        else:
            cmd = f"bash {path.resolve()}"
            if not confirm_command(cmd):
                return "❌ execucao do script cancelada pelo usuario."
        
        # executa
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        output = result.stdout.strip()
        error = result.stderr.strip()
        
        if result.returncode == 0:
            if output:
                return f"✅ script executado com sucesso:\n{output}"
            else:
                return "✅ script executado com sucesso (sem saida)."
        else:
            combined = f"{output}\n{error}".strip()
            return f"❌ script falhou (codigo {result.returncode}):\n{combined}"
    
    except subprocess.TimeoutExpired:
        return "⏱️ erro: script demorou mais de 5 minutos e foi cancelado."
    except Exception as e:
        return f"❌ erro ao executar script: {str(e)}"


def execute_script_tool(tool_name: str, arguments: dict) -> str:
    """Executa uma ferramenta de script."""
    tools_map = {
        "create_script": create_script,
        "run_script": run_script,
    }
    
    if tool_name not in tools_map:
        return f"erro: tool '{tool_name}' nao encontrada."
    
    return tools_map[tool_name](**arguments)
