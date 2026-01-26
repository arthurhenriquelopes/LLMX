"""Utilitarios de console para saida rica no terminal - estilo moderno e limpo."""

from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.markdown import Markdown
from rich.text import Text
from rich.spinner import Spinner
from rich.live import Live
from rich.theme import Theme

# tema personalizado com cores melhores
custom_theme = Theme({
    "info": "dim cyan",
    "warning": "yellow",
    "error": "bold red",
    "success": "green",
    "prompt": "bold bright_white",
    "tool": "dim bright_black",
    "highlight": "bold cyan",
})

console = Console(theme=custom_theme, markup=False, highlight=False)


def print_welcome():
    ascii_logo = """
      ___       ___       ___           __      
     /  /\\     /  /\\     /  /\\         |  |\\    
    /  /:/    /  /:/    /  /::|        |  |:|   
   /  /:/    /  /:/    /  /:|:|        |  |:|   
  /  /:/    /  /:/    /  /:/|:|__      |__|:|__ 
 /__/:/    /__/:/    /__/:/_|:::::\\ ____/__/::::\\
 \\  \\:\\    \\  \\:\\    \\__\\/  /~~/:/ \\__\\::::/~~~~
  \\  \\:\\    \\  \\:\\         /  /:/     |~~|:|    
   \\  \\:\\    \\  \\:\\       /  /:/      |  |:|    
    \\  \\:\\    \\  \\:\\     /__/:/       |__|:|    
     \\__\\/     \\__\\/     \\__\\/         \\__\\|    
"""
    console.print(Text(ascii_logo, style="bold dodger_blue1"))
    console.print(Text.assemble(
        ("◆ LLMx", "bold dodger_blue1"),
        (" v0.1.0", "dim")
    ))
    console.print(Text("Assistente Linux • Llama 3.3 70B • Groq", style="dim"))
    console.print(Text("/help para comandos • /exit para sair", style="dim"))
    console.print()


def print_user_prompt() -> str:
    """Obtem a entrada do usuario."""
    console.print()
    console.print(Text("›", style="bold dodger_blue1"), end=" ")
    return input()


def print_assistant_response(response: str):
    """Mostra a resposta do assistente com formatacao markdown."""
    console.print()
    # cria console com markup habilitado apenas para markdown
    md_console = Console(
        theme=custom_theme,
        force_terminal=True,
        color_system="auto"
    )
    # markdown personalizado com negrito estilizado (branco brilhante para contraste)
    md = Markdown(
        response,
        style="dim white",  # texto base e dim
        code_theme="monokai",
    )
    md_console.print(md)


def print_tool_call(tool_name: str, description: str = None):
    """Mostra quando uma ferramenta esta sendo chamada."""
    if description:
        console.print(Text.assemble(
            ("⟡ ", "dim"),
            (tool_name, "dim"),
            (" (", "dim"),
            (description, "dim italic"),
            (")", "dim")
        ))
    else:
        console.print(Text(f"⟡ {tool_name}", style="dim"))


def print_error(message: str):
    """Mostra uma mensagem de erro."""
    console.print(Text.assemble(
        ("✗ ", "bold red"),
        (message, "red")
    ))


def print_warning(message: str):
    """Mostra uma mensagem de aviso."""
    console.print(Text.assemble(
        ("! ", "yellow"),
        (message, "yellow")
    ))


def print_info(message: str):
    """Mostra uma mensagem de informacao."""
    console.print(Text(f"› {message}", style="dim cyan"))


def print_success(message: str):
    """Mostra uma mensagem de sucesso."""
    console.print(Text.assemble(
        ("✓ ", "green"),
        (message, "green")
    ))


def confirm_sudo_command(command: str) -> bool:
    """Pede ao usuario para confirmar um comando sudo."""
    console.print()
    console.print(Text("⚠ SUDO", style="bold yellow"))
    console.print(Text(f"  {command}", style="bold white"))
    console.print(Text("  Executar? [Y/n]: ", style="yellow"), end="")
    response = input().strip().lower()
    return response not in ['n', 'no', 'nao', 'não']


def confirm_command(command: str) -> bool:
    """Pede ao usuario para confirmar uma execucao de comando comum."""
    console.print(Text.assemble(
        ("→ ", "dim"),
        (command, "white")
    ))
    console.print(Text("Confirmar? [Y/n]: ", style="dim"), end="")
    response = input().strip().lower()
    return response not in ['n', 'no', 'nao', 'não']


def print_command_output(output: str, success: bool = True):
    """Mostra a saida de um comando."""
    if output.strip():
        style = "dim green" if success else "dim red"
        for line in output.strip().split('\n'):
            console.print(Text(f"  {line}", style=style))


def get_spinner():
    """Obtem um spinner para estados de carregamento."""
    return Live(
        Text.assemble(
            ("◆ ", "bold dodger_blue1"),
            ("pensando...", "dim")
        ),
        console=console,
        transient=True
    )
