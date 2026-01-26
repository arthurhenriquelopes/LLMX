"""Micro-prompt para consulta de hardware e recursos."""

HARDWARE_ACTION = {
    "prompt": """CONSULTAR HARDWARE/RECURSOS:
Para memória RAM: get_memory_info()
Para uso de disco: get_disk_usage()
Para informações do sistema (CPU, kernel): get_system_info()

Responda de forma direta: "Você tem X GB de RAM", "Disco: X% usado".
""",
    "tools": ["get_memory_info", "get_disk_usage", "get_system_info"],
    "keywords": ["ram", "memória", "disco", "espaço", "cpu", "hardware", "kernel", "sistema operacional"],
}
