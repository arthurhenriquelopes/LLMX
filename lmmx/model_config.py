"""Configuracao de modelo para o llmx - suporte a multiplos provedores."""

import os
from pathlib import Path
from dotenv import load_dotenv, set_key

# carrega variaveis de ambiente
load_dotenv()

# provedores e seus modelos
PROVIDERS = {
    "groq": {
        "name": "Groq",
        "models": {
            "llama-3.3-70b-versatile": "Llama 3.3 70B",
            "llama-3.1-8b-instant": "Llama 3.1 8B",
            "mixtral-8x7b-32768": "Mixtral 8x7B",
            "gemma2-9b-it": "Gemma 2 9B",
        },
        "api_key_env": "GROQ_API_KEY",
        "base_url": None,  # usa default do groq
    },
    "openrouter": {
        "name": "OpenRouter",
        "models": {
            "xiaomi/mimo-v2-flash:free": "Xiaomi MiMo-V2 Flash",
            "mistralai/devstral-2512:free": "Mistral Devstral 2",
            "nvidia/nemotron-3-nano-30b-a3b:free": "Nvidia Nemotron 30B",
            "liquid/lfm-2.5-1.2b-thinking:free": "Liquid LFM 2.5 Thinking",
        },
        "api_key_env": "OPENROUTER_API_KEY",
        "base_url": "https://openrouter.ai/api/v1",
    }
}

# todos os modelos disponiveis (para compatibilidade)
AVAILABLE_MODELS = {}
for provider_id, provider in PROVIDERS.items():
    for model_id, model_name in provider["models"].items():
        AVAILABLE_MODELS[model_id] = f"{model_name} ({provider['name']})"

DEFAULT_MODEL = "llama-3.3-70b-versatile"
DEFAULT_PROVIDER = "groq"


def get_provider_for_model(model_id: str) -> str:
    """Retorna o provedor para um modelo."""
    for provider_id, provider in PROVIDERS.items():
        if model_id in provider["models"]:
            return provider_id
    return DEFAULT_PROVIDER


class ModelConfig:
    """Gerencia configuracoes de modelo e chaves de api para multiplos provedores."""
    
    ENV_FILE = Path(__file__).parent.parent / ".env"
    
    def __init__(self):
        """Inicializa a configuracao do modelo."""
        self._current_model = os.getenv("LMMX_MODEL", DEFAULT_MODEL)
        self._current_provider = get_provider_for_model(self._current_model)
        
        # carrega chaves de api - primeiro do arquivo local, depois do .env
        self._api_keys = {}
        self._load_api_keys()
        
        self._current_key_index = 0
    
    def _load_api_keys(self):
        """Carrega chaves de api do arquivo local e .env."""
        # primeiro tenta carregar do arquivo local
        try:
            from .api_keys import load_api_keys
            local_keys = load_api_keys()
            for provider, keys in local_keys.items():
                self._api_keys[provider] = keys.copy()
        except Exception:
            pass
        
        # depois carrega do .env como fallback (nao sobrescreve)
        if "groq" not in self._api_keys:
            groq_keys = []
            for key_name in ["GROQ_API_KEY", "GROQ_API_KEY_2", "GROQ_API_KEY_3"]:
                key = os.getenv(key_name)
                if key:
                    groq_keys.append(key)
            if groq_keys:
                self._api_keys["groq"] = groq_keys
        
        if "openrouter" not in self._api_keys:
            openrouter_key = os.getenv("OPENROUTER_API_KEY")
            if openrouter_key:
                self._api_keys["openrouter"] = [openrouter_key]
    
    def reload_api_keys(self):
        """Recarrega as chaves de api."""
        self._api_keys = {}
        self._load_api_keys()
        self._current_key_index = 0
    
    def get_current_model(self) -> str:
        """Obtem o nome do modelo atual."""
        return self._current_model
    
    def get_current_provider(self) -> str:
        """Obtem o provedor atual."""
        return self._current_provider
    
    def get_provider_config(self, provider_id: str = None) -> dict:
        """Obtem configuracao do provedor."""
        provider_id = provider_id or self._current_provider
        return PROVIDERS.get(provider_id, PROVIDERS[DEFAULT_PROVIDER])
    
    def get_api_key(self, provider_id: str = None) -> str:
        """Obtem a chave de api atual para o provedor."""
        provider_id = provider_id or self._current_provider
        keys = self._api_keys.get(provider_id, [])
        if keys:
            idx = min(self._current_key_index, len(keys) - 1)
            return keys[idx]
        return ""
    
    def get_all_api_keys(self, provider_id: str = None) -> list:
        """Obtem todas as chaves de api disponiveis para o provedor."""
        provider_id = provider_id or self._current_provider
        return self._api_keys.get(provider_id, []).copy()
    
    def switch_api_key(self) -> bool:
        """Troca para a proxima chave de api. retorna true se trocou, false se nao houver mais chaves."""
        keys = self._api_keys.get(self._current_provider, [])
        if self._current_key_index < len(keys) - 1:
            self._current_key_index += 1
            return True
        return False
    
    def reset_key_index(self):
        """Reinicia para a primeira chave de api."""
        self._current_key_index = 0
    
    def set_model(self, model: str):
        """Define o modelo atual."""
        if model not in AVAILABLE_MODELS:
            raise ValueError(f"modelo desconhecido: {model}")
        
        self._current_model = model
        self._current_provider = get_provider_for_model(model)
        self._current_key_index = 0  # reseta indice ao trocar provedor
        
        # salva no .env
        if self.ENV_FILE.exists():
            set_key(str(self.ENV_FILE), "LMMX_MODEL", model)
        
        os.environ["LMMX_MODEL"] = model
    
    def get_available_models(self) -> dict:
        """Obtem todos os modelos disponiveis com descricoes."""
        return AVAILABLE_MODELS.copy()
    
    def get_providers(self) -> dict:
        """Obtem todos os provedores disponiveis."""
        return PROVIDERS.copy()


# instancia global
model_config = ModelConfig()
