# API do Raízes

Base FastAPI para informar localização, solo, regime hídrico, histórico e culturas candidatas de uma área de cultivo (UC-02 a UC-06).

## Executar

No diretório `backend`:

```powershell
python -m pip install -e ".[dev]"
python -m uvicorn raizes_api.main:app --reload
```

O contrato pode ser explorado em `/docs`. O endpoint `POST /api/v1/areas/soil/validate` aceita solo conhecido ou “não sei”, preserva a origem do dado e indica quando o solo é desconhecido. Ele ainda não salva a área nem recomenda culturas.

O endpoint `POST /api/v1/areas/profile/validate` recebe o solo e um regime hídrico obrigatório: `rainfed` (sequeiro) ou `irrigated` (irrigado). Ele devolve o regime no perfil validado e as lacunas conhecidas. Uma área com regimes diferentes deve ser descrita como áreas separadas.

O endpoint `POST /api/v1/areas/history/validate` recebe uma lista cronológica de culturas e meses de início/fim, preservando a sequência validada.

O endpoint `POST /api/v1/areas/candidate-crops/validate` registra culturas candidatas ou `unknown` e devolve `eligibility_evaluated: false`. A lista informada ainda não passou por verificação agronômica.

## Testar

```powershell
python -m unittest discover -s tests -v
```

## Dados da NASA POWER (contexto)

Baixa uma vez a série diária de precipitação (PRECTOTCORR) e temperatura (T2M) para um ponto e salva em `data/fixtures/nasa_power/`. A demo lê o arquivo salvo, não a API ao vivo.

```bash
cd backend
python scripts/fetch_power.py --name sinop-mt --lat -11.8609 --lon -55.5053 --start 20140101 --end 20241231
python -m unittest tests.test_fetch_power -v
```

Os dados são contexto ambiental e não alteram o resultado de nenhuma regra agronômica.
