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
