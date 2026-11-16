# Uso de inteligência artificial no desenvolvimento do Raízes

**Escopo deste registro:** atividades documentadas na colaboração com o assistente de IA durante a concepção e o desenvolvimento do protótipo. O registro não atribui aos demais integrantes usos de IA que não tenham sido confirmados. Atualizar este documento quando a equipe consolidar suas contribuições.

## Resumo

A equipe usou um assistente de IA como apoio para discutir o problema, organizar requisitos, examinar decisões de arquitetura, pesquisar fontes, implementar partes do protótipo, revisar código e preparar a comunicação do projeto. As respostas do assistente foram tratadas como propostas de trabalho. A escolha do escopo, das prioridades e dos critérios de confiabilidade ficou com a equipe. Os dados científicos e as regras agronômicas precisam de fontes verificáveis; texto gerado por IA não é evidência agronômica.

## Como a IA foi utilizada

| Etapa | Uso documentado | Resultado verificável |
| --- | --- | --- |
| Definição do produto | Debate sobre público, alcance global, recorte inicial da demonstração, riscos da cobertura desigual e papel do hub comunitário. | Requisitos e user cards organizados no Notion; decisões de produto registradas nos ADRs do repositório. |
| Arquitetura e método | Discussão de camadas lógicas, contrato do motor, separação entre adequação estimada (R) e suporte comunitário (Q), abstenção e critérios de expansão regional. | [ADR-0001](adr/0001-arquitetura-do-raizes.md), [ADR-0002](adr/0002-unidade-e-casos-da-poc.md) e [ADR-0003](adr/0003-metodo-de-analise-e-confiabilidade.md). |
| Pesquisa e preparação de dados | Ajuda para localizar, ler e estruturar dados da NASA POWER e resultados publicados da Embrapa para o caso de Sinop. | Fixtures com origem, período, unidade e limites de uso; a publicação é citada na fixture e no ADR correspondente quando a branch de Sinop for integrada. |
| Programação | Apoio na implementação de rotas e validações em FastAPI, telas e integração em Next.js, além de testes e revisão de mudanças. | Código versionado, histórico de commits, PRs e testes automatizados. Cada entrega deve ser conferida no diff antes de ser aceita. |
| Comunicação | Iterações no texto do pitch em inglês para explicar proposta, NASA, R, Q, hub e incertezas. | Roteiro revisado pela equipe para uso na apresentação. |

## Limites e controles

- **Decisão agronômica:** o assistente não escolhe a rotação. O método planejado combina entradas da área, fontes locais auditadas, regras explícitas e comparação rastreável. A PoC ainda não dispõe de validação para afirmar que uma rotação funcionará em uma propriedade específica.
- **Fontes:** afirmações sobre clima, solo, culturas e resultados experimentais devem apontar para o dado ou publicação original. A IA pode ajudar a extrair e organizar informações, mas valores, unidades, anos e condições de aplicação precisam ser conferidos na fonte.
- **Código:** sugestões geradas podem conter erros. Testes, revisão do diff e execução do fluxo são necessários antes da integração. Um teste aprovado demonstra o comportamento codificado, não a validade agronômica da regra.
- **R e Q:** são conceitos e indicadores distintos. Não há justificativa para apresentar um valor quando os dados ou critérios mínimos não foram satisfeitos. Relatos fictícios ou resultados publicados de experimentos não contam como relatos reais do hub.
- **Transparência:** resultados incompletos devem mostrar lacunas e incertezas. Dados de demonstração ou simulação devem ser identificados como tais.

## O que a IA não comprova

O uso do assistente não substitui avaliação por agrônomo, validação em campo, revisão independente das fontes ou testes com propriedades fora dos casos de demonstração. A documentação e o código devem distinguir claramente observações históricas, regras extraídas de fontes, hipóteses da equipe e funcionalidades ainda planejadas.

## Responsabilidade da equipe

A equipe define o problema e aprova as decisões, confere as fontes utilizadas, revisa as alterações de código e responde pela apresentação pública do protótipo. Para uma declaração completa do uso de IA pelo grupo, cada integrante deve acrescentar ferramentas e atividades que realizou fora desta colaboração, se houver.

## Referências internas

- [Arquitetura conceitual](adr/0001-arquitetura-do-raizes.md)
- [Método de análise e confiabilidade](adr/0003-metodo-de-analise-e-confiabilidade.md)
- [README do projeto](../README.md)
