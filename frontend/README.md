# Frontend da UC-03

Tela Next.js em `/solo` para registrar solo conhecido ou “não sei” e sua origem.

```powershell
npm install
npm run dev
```

Execute também a API FastAPI em `http://127.0.0.1:8000`. Se ela estiver em outra origem, defina `RAIZES_API_URL` no ambiente do Next.js. O frontend envia os dados à rota de validação da API e guarda a última resposta validada no armazenamento local do navegador para uso como rascunho. Essa persistência local não substitui o cadastro de área e a autenticação previstos para a integração com as demais cards.
