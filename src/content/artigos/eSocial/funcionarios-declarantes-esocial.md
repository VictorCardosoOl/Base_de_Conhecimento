---
id: "funcionarios-declarantes-esocial"
question: "Funcionários e Declarantes"
category: eSocial
date: "04 Sep 2026"
tags: ["Cadastro","Matrícula","Declarante"]
answer: "Regras de matrícula, identificação e cadastro de declarantes no eSocial."
---

Identificação no eSocial

Este guia explica as regras de identificação de funcionários e declarantes para integração com o eSocial.

Funcionários

No eSocial, os funcionários têm como **identificador obrigatório o CPF**, com as seguintes regras:

Regras Chave:

- Um CPF pode ter múltiplos vínculos com o mesmo declarante

- Cada vínculo é identificado por um número de matrícula único

- A matrícula é obrigatória para eventos de SST

Casos Especiais - TSVE (Trabalhador Sem Vínculo)

Quando a matrícula não foi informada no evento S-2300:

Procedimento Obrigatório:

- Acessar **Funcionários » Aba Dados Pessoais**

- Habilitar a opção **"TSVE sem Matrícula"**

- Selecionar o código da **Categoria do Trabalhador** (Tabela 01 do eSocial)

Regras de Matrícula:

- Deve corresponder à matrícula informada nos eventos S-2190, S-2200 ou S-2300

- Transferências entre departamentos **não alteram** a matrícula

- Readmissão gera **nova matrícula** (novo vínculo)

Gerenciamento de Matrículas no Sigo®

A matrícula é informada em:

Funcionários » Aba Registros de Admissões

Fluxo para Admissão/Readmissão:

- Criar registro de admissão

- Preencher número de matrícula

- Ativar vínculo do trabalhador

Declarantes

Pessoa Jurídica
Identificada apenas pelo **CNPJ**

No XML: &#123;nrInsc&#125; = CNPJ-Raiz (8 posições)

Pessoa Física
Identificada apenas pelo **CPF**

Utilizar **CAEPF** como estabelecimento

Administração Pública
Identificada pelo **CNPJ completo (14 posições)**

Exige parametrização especial

Regras Específicas para Declarantes

| Tipo
| Identificador
| Casos Aplicáveis

| Pessoa Física com Atividade Econômica
| CAEPF (antigo CEI)

- Contribuinte individual (408-1)

- Produtor rural (412-0)

- Segurado especial (402-2)

- Encarregado de consórcios rurais (228-3)

- Titular de cartório (303-4)

| Obras de Construção Civil
| CNO
| Vinculado a CNPJ ou CPF

Configuração para Administração Pública

Parametrização Obrigatória:
Para clientes com natureza jurídica de Administração Pública Federal:

- Acessar **Clientes - Empresas » Aba Geral**

- Habilitar **"Natureza Jurídica de Adm Pública"**

Esta configuração garante que o campo **&#123;nrInsc&#125;** no XML seja preenchido com o CNPJ completo (14 posições).