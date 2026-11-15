# API do Raízes

Base FastAPI para informar o solo e o regime hídrico de uma área de cultivo (UC-03 e UC-04).

## Executar

No diretório `backend`:

```powershell
python -m pip install -e .
python -m uvicorn raizes_api.main:app --reload
```

O contrato pode ser explorado em `/docs`. O endpoint `POST /api/v1/areas/soil/validate` aceita solo conhecido ou “não sei”, preserva a origem do dado e indica quando o solo é desconhecido. Ele ainda não salva a área nem recomenda culturas.

O endpoint `POST /api/v1/areas/profile/validate` recebe o solo e um regime hídrico obrigatório: `rainfed` (sequeiro) ou `irrigated` (irrigado). Ele devolve o regime no perfil validado e as lacunas conhecidas. Uma área com regimes diferentes deve ser descrita como áreas separadas.

## Testar

```powershell
python -m unittest discover -s tests -v
```
