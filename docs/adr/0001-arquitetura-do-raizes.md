# ADR-0001: Arquitetura conceitual do Raízes

- **Status:** aceito em nível conceitual
- **Data:** 2026-11-14
- **Escopo:** protótipo para demonstração no NASA Space Apps Challenge

## Contexto

O Raízes permite que um agricultor informe localização aproximada, condições da área, histórico de cultivo, culturas possíveis e prioridades. O sistema complementa essas informações com observações da Terra da NASA e fontes agrícolas locais, analisa rotações e, quando houver relatos reais comparáveis, apresenta experiências comunitárias. A cobertura e a qualidade dos dados variam entre regiões.

O protótipo deve demonstrar o método sem afirmar que uma nota representa probabilidade de sucesso ou segurança de plantio. Não há revisão agronômica da equipe prevista nesta fase. Dados e relatos fictícios usados na demonstração precisam ser identificados como simulação.

## Decisão

Adotar uma arquitetura em camadas **lógicas** dentro de uma aplicação inicial, com responsabilidades separadas:

1. **Interface:** coleta informações e mostra alternativas, justificativas, fontes e lacunas.
2. **Aplicação:** coordena os casos de uso, permissões e histórico das análises.
3. **Domínio:** valida entradas, aplica restrições, compara estratégias e decide quando se abster.
4. **Infraestrutura:** integra fontes NASA e fontes locais, armazena dados, regras, relatos e versões das análises.

Essas camadas não implicam quatro servidores. A separação física será considerada apenas se surgir uma necessidade concreta de operação ou desenvolvimento.

O motor segue esta ordem: verificar procedência e dados mínimos → aplicar restrições → avaliar opções elegíveis → relacionar relatos comparáveis → explicar o resultado ou a impossibilidade de concluir.

### Alcance e cobertura

- O fluxo de análise pode receber uma rotação proposta pelo agricultor em qualquer região, mas só conclui o que os dados e regras locais sustentarem.
- A geração automática de alternativas fica limitada a regiões cuja cobertura tenha sido verificada.
- Conectores e regras regionais são adicionados gradualmente; ausência de regra significa **sem cobertura**, não cultura proibida.
- A demonstração usa dados externos previamente armazenados para continuar funcionando se uma fonte estiver indisponível.

### Indicadores e relatos

- **R** representa adequação estimada da estratégia nos critérios efetivamente avaliados.
- **Q** representa suporte de relatos reais, independentes e comparáveis.
- R, Q e cobertura dos dados aparecem separadamente. Nenhum indicador é uma probabilidade de sucesso.
- Sem relatos reais suficientes, Q é indisponível, não zero. Relatos sintéticos não aumentam Q.
- Uma incompatibilidade conhecida exclui a opção antes do cálculo de R. A falta de um dado essencial deixa a avaliação afetada inconclusiva.
- Cada análise conserva entradas, fontes, períodos, resoluções e versões dos dados, das regras e do cálculo utilizados.

## Alternativas consideradas

| Alternativa | Motivo para não adotá-la agora |
|---|---|
| Um único score para estratégia e evidência comunitária | Confundiria adequação estimada com força dos relatos. |
| Gerar rotações para qualquer região desde a primeira versão | Exigiria regras agrícolas e validação que ainda não estão disponíveis. |
| Separar interface, API científica e ingestão em serviços independentes desde o início | Acrescentaria operação e integração antes de existir necessidade demonstrada. |
| Sempre devolver um ranking | Transformaria dados ausentes em falsa precisão. |

## Consequências

- O produto pode mostrar resultados parciais ou inconclusivos; a interface deve explicar esses estados com clareza.
- Fontes, regras e relatos precisam carregar metadados de origem e versão.
- Dados comunitários exigem consentimento, privacidade e um ciclo de revisão ainda a detalhar.
- A arquitetura comporta expansão regional, mas cada nova cobertura exige verificação de dados e regras.

## Ainda não decidido

- Stack e estratégia de deploy.
- Unidade de análise: propriedade ou talhão/área de cultivo.
- Estados de relatos planejados e observados, e papel de revisão dos agrônomos.
- Regiões, culturas, fontes locais e regras concretas dos estudos de caso.
- Fórmulas, pesos, limiares e critérios mínimos para calcular R e Q.

Esses pontos serão definidos na elicitação de requisitos, na auditoria de cobertura dos estudos de caso e em ADRs posteriores, conforme forem decididos.
