# ADR-0012: Restrição estrutural e abstenção na UC-11

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-11, [ADR-0003](0003-metodo-de-analise-e-confiabilidade.md), [ADR-0011](0011-proposta-de-rotacao-de-duas-safras.md)

## Contexto

A UC-11 exige mostrar regra e motivo ao descartar uma proposta incompatível, sem calcular R. As entradas atuais ainda não têm vínculo persistente com a mesma área; cobertura climática não substitui regra local. Aplicar limiares de solo, chuva ou calendário sem uma tabela regional auditada criaria uma exclusão sem base.

## Decisão

- A primeira regra é **estrutural**: a mesma cultura nomeada nas duas safras não compõe uma rotação diversificada. Para esse caso, a proposta recebe `excluded`, com identificador da regra, motivo, escopo e fontes. Isso descarta a proposta **como rotação**, sem proibir o cultivo.
- A comparação normaliza caixa, espaços externos e espaços repetidos. Nomes diferentes ou sinônimos não são equiparados automaticamente; precisam de identificação taxonômica antes de uma conclusão por espécie.
- Duas culturas com nomes diferentes passam apenas nessa regra. O estado geral fica `inconclusive`, com `regional_rules` pendente; não se declara elegibilidade.
- A resposta da UC-11 não contém R ou score. Períodos sobrepostos e cultura repetida na UC-10 continuam aceitos como proposta; a verificação separada decide apenas o que pode sustentar.
- Regras de solo, regime hídrico e calendário regional entram no mesmo mecanismo após fonte, período, local, condições de entrada e versão serem auditados. Rascunhos soltos do navegador não serão usados como prova de que todos os dados pertencem à mesma área.

## Fontes do critério estrutural

- [Embrapa, Documentos 256 (2024)](https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1166202/1/Documentos256-AnaLuciaBorges-2024-AINFO-1.pdf): descreve rotação como cultivo sequenciado de espécies diferentes na mesma área.
- [USDA NRCS, Conservation Crop Rotation 328 (2026)](https://www.nrcs.usda.gov/publications/nhcp-notice-179/328-cps-conservation-crop-rotation-2026.pdf): exige ao menos dois tipos ou espécies diferentes. O padrão nacional não substitui orientação estadual de plantio.

## Consequências

- A PoC demonstra exclusão rastreável e abstenção onde a evidência não sustenta decisão local.
- UC-12 pode detalhar a lacuna `regional_rules` e UC-13 só poderá calcular R após completar os critérios aplicáveis.
