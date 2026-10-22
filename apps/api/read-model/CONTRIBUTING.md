<img width=100% src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=120&section=header"/>

<h1 align="center">🤝 Contributing / Contribuindo</h1>

> **Documento do projeto de origem do AuthService**, mantido como referência histórica; pode não
> refletir esta versão. Documentação atual: [README do AuthService](../README.md),
> [como contribuir](../../CONTRIBUTING.md) e [índice da documentação](../../docs/README.md).

<p align="center">
  <a href="#pt-br">Português</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#en-us-">English</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="./README.md">Voltar</a>
</p>

---

## PT-BR

Obrigado por querer contribuir com o **AuthService**! Siga as etapas abaixo para enviar sua contribuição de forma organizada.

### 1. Crie um fork

No repositório do projeto, clique no botão **"Fork"** no canto superior direito. Isso criará uma cópia do repositório na sua conta do GitHub.

### 2. Clone seu fork localmente

```bash
git clone https://github.com/seu-usuario/auth-service.git
cd auth-service
```

### 3. Crie sua branch de funcionalidade

```bash
git checkout -b minha-nova-feature
```

### 4. Configure o ambiente

```bash
cp .env.example .env                       # ajuste DATABASE_URL
python -m backend.scripts.generate_keys    # chave Ed25519 local (keys/ não é versionado)
alembic upgrade head
```

### 5. Faça suas alterações e adicione os arquivos

```bash
git add .
```

### 6. Faça um commit com uma mensagem descritiva

Siga o padrão **Conventional Commits**:

```bash
git commit -m "feat: adiciona nova funcionalidade X"
git commit -m "fix: corrige bug na rota /me"
git commit -m "docs: atualiza README com novos exemplos"
git commit -m "refactor: reorganiza camada de repositório"
```

### 7. Envie sua branch

```bash
git push origin minha-nova-feature
```

### 8. Abra um Pull Request

Acesse o GitHub, navegue até seu fork e clique em **"Pull Request"**. Adicione um título claro e uma descrição detalhando o que foi alterado e por quê.

Após o merge do seu PR, você pode apagar sua branch com segurança.

> [!NOTE]
> Não se esqueça de favoritar o projeto! ⭐

---

### Boas práticas

- Mantenha o código Python no padrão PEP 8
- Não commite o arquivo `.env` com valores reais
- Atualize o `README.md` se sua alteração impactar o uso do projeto
- Adicione comentários em trechos de lógica complexa
- Teste localmente antes de abrir o PR

---

## EN-US 🇺🇸

Thank you for wanting to contribute to **AuthService**! Follow the steps below to submit your contribution.

### Steps

1. **Fork it!**
   - Click the **"Fork"** button on the top right of the repository page.

2. **Clone your fork:**

   ```bash
   git clone https://github.com/your-username/auth-service.git
   cd auth-service
   ```

3. **Create your feature branch:**

   ```bash
   git checkout -b my-new-feature
   ```

4. **Set up your environment:**

   ```bash
   cp .env.example .env                       # set DATABASE_URL
   python -m backend.scripts.generate_keys    # local Ed25519 key (keys/ is not versioned)
   alembic upgrade head
   ```

5. **Add changed files:**

   ```bash
   git add .
   ```

6. **Commit your changes** using Conventional Commits:

   ```bash
   git commit -m "feat: add some feature"
   git commit -m "fix: fix bug in /me route"
   ```

7. **Push to your branch:**

   ```bash
   git push origin my-new-feature
   ```

8. **Submit a Pull Request** — add a clear title and description explaining your changes.

After your pull request is merged, you can safely delete your branch.

> [!NOTE]
> Don't forget to star the project! ⭐

---

### Best practices

- Follow PEP 8 for Python code style
- Never commit `.env`, keys or any real secret
- Run `ruff check`, `ruff format --check`, `mypy` and `pytest` (with `TEST_DATABASE_URL`) before opening a PR
- Schema changes need an Alembic migration; API changes need `python -m backend.scripts.export_openapi`
- Update `README.md` if your change affects how the project is used
- Test locally with Docker before opening a PR

<img width=100% src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=120&section=footer"/>
