"""Ferramentas de sistema de arquivos para o agente llmx."""

import os
import subprocess
from pathlib import Path

# definicoes de ferramentas para chamada de funcao do groq
FILESYSTEM_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "Lista arquivos e pastas em um diretório. Retorna nome, tipo e tamanho.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Caminho do diretório para listar. Use ~ para home do usuário."
                    },
                    "show_hidden": {
                        "type": "boolean",
                        "description": "Se deve mostrar arquivos ocultos (começam com .)",
                        "default": False
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_file",
            "description": "Procura arquivos por nome em um diretório e subdiretórios.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {
                        "type": "string",
                        "description": "Padrão de nome do arquivo (ex: '*.pdf', 'documento*')"
                    },
                    "search_path": {
                        "type": "string",
                        "description": "Diretório onde procurar. Padrão: home do usuário.",
                        "default": "~"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Número máximo de resultados",
                        "default": 20
                    }
                },
                "required": ["pattern"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_file_size",
            "description": "Obtém o tamanho de um arquivo ou diretório.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Caminho do arquivo ou diretório"
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Lê o conteúdo de um arquivo de texto.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Caminho do arquivo para ler"
                    },
                    "max_lines": {
                        "type": "integer",
                        "description": "Número máximo de linhas para ler",
                        "default": 100
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_path",
            "description": "Obtém o caminho absoluto de um arquivo, comando ou aplicativo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nome do arquivo, comando ou aplicativo"
                    }
                },
                "required": ["name"]
            }
        }
    }
]


def _expand_path(path: str) -> str:
    """Expande ~ e variaveis de ambiente no caminho."""
    return os.path.expanduser(os.path.expandvars(path))


def _format_size(size_bytes: int) -> str:
    """Formata bytes em um formato legivel por humanos."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} PB"


def list_directory(path: str, show_hidden: bool = False) -> str:
    """Lista arquivos em um diretorio."""
    try:
        path = _expand_path(path)
        p = Path(path)
        
        if not p.exists():
            return f"erro: diretorio '{path}' nao existe."
        
        if not p.is_dir():
            return f"erro: '{path}' nao e um diretorio."
        
        items = []
        for item in sorted(p.iterdir()):
            if not show_hidden and item.name.startswith('.'):
                continue
            
            item_type = "📁" if item.is_dir() else "📄"
            try:
                if item.is_file():
                    size = _format_size(item.stat().st_size)
                else:
                    size = ""
            except:
                size = ""
            
            items.append(f"{item_type} {item.name}" + (f" ({size})" if size else ""))
        
        if not items:
            return f"diretorio '{path}' esta vazio."
        
        return f"conteudo de {path}:\n" + "\n".join(items)
    
    except PermissionError:
        return f"erro: sem permissao para acessar '{path}'."
    except Exception as e:
        return f"erro ao listar diretorio: {str(e)}"


def find_file(pattern: str, search_path: str = "~", max_results: int = 20) -> str:
    """Encontra arquivos que coincidem com um padrao."""
    try:
        search_path = _expand_path(search_path)
        
        # usa comando find para melhor performance
        cmd = ["find", search_path, "-name", pattern, "-type", "f", "-maxdepth", "5"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        files = [f for f in result.stdout.strip().split('\n') if f][:max_results]
        
        if not files:
            return f"nenhum arquivo encontrado com o padrao '{pattern}' em '{search_path}'."
        
        return f"arquivos encontrados ({len(files)}):\n" + "\n".join(f"📄 {f}" for f in files)
    
    except subprocess.TimeoutExpired:
        return "erro: busca demorou muito tempo. tente um diretorio mais especifico."
    except Exception as e:
        return f"erro na busca: {str(e)}"


def get_file_size(path: str) -> str:
    """Obtem o tamanho de um arquivo ou diretorio."""
    try:
        path = _expand_path(path)
        p = Path(path)
        
        if not p.exists():
            return f"erro: '{path}' nao existe."
        
        if p.is_file():
            size = _format_size(p.stat().st_size)
            return f"📄 {p.name}: {size}"
        
        # para diretorios, usa comando du
        result = subprocess.run(
            ["du", "-sh", path],
            capture_output=True, text=True, timeout=60
        )
        
        if result.returncode == 0:
            size = result.stdout.split()[0]
            
            # conta arquivos
            count_result = subprocess.run(
                ["find", path, "-type", "f"],
                capture_output=True, text=True, timeout=30
            )
            file_count = len(count_result.stdout.strip().split('\n'))
            
            return f"📁 {p.name}\ntamanho total: {size}\narquivos: {file_count}"
        else:
            return f"erro ao calcular tamanho: {result.stderr}"
    
    except subprocess.TimeoutExpired:
        return "erro: calculo de tamanho demorou muito. o diretorio pode ser muito grande."
    except Exception as e:
        return f"erro: {str(e)}"


def read_file(path: str, max_lines: int = 100) -> str:
    """Le o conteudo de um arquivo de texto."""
    try:
        path = _expand_path(path)
        p = Path(path)
        
        if not p.exists():
            return f"erro: arquivo '{path}' nao existe."
        
        if not p.is_file():
            return f"erro: '{path}' nao e um arquivo."
        
        # verifica tamanho do arquivo
        if p.stat().st_size > 1024 * 1024:  # 1mb
            return f"erro: arquivo muito grande (>{_format_size(p.stat().st_size)}). use 'head' ou 'tail' para arquivos grandes."
        
        with open(p, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()[:max_lines]
        
        content = ''.join(lines)
        
        if len(lines) == max_lines:
            return f"conteudo de {p.name} (primeiras {max_lines} linhas):\n\n{content}\n\n[... arquivo truncado ...]"
        
        return f"conteudo de {p.name}:\n\n{content}"
    
    except PermissionError:
        return f"erro: sem permissao para ler '{path}'."
    except Exception as e:
        return f"erro ao ler arquivo: {str(e)}"


def get_path(name: str) -> str:
    """Obtem o caminho absoluto de um arquivo, comando ou aplicativo."""
    try:
        # tenta 'which' para comandos
        result = subprocess.run(
            ["which", name],
            capture_output=True, text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            return f"caminho de '{name}': {result.stdout.strip()}"
        
        # tenta locais comuns
        common_paths = [
            f"/usr/bin/{name}",
            f"/usr/local/bin/{name}",
            f"/bin/{name}",
            f"/sbin/{name}",
            f"/usr/sbin/{name}",
        ]
        
        for path in common_paths:
            if os.path.exists(path):
                return f"caminho de '{name}': {path}"
        
        # tenta locate se disponivel
        result = subprocess.run(
            ["locate", "-l", "5", name],
            capture_output=True, text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            paths = result.stdout.strip().split('\n')
            return f"possiveis caminhos para '{name}':\n" + "\n".join(paths)
        
        return f"nao foi possivel encontrar '{name}' no sistema."
    
    except Exception as e:
        return f"erro ao buscar caminho: {str(e)}"


def execute_filesystem_tool(tool_name: str, arguments: dict) -> str:
    """Executa uma ferramenta de sistema de arquivos."""
    tools_map = {
        "list_directory": list_directory,
        "find_file": find_file,
        "get_file_size": get_file_size,
        "read_file": read_file,
        "get_path": get_path,
    }
    
    if tool_name not in tools_map:
        return f"erro: tool '{tool_name}' nao encontrada."
    
    return tools_map[tool_name](**arguments)
