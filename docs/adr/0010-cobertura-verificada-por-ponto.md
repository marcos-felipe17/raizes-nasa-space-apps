# ADR-0010: Cobertura verificada por ponto e procedência

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-08, UC-02, [ADR-0003](0003-metodo-de-analise-e-confiabilidade.md)

## Contexto

A UC-08 deve expor dados disponíveis e ausentes. A UC-02 está numa branch remota com estrutura incompatível com a stack Next.js/FastAPI atual. Disponibilidade regional não prova adequação agronômica nem observação da parcela.

## Decisão

- A tela recebe latitude e longitude aproximadas enquanto a localização da UC-02 não for integrada à stack. Salva apenas o último ponto neste navegador.
- Os quatro dados informados pelo agricultor são `available` quando há rascunho validado e conhecido; caso contrário são `missing`. Eles pertencem ao navegador, não são evidência regional.
- O backend consulta a climatologia de ponto da NASA POWER para `T2M` e `PRECTOTCORR`. Só marca `available` se a resposta contiver valor numérico diferente de `-999`. Resposta válida sem valores é `missing`; erro ou indisponibilidade é `unverified`.
- A resposta identifica fonte e significado de cada estado. `recommendation_ready` permanece falso; esta card não calcula elegibilidade, score ou rotação.
- A integração futura da UC-02 deve passar as coordenadas resolvidas para a mesma verificação, sem presumir que um nome de localidade prove cobertura.

## Consequências

- A PoC tem uma verificação real para dois parâmetros climáticos; outras fontes NASA, solo externo e regras regionais ainda não são avaliados.
- Uma falha temporária na NASA não é confundida com ausência de dados.
- Os rascunhos locais ainda não têm vínculo persistente com o ponto consultado; a interface exige conferência pelo agricultor até a integração da UC-02.
- A cobertura do clima é uma climatologia regional, sem precisão de parcela e sem série temporal de safras.

## Fonte

- [NASA POWER: API de climatologia por ponto](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/).

## Atualização (2026-11-15)

A UC-02 foi integrada à stack Next.js/FastAPI (PR #5). A tela `/localizacao` grava as coordenadas resolvidas como ponto inicial de `/cobertura`. O agricultor continua confirmando o ponto antes da consulta, e o nome da localidade segue sem provar cobertura.
