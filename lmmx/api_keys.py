"""Gerenciador de chaves de api do usuario."""

import os
from pathlib import Path

# diretorio de configuracao do lmmx
LMMX_DIR = Path.home() / ".lmmx"
API_KEYS_FILE = LMMX_DIR / "api_keys.txt"


def _ensure_dir():
    """Cria o diretorio de configuracao se nao existir."""
    LMMX_DIR.mkdir(exist_ok=True)


def load_api_keys() -> dict:
    """
    Carrega chaves de api do arquivo local.
    
    returns:
        dicionario {provider: [keys]}
    """
    keys = {}
    
    if not API_KEYS_FILE.exists():
        return keys
    
    try:
        with open(API_KEYS_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if ":" in line:
                    provider, key = line.split(":", 1)
                    provider = provider.strip().lower()
                    key = key.strip()
                    if provider not in keys:
                        keys[provider] = []
                    if key not in keys[provider]:
                        keys[provider].append(key)
    except Exception:
        pass
    
    return keys


def save_api_key(provider: str, key: str) -> bool:
    """
    Salva uma nova chave de api.
    
    args:
        provider: nome do provedor (groq, manus)
        key: chave de api
        
    returns:
        true se salvou com sucesso
    """
    _ensure_dir()
    
    # carrega chaves existentes para verificar duplicata
    existing = load_api_keys()
    if provider in existing and key in existing[provider]:
        return False  # ja existe
    
    try:
        with open(API_KEYS_FILE, "a") as f:
            f.write(f"{provider}:{key}\n")
        return True
    except Exception:
        return False


def get_keys_for_provider(provider: str) -> list:
    """
    Retorna lista de chaves para um provedor.
    
    args:
        provider: nome do provedor
        
    returns:
        lista de chaves ou lista vazia
    """
    keys = load_api_keys()
    return keys.get(provider.lower(), [])


def has_key_for_provider(provider: str) -> bool:
    """Verifica se existe pelo menos uma chave para o provedor."""
    return len(get_keys_for_provider(provider)) > 0


def list_providers_with_keys() -> dict:
    """
    Lista provedores e quantidade de chaves (mascaradas).
    
    returns:
        dicionario {provider: [(masked_key, full_key)]}
    """
    keys = load_api_keys()
    result = {}
    
    for provider, key_list in keys.items():
        result[provider] = []
        for key in key_list:
            # mascara a chave: mostra primeiros 8 e ultimos 4 caracteres
            if len(key) > 12:
                masked = key[:8] + "..." + key[-4:]
            else:
                masked = key[:4] + "..."
            result[provider].append((masked, key))
    
    return result


def delete_api_key(provider: str, key_index: int) -> bool:
    """
    Remove uma chave de api.
    
    args:
        provider: nome do provedor
        key_index: indice da chave (0-based)
        
    returns:
        true se removeu com sucesso
    """
    keys = load_api_keys()
    
    if provider not in keys or key_index >= len(keys[provider]):
        return False
    
    # remove a chave
    del keys[provider][key_index]
    
    # reescreve o arquivo
    _ensure_dir()
    try:
        with open(API_KEYS_FILE, "w") as f:
            for prov, key_list in keys.items():
                for key in key_list:
                    f.write(f"{prov}:{key}\n")
        return True
    except Exception:
        return False
