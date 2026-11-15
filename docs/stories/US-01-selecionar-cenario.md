# US-01 — Selecionar cenário (UC-01)

**Como** visitante, **quero** selecionar um cenário fictício, **para** explorar o Raízes sem cadastrar uma fazenda.

**Prioridade:** P0 · **Dependência:** nenhuma

## Critérios de aceite

1. A página inicial mostra pelo menos dois cenários, com nome, região aproximada e selo "Simulado".
2. O detalhe mostra solo, regime hídrico, histórico de cultivo, culturas possíveis e prioridade, com aviso de que o cenário é fictício e não constitui recomendação agronômica.
3. Se a API falhar, a tela oferece "Tentar novamente".
4. Um identificador inexistente mostra "Cenário não encontrado" e retorno à lista.
5. Campos ausentes aparecem como "não informado".
6. A API e a interface só exibem cenários marcados como simulados.

## Implementação

- FastAPI em `backend/raizes_api/main.py`: `GET /api/scenarios` e `GET /api/scenarios/{id}`.
- Fixtures em `data/fixtures/scenarios.json`, validadas com os contratos de solo, água e histórico já usados nas UC-03 a UC-05.
- Next.js em `frontend/app/page.tsx` e `frontend/app/scenarios/[id]/page.tsx`; rotas do próprio Next.js repassam as consultas à API.
- Testes do backend em `backend/tests/test_scenarios.py`.
- Decisão de integração registrada no [ADR-0008](../adr/0008-cenarios-simulados-na-stack-unica.md).

## Fora de escopo

Login, cálculo de adequação ou confiança, dados NASA, relatos comunitários, banco de dados e preenchimento automático de uma área real.
