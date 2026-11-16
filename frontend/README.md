# Frontend da UC-03

Tela Next.js em `/solo` para registrar solo conhecido ou “não sei” e sua origem.

```powershell
npm install
npm run dev
```

Execute também a API FastAPI em `http://127.0.0.1:8000`. Se ela estiver em outra origem, defina `RAIZES_API_URL` no ambiente do Next.js. O frontend envia os dados à rota de validação da API e guarda a última resposta validada no armazenamento local do navegador para uso como rascunho. Essa persistência local não substitui o cadastro de área e a autenticação previstos para a integração com as demais cards.

# UC-04

A página `/regime-hidrico` permite informar se a área é de sequeiro ou irrigada.
Ela valida o perfil composto por solo e regime hídrico pela API FastAPI. O solo
vem do rascunho da UC-03, quando existe; caso contrário, segue como desconhecido.
O perfil validado fica temporariamente no armazenamento local deste navegador.

# UC-05

A página `/historico` registra culturas e meses de início e fim em ordem cronológica. A resposta validada pela API fica como rascunho neste navegador até a integração com a UC-02.

# UC-06

A página `/culturas-possiveis` registra as culturas candidatas do agricultor ou a lacuna `ainda não sei`. A API valida os nomes sem afirmar elegibilidade, e a resposta fica como rascunho local até a integração com a UC-02.

# UC-02

A página `/localizacao` recebe município e UF e mostra coordenadas aproximadas e o contexto climático da NASA POWER. O ponto encontrado fica salvo neste navegador como ponto inicial da tela de cobertura.

# UC-08

A página `/cobertura` consulta a cobertura climática de um ponto e lê deste navegador quais dados da área já foram informados. Disponibilidade de dado não significa que uma rotação possa ser recomendada.

# Fluxo principal

Telas de celular que seguem a identidade visual da equipe (azul NASA, Space Grotesk nos títulos e Inter no restante). Os estilos ficam em `app/raizes.css`, os componentes em `app/_ui/` e os ícones em `public/raizes/`.

| Rota | Tela | De onde vêm os dados |
|---|---|---|
| `/` | Início | Texto fixo |
| `/area` | Passo 1: CEP (opcional), município, água e solo | CEP (ViaCEP), localização (UC-02) e perfil (UC-03 e UC-04) |
| `/dados` | Passo 2: o que já sabemos | Clima da NASA POWER (UC-02), cobertura do ZARC e o que foi informado no passo 1 |
| `/plantar` | Passo 3: de 2 a 4 safras, com cultura e época de plantio | Épocas indicadas pelo ZARC no município |
| `/resultado` | Estado de cada safra, risco climático e fonte | ZARC (`/api/v1/zarc/evaluate`) |
| `/resultado/detalhe` | Resumo do último resultado | Resultado guardado na sessão |
| `/pendencias` | O que já temos e o que falta para fechar o resultado | ZARC e os rascunhos do navegador |
| `/exemplo` e subrotas | Exemplo com os três estados | Dados fictícios, fixos no código |

Limites desta versão:

- As regras de época vêm da Tábua de Risco do ZARC 2025/2026 (MAPA), guardada em `data/fixtures/zarc/` ([ADR-0017](../docs/adr/0017-zarc-como-regra-de-epoca.md)). O risco climático é por safra e nunca vira nota da rotação; o índice R não é exibido no fluxo real.
- "Elegível" com R e o valor 0,72 só aparecem em `/exemplo`, sempre com o selo "Exemplo fictício".
- O app ainda não pergunta o grupo de ciclo da semente nem a classe de água do solo (AD1 a AD6); quando o resultado depende disso, a safra fica inconclusiva e a tela diz o motivo.
- A data sugerida para cada safra é o primeiro decêndio de menor risco depois da safra anterior, contando cerca de 100 dias. É só ponto de partida: o ZARC não confere se uma safra cabe depois da outra.
- O clima mostrado em `/dados` é a média histórica regional da NASA POWER, não medição da parcela. A chuva anual é a média diária do ano vezes 365, arredondada para a dezena.

Para depois:

- Sugestão de textura pelo mapa de solos SoilGrids (ISRIC), como estimativa para o agricultor confirmar. O serviço não respondeu de forma estável nos testes.
- Foto do solo com um modelo de visão estimando a textura, sempre apresentado como estimativa e com indicação de análise de laboratório.
- Perguntar o grupo de ciclo da semente e a classe de água do solo, para fechar os resultados que hoje ficam inconclusivos.

# Etapas em detalhe

A rota `/etapas` lista os formulários completos de cada etapa (`/localizacao`, `/solo`, `/regime-hidrico`, `/historico`, `/culturas-possiveis`, `/cobertura`, `/rotacao`, `/restricoes`, `/alternativas` e `/comparar`). O fluxo principal grava os rascunhos com as mesmas chaves, então as duas entradas enxergam os mesmos dados.
