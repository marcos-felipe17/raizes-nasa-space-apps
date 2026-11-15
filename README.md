# raizes-nasa-space-apps
Collaborative agricultural decision-support tool powered by NASA Earth Observations for the Field Shift Challenge (NASA Space Apps 2026).

Protótipo de apoio à decisão para explorar rotações de culturas com dados da propriedade, observações da Terra da NASA, fontes agrícolas locais e experiências comunitárias.

## Estrutura

- `src/interface/`: entrada e apresentação para o usuário (Next.js App Router).
- `src/api/`: exposição HTTP da aplicação (FastAPI em `src/api/main.py`).
- `src/application/`: casos de uso e coordenação do fluxo (`src/application/list_scenarios.py`).
- `src/domain/`: regras, modelos e estados da análise (`src/domain/scenario.py`).
- `src/infrastructure/`: leitura de fixtures e conectores de dados (`src/infrastructure/scenario_repository.py`).
- `data/fixtures/`: cenários fictícios e dados de demonstração identificados (`data/fixtures/scenarios.json`).
- `docs/adr/`: registros das decisões de arquitetura.
- `docs/stories/`: histórias de usuário e critérios de aceite.
- `tests/`: testes automatizados (`pytest`).

As pastas Python (`src/`, `src/domain/`, `src/application/`, `src/infrastructure/`, `src/api/` e `tests/`) possuem `__init__.py` para funcionar como pacotes importáveis a partir da raiz do repositório.

## Estado do projeto

A arquitetura conceitual está registrada em [ADR-0001](docs/adr/0001-arquitetura-do-raizes.md). Atualmente está implementada a [US-01 — Selecionar cenário](docs/stories/US-01-selecionar-cenario.md).

## Versões e Dependências

Ambiente verificado nesta máquina:
- **Python:** `3.14.4`
- **Node.js:** `v26.13.1` (npm `11.20.0`)

### Dependências Backend (`requirements.txt`)
- `fastapi==0.115.12`
- `uvicorn==0.34.0`
- `pytest==8.3.5`
- `httpx==0.28.1`

### Dependências Frontend (`src/interface/package.json`)
- `next`: `15.5.29`
- `react`: `19.3.1`
- `react-dom`: `19.3.1`

> **Nota:** `npm audit` mostra 2 avisos residuais (`postcss`, dependência indireta do Next, usada na compilação), sem vulnerabilidades críticas. Revisar antes de qualquer deploy.

## Como rodar (em máquina limpa)

### 1. Configurar variáveis de ambiente (opcional — já possuem valores padrão para desenvolvimento local)

Na raiz do projeto (variáveis do backend):
```powershell
Copy-Item .env.example .env
```

Na pasta do frontend (`src/interface/`):
```powershell
Copy-Item src/interface/.env.example src/interface/.env.local
```

### 2. Backend (FastAPI) e Testes (`pytest`)

Na **raiz do repositório**:

```powershell
# Criar ambiente virtual Python
python -m venv .venv

# Instalar dependências
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Rodar os testes automatizados (pytest usa pytest.ini com pythonpath = .)
.\.venv\Scripts\python.exe -m pytest

# Subir o servidor FastAPI em http://localhost:8000
.\.venv\Scripts\python.exe -m uvicorn src.api.main:app --reload --port 8000
```

*(Em Linux/macOS, substitua `.\.venv\Scripts\python.exe` por `./.venv/bin/python`).*

Endpoints disponíveis na US-01:
- `GET http://localhost:8000/api/scenarios`
- `GET http://localhost:8000/api/scenarios/{id}`

### 3. Frontend (Next.js)

Em outro terminal, a partir da **raiz do repositório**:

```powershell
cd src/interface
npm install
npm run dev
```

Acesse a aplicação no navegador em: `http://localhost:3000`
