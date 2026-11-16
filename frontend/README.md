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
| `/area` | Passo 1: município, água e solo | Localização (UC-02) e perfil (UC-03 e UC-04) |
| `/dados` | Passo 2: o que já sabemos | Clima da NASA POWER vindo da localização (UC-02) e o que foi informado no passo 1 |
| `/plantar` | Passo 3: 1ª e 2ª safra | Proposta de rotação (UC-10) |
| `/resultado` | Rotações avaliadas | Comparação (UC-16) |
| `/resultado/detalhe` | Estado e motivo de uma rotação | Restrições (UC-11) |
| `/pendencias` | O que já temos, o que falta e a regra usada, com as fontes | Restrições (UC-11) e os rascunhos do navegador |
| `/exemplo` e subrotas | Exemplo com os três estados | Dados fictícios, fixos no código |

Limites desta versão:

- No fluxo real nenhuma rotação sai "elegível" e nenhum índice R é exibido, porque ainda não há regras regionais conferidas. O estado "elegível" e o valor de R só aparecem em `/exemplo`, sempre com o selo "Exemplo fictício".
- A tela de rotação pergunta só as culturas. Como a UC-10 exige um período por safra, a proposta leva meses nominais em sequência a partir do mês atual; eles só ordenam as duas etapas e não são calendário de plantio.
- O clima mostrado em `/dados` é a média histórica regional da NASA POWER, não medição da parcela. A chuva anual é a média diária do ano vezes 365, arredondada para a dezena.
- Os textos do fluxo são escritos na interface, em linguagem simples, a partir do estado devolvido pela API (`inconclusive` ou `excluded`); o motivo técnico completo continua em `/restricoes`.

# Etapas em detalhe

A rota `/etapas` lista os formulários completos de cada etapa (`/localizacao`, `/solo`, `/regime-hidrico`, `/historico`, `/culturas-possiveis`, `/cobertura`, `/rotacao`, `/restricoes`, `/alternativas` e `/comparar`). O fluxo principal grava os rascunhos com as mesmas chaves, então as duas entradas enxergam os mesmos dados.
