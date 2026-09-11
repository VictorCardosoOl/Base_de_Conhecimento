---
id: 'funcion-rios-e-declarantes-no-esocial---regras-de-identifica--o'
question: 'Funcionários e Declarantes no eSocial - Regras de Identificação'
category: 'eSocial'
date: '04 Sep 2026'
tags: ['Importado']
answer: 'Artigo importado automaticamente.'
---

Funcionário
===========

No eSocial os **funcionários têm como identificador obrigatório o CPF. Um CPF pode ter mais de um vínculo com um mesmo declarante,** sendo cada vínculo identificado pelo número da matrícula.

**A informação da matrícula é obrigatória para o envio dos eventos de SST.** Exceto para o caso de trabalhador Sem Vínculo de Emprego/Estatutário - TSVE, que não foi informado pelo declarante a matrícula do trabalhador no evento S-2300.

Apenas para essa situação, onde foi identificado que a matrícula do trabalhador não foi informada no evento S-2300, portanto, ela não existe no eSocial, torna-se obrigatório preencher no Sigo®, conforme orientação abaixo, o código da categoria do trabalhador, devendo ser um código válido e existente na Tabela 01 - Categorias de Trabalhadores, do eSocial.

**Em Funcionários » Aba Dados Pessoais (Habilitar a opção “TSVE sem Matrícula” e selecionar o código da Categoria do Trabalhador).**

O número de matrícula do trabalhador informada nos eventos de SST deve corresponder à matrícula informada anteriormente pelo declarante no evento S-2190, S-2200 ou S-2300, do respectivo contrato, evitando inconsistência na transmissão dos eventos.

Um vínculo trabalhista/estatutário se inicia com a admissão/ingresso e se encerra com o desligamento do trabalhador. **Transferências do empregado entre departamentos ou estabelecimentos não encerram um vínculo trabalhista e, portanto, não alteram a matrícula do trabalhador.**

Se o trabalhador tiver mais de um vínculo com o mesmo declarante, observadas as normas constitucionais de acumulação de cargos, empregos e funções públicas, para cada vínculo deve ser atribuída uma matrícula.

Havendo readmissão de empregado é considerado um novo vínculo e recebe uma nova matrícula.

No Sigo®, a matrícula do trabalhador é informada em Funcionários » Aba Registros de Admissões, que corresponde a criação do vínculo do trabalhador na empresa. Portanto, para situações de admissão/ingresso ou readmissão do trabalhador, faz-se necessário primeiramente a criação do registro de admissão do trabalhador no Sigo®, inclusive com o preenchimento do seu número de matrícula.

**Declarantes**

Os declarantes pessoa jurídica são identificados apenas pelo CNPJ e os declarantes pessoa física, apenas pelo CPF.

No Arquivo XML, o identificador chave **{nrInsc}** para as pessoas jurídicas é o CNPJ-Raiz/Base de oito posições, exceto se a natureza jurídica for de administração pública federal, situação em que o campo no XML deve ser preenchido com o **CNPJ completo com 14 posições.**

As pessoas físicas que exercem atividade econômica, ainda que possuam CNPJ, e que contratem segurados, devem utilizar o **CAEPF** (antiga matrícula CEI), como estabelecimento vinculado ao seu CPF.

Nessa situação estão o contribuinte individual (Natureza jurídica 408-1), o produtor rural pessoa física (Natureza jurídica 412-0), o segurado especial (Natureza jurídica 402-2), o produtor rural pessoa física encarregado de contratar e gerir empregados de consórcios simplificados de empregadores rurais (Natureza jurídica 228-3) e o titular de cartório (Natureza jurídica 303-4).

Para as obras de construção civil, o declarante deve utilizar o CNO como estabelecimento ou lotação tributária, vinculados a um CNPJ ou a um CPF.

**Atenção!**

Caso a natureza jurídica do cliente do Prestador de SST for de Administração Pública Federal, deve ser realizado a seguinte parametrização no Sigo®, antes da geração de qualquer evento de SST:

Em Clientes - Empresas » Aba Geral

Natureza Jurídica de Adm Pública (Habilitar essa opção para que o Sigo® preencha a chave {nrInsc} do Arquivo XML com o CNPJ completo com 14 posições, conforme regras do Leiaute do eSocial.
