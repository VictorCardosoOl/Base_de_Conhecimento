# 📲 Manual do usuário: aplicativo SST FAQ (PWA)

O **SST FAQ** foi atualizado com a tecnologia **PWA (Progressive Web App)**. Isso significa que, nos navegadores compatíveis, você pode instalar o site como se fosse um aplicativo no seu computador ou celular (atalho próprio e janela sem barras do navegador).

> **Importante:** o projeto ainda não tem _service worker_. O aplicativo instalado **precisa de internet** — não há modo offline nem cache de artigos no dispositivo.

---

## 📲 Como Instalar

### No Computador (Google Chrome, Edge)

1.  Acesse o site do SST FAQ.
2.  Olhe para o lado direito da barra de endereço (onde fica a URL `http://...`).
3.  Você verá um ícone de **Computador com uma seta para baixo** ou um sinal de **+**.
4.  Clique nele e selecione **"Instalar SST FAQ"** (o nome vem do `public/manifest.json`).
5.  O site abrirá em uma janela independente, sem barras de navegador, parecendo um programa nativo.

### No Android (Chrome)

1.  Acesse o site pelo Chrome.
2.  Normalmente, uma barra inferior aparecerá perguntando se deseja **"Adicionar à Tela Inicial"**.
3.  Se não aparecer, toque nos **3 pontinhos** (menu) no canto superior direito.
4.  Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.

### No iOS (iPhone/iPad - Safari)

1.  Acesse o site pelo Safari.
2.  Toque no botão **Compartilhar** (quadrado com seta para cima).
3.  Role para baixo e selecione **"Adicionar à Tela de Início"**.
4.  Confirme o nome e toque em **Adicionar**.

---

## ⚡ Funcionalidades Exclusivas

### 1. Busca Instantânea 🔍

Utilize o atalho `Ctrl + K` (no computador) a qualquer momento para abrir a busca inteligente. Ela funciona instantaneamente, sem carregamentos.

### 2. Sempre na versão atual 🔄

O aplicativo instalado abre o próprio site, então cada abertura já mostra a versão publicada mais recente — não há download de atualizações em segundo plano.

---

## ❓ Dúvidas Comuns

**Ocupa muito espaço?**
Não. O aplicativo instalado é um atalho para o site: os arquivos ficam apenas no cache comum do navegador.

**Funciona sem internet?**
Ainda não. Sem conexão, o aplicativo não abre os artigos.

**Preciso atualizar na loja de aplicativos?**
Não. O aplicativo se atualiza sozinho, igual a um site. Você sempre terá a versão mais recente.
