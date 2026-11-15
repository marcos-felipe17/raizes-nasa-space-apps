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

# Página inicial

A rota `/` lista as etapas existentes, na ordem do fluxo.
