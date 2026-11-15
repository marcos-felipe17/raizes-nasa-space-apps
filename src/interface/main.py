from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.application.localizacao import LocalizacaoInput, processar_localizacao

app = FastAPI(title="Raízes - UC-02", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/localizacao")
def informar_localizacao(dados: LocalizacaoInput):
    return processar_localizacao(dados)