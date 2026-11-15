# API do Raízes

Base FastAPI para informar o solo de uma área de cultivo (UC-03).

## Executar

No diretório `backend`:

```powershell
python -m pip install -e .
python -m uvicorn raizes_api.main:app --reload
```

O contrato pode ser explorado em `/docs`. O endpoint `POST /api/v1/areas/soil/validate` aceita solo conhecido ou “não sei”, preserva a origem do dado e indica quando o solo é desconhecido. Ele ainda não salva a área nem recomenda culturas.

## Testar

```powershell
python -m unittest discover -s tests -v
```
