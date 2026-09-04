---
id: "erro-s2210-cat"
question: "Erro S-2210: Hora do Acidente Inválida"
category: "Troubleshooting"
date: "04 Sep 2026"
tags: ["Erro","S-2210","CAT"]
answer: "Como corrigir rejeições relacionadas à hora do acidente ou incompatibilidade com tipo de CAT."
---

Erro no S-2210 (CAT)

Falha de Schema: Hora do Acidente inválida ou inconsistente com Tipo de CAT

Diagnóstico do Erro

O eSocial recusa o evento S-2210 quando a hora do acidente está em formato incorreto ou entra em conflito com o tipo de CAT selecionado.

Erro 17: A estrutura do arquivo XML está em desacordo com o esquema XSD.

Elemento 'ideAcidente/hrAcidente': '00:00' is not a valid value of the atomic type 'THora'.

Causas Comuns:

- Hora registrada como "00:00" em acidentes típicos

- Campo vazio em situações obrigatórias

- Incompatibilidade com CAT de Doença Ocupacional ou Trajeto

Solução Passo a Passo

1. Acidente Típico
Em acidentes ocorridos na empresa ou a serviço dela.

**Ação:** Informar a hora exata da ocorrência (HH:MM). O campo é obrigatório e não pode ser zerado sem justificativa.

2. Doença Ocupacional
Quando o afastamento ocorre por doença relacionada ao trabalho.

**Ação:** Deixar o campo hora **em branco** ou preencher com "00:00" apenas se o sistema exigir, mas validar regra específica da versão S-1.1: Hora deve ser omitida para doenças.

No Sigo: Campo "Hora" fica desabilitado para tipo "Doença".

3. Acidente de Trajeto
Ocorrido no deslocamento residência-trabalho (ou vice-versa).

**Ação:** Informar hora aproximada do acidente. Se desconhecida, verificar possibilidade de uso de hora padrão acordada com jurídico (ex: hora de início/fim de jornada), mas priorizar dado real.

Validação no Sistema

Para corrigir e retransmitir:

- Acesse o cadastro da CAT no Sigo

- Verifique o campo **"Tipo de Acidente"**

- Ajuste o campo **"Hora do Acidente"** conforme regras acima

- Salve e aguarde nova validação da mensageria (aprox. 1 hora)

Status esperado: Sucesso (201)