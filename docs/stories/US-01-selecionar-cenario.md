# US-01 — Selecionar cenário (UC-01)

**Como** visitante, **quero** selecionar um cenário fictício, **para** explorar o Raízes sem cadastrar uma fazenda.

**Prioridade:** P0 · **Dependência:** nenhuma
**Decisões:** sem login no MVP; unidade de análise = área de cultivo.

## Critérios de aceite
1. **Dado** que abri a página inicial e a API respondeu, **quando** a página carrega, **então** vejo pelo menos 2 cenários, cada um com nome, região aproximada e selo "Simulado".
2. **Dado** que escolhi um cenário, **quando** abro seu detalhe, **então** vejo solo, regime hídrico, histórico de cultivo, culturas possíveis e prioridade, com o aviso "Cenário simulado — não é recomendação agronômica" em destaque.
3. **Dado** que a API está indisponível, **quando** a página carrega, **então** vejo uma mensagem clara e um botão "Tentar novamente".
4. **Dado** um id inexistente, **quando** abro `/scenarios/<id>`, **então** vejo "Cenário não encontrado" e um link de volta.
5. Campo ausente aparece como "não informado", nunca como zero ou vazio.
6. Todo cenário exibido vem de dados marcados `simulado: true`.

## Fora de escopo
Login/cadastro, cálculo de R ou Q, busca de dados NASA, relatos comunitários, editar cenário, banco de dados.

## Dados (`data/fixtures/scenarios.json`) — valores provisórios
Lista de objetos com: id, nome, regiao_aproximada, solo, regime_hidrico ("sequeiro" | "irrigado"), historico [{cultura, periodo}], culturas_possiveis [], prioridade, simulado (true).

## Tarefas técnicas
- FastAPI: GET /api/scenarios e GET /api/scenarios/{id} (404 se não existir), lendo o JSON.
- Next.js: página inicial com cards; página /scenarios/[id]; estados de carregamento, erro e 404.
- CORS liberado para http://localhost:3000; URL da API em variável de ambiente (.env.example).
- Textos da interface num único arquivo (para trocar para inglês depois).
- Teste pytest: lista retorna ≥ 2 itens; id inexistente retorna 404.
- README: seção "Como rodar" com os comandos do backend e do frontend.

## Definição de pronto
Rodar os dois servidores localmente, abrir a home, escolher um cenário, ver o detalhe e simular a API fora do ar. Testes passando. Sem segredos no repositório.