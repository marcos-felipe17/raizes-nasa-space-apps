from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.domain.prioridade import TipoPrioridade, ResultadoPrioridade, avaliar_prioridade
from src.application.prioridade import PrioridadeInput, PrioridadeOutput, processar_prioridade

app = FastAPI()

# 1. Configurar o CORS logo no início (antes das rotas!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite qualquer origem na PoC
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, OPTIONS, etc.
    allow_headers=["*"],
)

# 2. A tua rota da UC-07
@app.post("/api/v1/prioridade", response_model=PrioridadeOutput)
def definir_prioridade(dados: PrioridadeInput):
    return processar_prioridade(dados)