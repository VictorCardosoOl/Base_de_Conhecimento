---
id: "resolucao-erros-s2240"
question: "Erro S-2240: Agentes Nocivos Não Preenchidos"
category: "Troubleshooting"
date: "04 Sep 2026"
tags: ["Erro","S-2240","Riscos"]
answer: "Solução para rejeições por falta de risco informado ou inconsistência de datas."
---

Erro no S-2240 (Ambiente)

Ocorrência de erro "Grupo 'Agentes Nocivos' não preenchido" ou incompatibilidade de datas

Diagnóstico do Erro

O evento S-2240 é rejeitado quando o sistema detecta ausência de informações obrigatórias sobre riscos ou conflito temporal.

Erro: O grupo 'Agentes Nocivos' deve ser preenchido.

Causa: Tentativa de envio sem informar risco ou sem código de ausência de risco.

Outros erros comuns:

- Data de início da condição anterior à data de admissão

- Responsável Técnico pelo registro ambiental não informado

- Código da atividade (Tabela 24) inválido

Solução Passo a Passo

Cenário 1: Funcionário SEM Riscos
Mesmo sem riscos, o envio é obrigatório.

**Correção:** Selecionar o código **09.01.001 (Ausência de Fator de Risco)**.

Não deixe a lista de riscos vazia, insira explicitamente este código.

Cenário 2: Data Inválida
Data de início da condição ambiental (iniCondicao) anterior à admissão.

**Correção:** A data de início das condições deve ser **igual ou posterior** à data de admissão do trabalhador.

Exceção: Transferência de empresa (sucessão), onde se mantém histórico.

Cenário 3: Responsável Técnico Ausente

**Correção:** Cadastrar e vincular o Responsável Técnico (Engenheiro ou Médico) com CPF e registro de classe (CREA/CRM) válidos na aba de SST/LTCAT.

Dica de Prevenção

No Sigo, utilize o relatório de **"Pré-validação de Eventos SST"** antes de autorizar o envio em massa.

- Identifica funcionários sem riscos vinculados

- Verifica consistência de datas

- Alerta sobre falta de Responsável Técnico