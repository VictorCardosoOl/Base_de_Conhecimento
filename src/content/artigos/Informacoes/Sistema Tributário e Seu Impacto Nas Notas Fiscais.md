---
id: "sistema-tribut-rio-e-seu-impacto-nas-notas-fiscais"
question: "Sistema Tributário e Seu Impacto Nas Notas Fiscais"
category: "Informações"
date: "04 Sep 2026"
tags: ["Importado"]
answer: "Artigo importado automaticamente."
---

**Sistema Tributário e Seu Impacto Nas Notas Fiscais**

O **Sistema Tributário Nacional** é o conjunto de regras que organiza como os impostos e outros tributos são criados, cobrados, arrecadados e divididos entre os governos (federal, estadual e municipal). Quando falamos desse sistema de forma ampla, estamos incluindo todos os tipos de normas que falam sobre tributos, como: a Constituição, leis, decretos, portarias e instruções normativas, ou seja, tudo que no nosso conjunto de leis trata da cobrança de tributos.

**Afinal, do que é constituído o Sistema Tributário e o que significa a palavra “tributo”?**

Apesar de impostos e tributos serem frequentemente associados como sinônimos, não são exatamente a mesma coisa. Os tributos compõem um gênero que é dividido em espécies: impostos, taxas, contribuições de melhorias, empréstimo compulsório e contribuições:

Tributos dos quais mais ouvimos falar, os impostos são o carro-chefe da tributação. São responsáveis por financiar as atividades do Estado e se dividem em impostos federais, estaduais e municipais:

*   **Impostos Federais:** Imposto de Renda da Pessoa Física e Jurídica (IRPF e IRPJ), Imposto sobre Operações Financeiras (IOF), Imposto sobre Produtos Industrializados (IPI), Imposto sobre Importações (II);
*   **Impostos Estaduais:** Imposto de Circulação de Mercadorias e Serviços (ICMS), Imposto sobre a Propriedade de Veículos Automotores (IPVA), Imposto de Transmissão Causa Mortis e Doação (ITCMD);
*   **Impostos Municipais:** Imposto Sobre Serviços (ISS), Imposto Predial Territorial Urbano (IPTU), Impostos de Transmissão de Bens Imóveis (ITBI).

**Taxas**

As **taxas** são cobradas quando o governo oferece algum serviço específico ou faz alguma fiscalização. Diferente dos **impostos**, as taxas só são pagas por quem usa o serviço. Por exemplo:

*   Taxa para fiscalizar um comércio (cobrada pelo município);
*   Taxa para tirar ou renovar RG ou CNH (cobrada pelo estado);
*   Taxa para emitir passaporte (cobrada pela União).

**Contribuição de Melhoria**

É cobrada quando uma **obra pública** valoriza os imóveis de uma região.  
Exemplo: Se a prefeitura **asfalta uma rua**, os moradores podem pagar uma contribuição porque os imóveis ficaram mais valorizados, mas se for só **recapeamento** (reparo), não se cobra essa contribuição.

**Empréstimo Compulsório**

O governo pode, em casos especiais (como guerra ou desastre), **pegar dinheiro dos cidadãos como se fosse um empréstimo**.

*   Só o governo federal pode cobrar.
*   É temporário.
*   Só pode ser criado por **lei complementar**.  
    Um exemplo foi em 1986, no governo Sarney, para tentar controlar a economia.

**Contribuições**

São tributos criados para uma **finalidade específica**, como saúde, previdência ou transporte.  
Exemplos:

*   **COFINS** e **CSLL**: cobradas de empresas, para ajudar a pagar a seguridade social.
*   **CPMF** (antiga): cobrada sobre transações bancárias, para a saúde.
*   **CIDE**: cobrada sobre combustíveis, usada para o meio ambiente e transporte.

**Tributos Diretos e Indiretos**

*   **Diretos**: pagos diretamente ao governo. Exemplo: IPVA, IPTU, IR, taxas, COFINS, CSLL.
*   **Indiretos**: estão **embutidos no preço** de produtos ou serviços. Exemplo: ICMS, IPI, ISS, CIDE.

Todas as categorias mencionadas anteriormente compõem o Sistema Tributário.

**Deduções e Retenções**

**Retenção**

**A retenção de impostos acontece quando uma parte do valor que deve ser paga numa compra ou serviço já é descontada na hora do pagamento. Quem paga o serviço ou produto já retém esse valor e entrega direto para o governo (federal, estadual ou municipal). Ou seja, o pagador já separa e recolhe o imposto que deve ser pago.**

**Dedução**

A Dedução acontece quando você pode diminuir o valor do imposto que precisa pagar. Isso ocorre porque a lei permite que você informe algumas despesas que são permitidas, como gastos com saúde, educação, entre outros. Essas despesas ajudam a reduzir a base de cálculo do imposto, ou seja, o valor sobre o qual o imposto é calculado. Assim, quanto mais despesas dedutíveis você tiver, menor será o imposto a pagar.

**O Impacto da Retenção e Dedução na Emissão de Notas Fiscais**

**É fundamental que as retenções e deduções sejam devidamente parametrizadas, pois impactam diretamente no valor que será cobrado nas notas fiscais.**

Por exemplo, no caminho **Cadastros >> Tabelas >> Fiscais >> Tabela de Códigos de Serviços >> Exceção Fiscal**, é necessário informar se determinada unidade não sofrerá retenção de impostos para nenhuma empresa. Nesse caso, deve-se selecionar o tipo de imposto para o qual não haverá retenção.

Além disso, também é imprescindível realizar a parametrização correta no caminho **Configurações >> Configurações Gerais >> Financeiro >> Retenção dos Impostos em Parcelamentos**. Nessa etapa, deve-se definir a forma de retenção dos impostos em títulos parcelados, conforme as seguintes opções:

*   **Parcelado**: os impostos serão divididos proporcionalmente entre as parcelas.
*   **Na 1ª Parcela**: o valor total da retenção será aplicado integralmente na primeira parcela.
*   **Na Última Parcela**: o valor total da retenção será aplicado integralmente na última parcela.

Para parametrizar a dedução de impostos de uma empresa específica, acesse o caminho:  
Cadastros >> Empresas >> Financeiro >> Deduções de Impostos. Nesse local, é necessário informar os dados relacionados à dedução dos seguintes tributos:

*   **ISS** (Imposto Sobre Serviços)
*   **IR** (Imposto de Renda)
*   **PIS** (Programa de Integração Social)
*   **Cofins** (Contribuição para o Financiamento da Seguridade Social)
*   **CSLL** (Contribuição Social sobre o Lucro Líquido)
*   **INSS** (Instituto Nacional do Seguro Social)

A correta parametrização garante que o sistema considere as deduções de forma adequada durante os processos financeiros e fiscais da empresa. Essas configurações garantem o correto cálculo tributário e evitam inconsistências na emissão das notas fiscais.