# ADR-0006: Rascunho local de solo na UC-03

- **Status:** temporário para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-03 e [ADR-0004](0004-stack-da-poc.md)

## Contexto

A UC-03 precisa oferecer uma tela utilizável antes de a UC-02 entregar o cadastro persistente da área e antes da definição de autenticação. A API FastAPI da UC-03 valida o solo, mas não possui identificador de área nem armazenamento.

## Decisão

- Criar uma página Next.js independente em `/solo`.
- Enviar o formulário a uma rota do próprio Next.js, que repassa a validação ao FastAPI.
- Guardar a última resposta validada no armazenamento local do navegador como **rascunho**, incluindo a origem do dado de solo.
- Mostrar o registro atual e avisar quando o solo for desconhecido.

## Consequências

- O fluxo funciona ponta a ponta no navegador e pode ser testado enquanto o cadastro de área está em desenvolvimento.
- O rascunho não é compartilhado entre dispositivos, usuários ou navegadores e não equivale a um registro persistido no servidor.
- Ao integrar a UC-02, migrar o valor validado para a área correta por uma API autenticada; só então a UC-03 terá persistência de produto.
- O proxy do Next.js evita que o navegador acesse diretamente a origem do FastAPI durante a PoC.
