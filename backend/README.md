# API do Raízes

API FastAPI para explorar cenários simulados (US-01) e validar solo, regime hídrico e histórico de uma área de cultivo (UC-03 a UC-05).

## Executar

No diretório `backend`:

```powershell
python -m pip install -e .
python -m uvicorn raizes_api.main:app --reload
```

O contrato pode ser explorado em `/docs`. O endpoint `POST /api/v1/areas/soil/validate` aceita solo conhecido ou “não sei”, preserva a origem do dado e indica quando o solo é desconhecido. Ele ainda não salva a área nem recomenda culturas.

O endpoint `POST /api/v1/areas/profile/validate` recebe o solo e um regime hídrico obrigatório: `rainfed` (sequeiro) ou `irrigated` (irrigado). Ele devolve o regime no perfil validado e as lacunas conhecidas. Uma área com regimes diferentes deve ser descrita como áreas separadas.

O endpoint `POST /api/v1/areas/history/validate` recebe uma lista cronológica de culturas e meses de início/fim, preservando a sequência validada.

Os endpoints `GET /api/scenarios` e `GET /api/scenarios/{id}` expõem apenas fixtures identificadas como simuladas. Um ID inexistente retorna 404.

## Testar

```powershell
python -m unittest discover -s tests -v
```
