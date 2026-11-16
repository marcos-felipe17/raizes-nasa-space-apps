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

O endpoint `POST /api/v1/areas/location/resolve` recebe `{"place": "Sinop, MT"}`, obtém coordenadas aproximadas no OpenStreetMap Nominatim e a climatologia da NASA POWER para o ponto. Local não encontrado retorna 404; geocodificador indisponível retorna 503. Se só a NASA falhar, as coordenadas voltam e o clima vem como `unavailable`.

O endpoint `POST /api/v1/areas/coverage` recebe latitude e longitude e informa, por item, se o dado está `available`, `missing` ou `unverified`. `recommendation_ready` é sempre `false`.

Esses dois endpoints consultam serviços externos. Os testes usam respostas simuladas e não dependem de rede.

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

## Época de plantio (ZARC)

`POST /api/v1/zarc/evaluate` avalia cada safra (cultura e decêndio de plantio) pela Tábua de Risco do ZARC 2025/2026, e `POST /api/v1/zarc/coverage` lista as culturas e épocas indicadas no município. `GET /api/v1/areas/cep/{cep}` devolve município, UF e código IBGE (ViaCEP). Decisões em [ADR-0017](../docs/adr/0017-zarc-como-regra-de-epoca.md).

Para atualizar a tábua com o CSV de outra safra, baixado do portal de dados abertos do MAPA:

```bash
cd backend
python scripts/build_zarc_fixture.py CAMINHO_DO_CSV --safra 2026-2027 --url URL_DO_CSV --modificado "DATA"
```
