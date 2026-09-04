
---
title: Configuração de VPN Corporativa
category: Tecnologia
date: 22 Out 2024
tags: [Segurança, Remoto, VPN]
imageUrl: https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=90
answer: Guia passo a passo para estabelecer uma conexão segura com os servidores internos da empresa.
---

## Introdução à Segurança

A segurança dos nossos dados é prioridade. O uso da VPN é obrigatório para qualquer acesso a sistemas internos (servidores de arquivos, bancos de dados de teste e intranet) quando fora do escritório.

### Passo a Passo

1. **Download do Cliente:** Acesse o portal de software da TI e baixe o *FortiClient*.
2. **Configuração do Host:** Utilize o endereço `vpn.empresa.com.br`.
3. **Autenticação:** Use suas credenciais do Azure AD (E-mail corporativo).
4. **MFA:** Confirme a solicitação no seu aplicativo *Microsoft Authenticator*.

> **Dica:** Se a conexão cair, verifique se o seu firewall local não está bloqueando a porta 443.

### Suporte
Caso encontre erros de certificado, abra um chamado imediatamente com a tag **#BLOQUEIO-VPN**.
