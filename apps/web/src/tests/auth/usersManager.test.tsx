import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ManagedUser } from '@/features/auth/users';

const nav = vi.hoisted(() => ({ hardNavigate: vi.fn() }));
vi.mock('@/lib/navigation', () => nav);

const client = vi.hoisted(() => ({ refreshSession: vi.fn(async () => true) }));
vi.mock('@/features/auth/client', () => client);

const actions = vi.hoisted(() => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  resetPassword: vi.fn(),
}));
vi.mock('@/app/admin/usuarios/actions', () => actions);

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const identity = vi.hoisted(() => ({ checkUsernameAvailability: vi.fn() }));
vi.mock('@/features/auth/identity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/identity')>()),
  checkUsernameAvailability: identity.checkUsernameAvailability,
}));

import { UsersManager } from '@/app/admin/usuarios/UsersManager';

const TEMP = 'Abcd-Efgh-Jkmn-Pqrs';
const ME: ManagedUser = {
  id: 'me',
  email: 'admin@empresa.com.br',
  username: 'admin',
  displayName: 'Administrador',
  role: 'admin',
  isActive: true,
  mustChangePassword: false,
  createdAt: '2026-09-01T10:00:00Z',
  lastLoginAt: '2026-09-27T13:30:00Z',
};
const OTHER: ManagedUser = {
  ...ME,
  id: 'other',
  email: 'pessoa@empresa.com.br',
  username: 'pessoa',
  displayName: 'Pessoa Silva',
  role: 'editor',
  mustChangePassword: true,
  lastLoginAt: null,
};

function renderManager(users = [ME, OTHER], extra: Partial<Parameters<typeof UsersManager>[0]> = {}) {
  return render(
    <UsersManager
      users={users}
      currentUserId="me"
      page={1}
      totalPages={1}
      total={users.length}
      query=""
      {...extra}
    />
  );
}

/** Abre o modal, preenche a etapa 1 e avança. */
function createVia(email: string, role?: string, open = true) {
  if (open) fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  if (role) fireEvent.change(screen.getByLabelText('Papel'), { target: { value: role } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
}

function fillIdentity(username: string, displayName: string) {
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: displayName } });
}

/** O botão "Cadastrar" de dentro do modal (o da página fica atrás dele). */
function submitModal() {
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar' }));
}

describe('UsersManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.refreshSession.mockResolvedValue(true);
    identity.checkUsernameAvailability.mockResolvedValue('available');
    localStorage.clear();
    sessionStorage.clear();
  });

  it('lista usuários com papel, status e último acesso; a própria linha fica bloqueada', () => {
    renderManager();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    const mine = within(rows[1]);
    expect(mine.getByText('(você)')).toBeTruthy();
    expect((mine.getByLabelText(`Papel de ${ME.email}`) as HTMLSelectElement).disabled).toBe(true);
    expect(mine.queryByRole('button', { name: /Desativar|Redefinir/ })).toBeNull();
    expect(mine.getByText('27/09/2026, 10:30')).toBeTruthy(); // America/Sao_Paulo

    // Nome, usuário e email na mesma coluna.
    expect(mine.getByTestId('user-display-name').textContent).toBe('Administrador(você)');
    expect(mine.getByText('@admin')).toBeTruthy();
    expect(mine.getByText(ME.email)).toBeTruthy();

    const other = within(rows[2]);
    expect(other.getByText('Troca de senha pendente')).toBeTruthy();
    expect(other.getByText('Nunca')).toBeTruthy();
  });

  it('não há formulário fixo: busca e botão "Cadastrar" no lugar', () => {
    renderManager();
    expect(screen.getByRole('searchbox', { name: 'Buscar usuários' })).toBeTruthy();
    expect(screen.queryByLabelText('Email')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(screen.getByRole('dialog', { name: 'Cadastrar usuário' })).toBeTruthy();
  });

  it('cadastra pelo modal (2 etapas) e mostra a senha temporária oculta, uma única vez', async () => {
    actions.createUser.mockResolvedValue({ ok: true, temporaryPassword: TEMP });
    renderManager();
    createVia(' nova@empresa.com.br ', 'editor');
    expect(screen.getByRole('dialog', { name: 'Como a pessoa será chamada?' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'Nova.Pessoa' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: ' Nova Pessoa ' } });
    await waitFor(() => expect(screen.getByTestId('username-status').textContent).toBe('Disponível.'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar' }));

    const dialog = await screen.findByRole('dialog', { name: 'Usuário criado' });
    expect(actions.createUser).toHaveBeenCalledWith({
      email: 'nova@empresa.com.br',
      role: 'editor',
      username: 'nova.pessoa',
      displayName: 'Nova Pessoa',
    });
    expect(screen.queryByRole('dialog', { name: /Cadastrar|chamada/ })).toBeNull();
    // Oculta por padrão.
    expect(dialog.textContent).not.toContain(TEMP);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mostrar senha' }));
    expect(within(dialog).getByTestId('temporary-password').textContent).toBe(TEMP);

    // Fora do storage do navegador e fora da página depois de fechar.
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(TEMP);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Concluído' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.innerHTML).not.toContain(TEMP);
  });

  it('modal: usuário ocupado fica na etapa 2; email ocupado volta à 1; Esc fecha', async () => {
    actions.createUser.mockResolvedValueOnce({ ok: false, error: 'username_taken' });
    actions.createUser.mockResolvedValueOnce({ ok: false, error: 'email_taken' });
    renderManager();
    createVia('x@empresa.com.br');
    fillIdentity('alguem', 'Alguém');
    submitModal();
    await waitFor(() =>
      expect(screen.getByTestId('username-status').textContent).toContain('já está em uso')
    );

    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'outro' } });
    submitModal();
    expect((await screen.findByRole('alert')).textContent).toContain('Já existe um usuário com este email.');
    expect(screen.getByRole('dialog', { name: 'Cadastrar usuário' })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('modal: dados inválidos não chegam à ação', async () => {
    renderManager();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sem-arroba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('email válido');

    createVia('x@empresa.com.br', undefined, false);
    fillIdentity('a', '');
    submitModal();
    expect((await screen.findByRole('alert')).textContent).toContain('Corrija os campos');
    expect(actions.createUser).not.toHaveBeenCalled();
  });

  it('busca: digitar atualiza a URL (com pausa); resultado e lista vazia são anunciados', async () => {
    const { unmount } = renderManager();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '  maria ' } });
    expect(router.replace).not.toHaveBeenCalled();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/usuarios?q=maria'));
    unmount();

    renderManager([], { query: 'maria', total: 0 });
    expect(screen.getByRole('status').textContent).toBe('0 resultados para “maria”.');
    expect(screen.getByText('Nenhum usuário encontrado para “maria”.')).toBeTruthy();
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('maria');
  });

  it('busca: Enter aplica na hora e limpar volta para a lista completa', () => {
    renderManager([ME], { query: 'adm', total: 1 });
    const box = screen.getByRole('searchbox');
    fireEvent.change(box, { target: { value: '' } });
    fireEvent.submit(box.closest('form')!);
    expect(router.replace).toHaveBeenCalledWith('/admin/usuarios');
  });

  it('copiar usa a área de transferência só por ação do admin', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    actions.resetPassword.mockResolvedValue({ ok: true, temporaryPassword: TEMP });
    renderManager();

    fireEvent.click(screen.getByRole('button', { name: `Redefinir senha de ${OTHER.email}` }));
    expect(actions.resetPassword).not.toHaveBeenCalled(); // pede confirmação
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Senha redefinida' });
    expect(writeText).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Copiar senha' }));
    });
    expect(writeText).toHaveBeenCalledWith(TEMP);
    expect(within(dialog).getByText(/copiada/)).toBeTruthy();
  });

  it('desativar pede confirmação; cancelar não faz nada', async () => {
    actions.updateUser.mockResolvedValue({ ok: true });
    renderManager();
    fireEvent.click(screen.getByRole('button', { name: `Desativar ${OTHER.email}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(actions.updateUser).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: `Desativar ${OTHER.email}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(actions.updateUser).toHaveBeenCalledWith('other', { isActive: false }));
    expect(await screen.findByText(/desativado e desconectado/)).toBeTruthy();
  });

  it('reativar e trocar papel chamam a ação com os dados certos', async () => {
    actions.updateUser.mockResolvedValue({ ok: true });
    renderManager([ME, { ...OTHER, isActive: false }]);
    fireEvent.click(screen.getByRole('button', { name: `Reativar ${OTHER.email}` }));
    await waitFor(() => expect(actions.updateUser).toHaveBeenCalledWith('other', { isActive: true }));

    fireEvent.change(screen.getByLabelText(`Papel de ${OTHER.email}`), { target: { value: 'user' } });
    await waitFor(() => expect(actions.updateUser).toHaveBeenCalledWith('other', { role: 'user' }));
  });

  it.each([
    ['invalid_input', 'Verifique os dados'],
    ['forbidden', 'não tem permissão'],
    ['unavailable', 'indisponível'],
  ])('erro %s no cadastro vira mensagem própria no modal', async (error, message) => {
    actions.createUser.mockResolvedValue({ ok: false, error });
    renderManager();
    createVia('x@empresa.com.br');
    fillIdentity('alguem', 'Alguém');
    submitModal();
    expect((await screen.findByRole('alert')).textContent).toContain(message);
    expect(screen.queryByRole('dialog', { name: 'Usuário criado' })).toBeNull();
  });

  it('ação que falha por exceção: indisponível', async () => {
    actions.createUser.mockRejectedValue(new Error('rede'));
    renderManager();
    createVia('x@empresa.com.br');
    fillIdentity('alguem', 'Alguém');
    submitModal();
    expect((await screen.findByRole('alert')).textContent).toContain('indisponível');
  });

  it.each([
    ['last_admin', 'ao menos um administrador ativo'],
    ['forbidden', 'não tem permissão'],
  ])('erro %s ao alterar vira mensagem própria', async (error, message) => {
    actions.updateUser.mockResolvedValue({ ok: false, error });
    renderManager();
    fireEvent.change(screen.getByLabelText(`Papel de ${OTHER.email}`), { target: { value: 'user' } });
    expect((await screen.findByRole('alert')).textContent).toContain(message);
  });

  it('access expirado: renova a sessão e repete a ação uma vez', async () => {
    actions.createUser
      .mockResolvedValueOnce({ ok: false, error: 'session_expired' })
      .mockResolvedValueOnce({ ok: true, temporaryPassword: TEMP });
    renderManager();
    createVia('x@empresa.com.br');
    fillIdentity('alguem', 'Alguém');
    submitModal();
    await screen.findByRole('dialog', { name: 'Usuário criado' });
    expect(client.refreshSession).toHaveBeenCalledTimes(1);
    expect(actions.createUser).toHaveBeenCalledTimes(2);
  });

  it('sessão encerrada ou troca pendente: sai da tela para o lugar certo', async () => {
    client.refreshSession.mockResolvedValue(false);
    actions.createUser.mockResolvedValue({ ok: false, error: 'session_expired' });
    const { unmount } = renderManager();
    createVia('x@empresa.com.br');
    fillIdentity('alguem', 'Alguém');
    submitModal();
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/login?next=%2Fadmin%2Fusuarios'));
    unmount();

    actions.updateUser.mockResolvedValue({ ok: false, error: 'password_change_required' });
    renderManager();
    fireEvent.change(screen.getByLabelText(`Papel de ${OTHER.email}`), { target: { value: 'user' } });
    await waitFor(() =>
      expect(nav.hardNavigate).toHaveBeenCalledWith('/conta/senha?next=%2Fadmin%2Fusuarios')
    );
  });

  it('paginação dentro de uma busca mantém o termo', () => {
    renderManager([ME], { page: 2, totalPages: 3, total: 45, query: 'a b' });
    const pager = screen.getByRole('navigation', { name: 'Paginação' });
    expect(within(pager).getByRole('link', { name: 'Anterior' }).getAttribute('href')).toBe('/admin/usuarios?q=a+b');
    expect(within(pager).getByRole('link', { name: 'Próxima' }).getAttribute('href')).toBe(
      '/admin/usuarios?q=a+b&pagina=3'
    );
  });

  it('paginação com links anterior/próxima', () => {
    renderManager([ME], { page: 2, totalPages: 3, total: 45 });
    const pager = screen.getByRole('navigation', { name: 'Paginação' });
    expect(within(pager).getByText('Página 2 de 3')).toBeTruthy();
    expect(within(pager).getByRole('link', { name: 'Anterior' }).getAttribute('href')).toBe('/admin/usuarios');
    expect(within(pager).getByRole('link', { name: 'Próxima' }).getAttribute('href')).toBe('/admin/usuarios?pagina=3');
  });
});
