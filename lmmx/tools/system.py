"""Ferramentas de informacao de sistema para o agente llmx."""

import subprocess
import os

# definicoes de ferramentas para chamada de funcao do groq
SYSTEM_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_disk_usage",
            "description": "Mostra uso de espaço em disco das partições.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_memory_info",
            "description": "Mostra informações sobre uso de memória RAM e swap.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_system_info",
            "description": "Mostra informações do sistema: OS, kernel, hostname, uptime.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_processes",
            "description": "Lista os processos que mais consomem CPU ou memória.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sort_by": {
                        "type": "string",
                        "description": "Ordenar por 'cpu' ou 'memory'",
                        "enum": ["cpu", "memory"],
                        "default": "cpu"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Número de processos para mostrar",
                        "default": 10
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_package_info",
            "description": "Obtém informações sobre um pacote instalado ou disponível.",
            "parameters": {
                "type": "object",
                "properties": {
                    "package_name": {
                        "type": "string",
                        "description": "Nome do pacote para consultar"
                    }
                },
                "required": ["package_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_terminal_info",
            "description": "Obtém informações sobre o processo atual do LLMX e seu terminal pai (PID, uso de CPU/RAM).",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]


def get_disk_usage() -> str:
    """Obtem informacoes de uso de disco."""
    try:
        result = subprocess.run(
            ["df", "-h", "--output=source,size,used,avail,pcent,target", "-x", "tmpfs", "-x", "devtmpfs"],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            return f"uso de disco:\n```\n{result.stdout}\n```"
        else:
            return f"erro ao obter uso de disco: {result.stderr}"
    except Exception as e:
        return f"erro: {str(e)}"


def get_memory_info() -> str:
    """Obtem informacoes de uso de memoria."""
    try:
        result = subprocess.run(
            ["free", "-h"],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            return f"uso de memoria:\n```\n{result.stdout}\n```"
        else:
            return f"erro ao obter memoria: {result.stderr}"
    except Exception as e:
        return f"erro: {str(e)}"


def get_system_info() -> str:
    """Obtem informacoes do sistema."""
    try:
        info = []
        
        # hostname
        hostname = subprocess.run(["hostname"], capture_output=True, text=True)
        info.append(f"hostname: {hostname.stdout.strip()}")
        
        # info do os de /etc/os-release
        if os.path.exists("/etc/os-release"):
            with open("/etc/os-release") as f:
                for line in f:
                    if line.startswith("PRETTY_NAME="):
                        os_name = line.split("=")[1].strip().strip('"')
                        info.append(f"sistema: {os_name}")
                        break
        
        # kernel
        kernel = subprocess.run(["uname", "-r"], capture_output=True, text=True)
        info.append(f"kernel: {kernel.stdout.strip()}")
        
        # arquitetura
        arch = subprocess.run(["uname", "-m"], capture_output=True, text=True)
        info.append(f"arquitetura: {arch.stdout.strip()}")
        
        # uptime
        uptime = subprocess.run(["uptime", "-p"], capture_output=True, text=True)
        info.append(f"uptime: {uptime.stdout.strip().replace('up ', '')}")
        
        # info da cpu
        with open("/proc/cpuinfo") as f:
            for line in f:
                if line.startswith("model name"):
                    cpu_model = line.split(":")[1].strip()
                    info.append(f"cpu: {cpu_model}")
                    break
        
        # nucleos da cpu
        cores = subprocess.run(["nproc"], capture_output=True, text=True)
        info.append(f"nucleos: {cores.stdout.strip()}")
        
        return "informacoes do sistema:\n" + "\n".join(info)
    except Exception as e:
        return f"erro ao obter informacoes: {str(e)}"


def list_processes(sort_by: str = "cpu", limit: int = 10) -> str:
    """Lista os principais processos por cpu ou memoria."""
    try:
        if sort_by == "cpu":
            sort_key = "-pcpu"
            header = "top processos por cpu:"
        else:
            sort_key = "-pmem"
            header = "top processos por memoria:"
        
        result = subprocess.run(
            ["ps", "aux", "--sort", sort_key],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            output = '\n'.join(lines[:limit + 1])  # +1 para o cabecalho
            return f"{header}\n```\n{output}\n```"
        else:
            return f"erro ao listar processos: {result.stderr}"
    except Exception as e:
        return f"erro: {str(e)}"


def get_package_info(package_name: str) -> str:
    """Obtem informacoes sobre um pacote."""
    try:
        # tenta apt-cache show primeiro
        result = subprocess.run(
            ["apt-cache", "show", package_name],
            capture_output=True, text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            # analisa apenas campos relevantes
            info = {}
            for line in result.stdout.split('\n'):
                for field in ['Package', 'Version', 'Installed-Size', 'Description']:
                    if line.startswith(f"{field}:"):
                        info[field] = line.split(":", 1)[1].strip()
            
            # verifica se esta instalado
            dpkg_result = subprocess.run(
                ["dpkg", "-s", package_name],
                capture_output=True, text=True
            )
            installed = dpkg_result.returncode == 0
            
            output = f"pacote: {info.get('Package', package_name)}\n"
            output += f"versao: {info.get('Version', 'N/A')}\n"
            output += f"tamanho: {info.get('Installed-Size', 'N/A')} KB\n"
            output += f"instalado: {'sim ✅' if installed else 'nao ❌'}\n"
            output += f"descricao: {info.get('Description', 'N/A')}"
            
            return output
        else:
            return f"pacote '{package_name}' nao encontrado nos repositorios."
    except Exception as e:
        return f"erro ao consultar pacote: {str(e)}"


def get_terminal_info() -> str:
    """Obtem informacoes sobre o processo do terminal atual."""
    try:
        # pid atual (python script)
        current_pid = os.getpid()
        
        # obter pid do pai (shell) e avo (terminal emulator)
        ppid_result = subprocess.run(
            ["ps", "-o", "ppid=", "-p", str(current_pid)],
            capture_output=True, text=True
        )
        ppid = ppid_result.stdout.strip()
        
        # obter informacoes dos processos relacionados
        # comm= (command name), %cpu, %mem, rss (resident sizes)
        result = subprocess.run(
            ["ps", "-p", f"{current_pid},{ppid}", "-o", "pid,ppid,user,%cpu,%mem,rss,comm,args"],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            return f"informacoes do terminal atual:\n```\n{result.stdout.strip()}\n```\n\nLEGENDA PID:\n- {current_pid}: LLMX (este processo)\n- {ppid}: Shell Pai (terminal)"
        else:
            return f"erro ao obter info do terminal: {result.stderr}"
            
    except Exception as e:
        return f"erro: {str(e)}"


def execute_system_tool(tool_name: str, arguments: dict) -> str:
    """Executa uma ferramenta de sistema."""
    tools_map = {
        "get_disk_usage": get_disk_usage,
        "get_memory_info": get_memory_info,
        "get_system_info": get_system_info,
        "list_processes": list_processes,
        "list_processes": list_processes,
        "get_package_info": get_package_info,
        "get_terminal_info": get_terminal_info,
    }
    
    if tool_name not in tools_map:
        return f"erro: tool '{tool_name}' nao encontrada."
    
    func = tools_map[tool_name]
    
    # trata funcoes sem parametros
    if tool_name in ["get_disk_usage", "get_memory_info", "get_system_info", "get_terminal_info"]:
        return func()
    
    return func(**arguments)
