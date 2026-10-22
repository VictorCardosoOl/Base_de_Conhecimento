import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  decideRoleRequest,
  getOwnRoleRequest,
  listRoleRequests,
} from '@/features/auth/users';

const nav = vi.hoisted(() => ({ hardNavigate: vi.fn() }));
vi.mock('@/lib/navigation', () => nav);

const client = vi.hoisted(() => ({
  refreshSession: vi.fn(async () => true),
  requestEditorAccess: vi.fn(),
}));
vi.mock('@/features/auth/client', () => client);

const actions = vi.hoisted(() => ({ decideRoleRequest: vi.fn() }));
vi.mock('@/app/admin/solicitacoes/actions', () => actions);

import { RoleRequestsManager } from '@/app/admin/solicitacoes/RoleRequestsManager';
import { EditorAccessRequest } from '@/app/conta/EditorAccessRequest';

const CONFIG = { internalUrl: 'http://auth.internal:8010' };
const REQ_ID = '5ddc828e-4536-4a8c-8c9d-f36b2476c13b';
const respond = (status: number, body?: unknown) =>
  vi.fn(async () =>
    body === undefined ? new Response(null, { status }) : new Response(JSON.stringify(body), { status })
  ) as unknown as typeof fetch & ReturnType<typeof vi.fn>;

describe('API de pedidos (server-side, Bearer)', () => {
  it('situação do próprio pedido: nenhum, pendente, fora do contrato', async () => {
    expect(await getOwnRoleRequest('tok', CONFIG, respond(200, null))).toEqual({ ok: true, value: null });
    const pending = respond(200, {
      id: REQ_ID,
      requested_role: 'editor',
      status: 'pending',
      created_at: '2026-09-28T10:00:00Z',
      decided_at: null,
    });
    expect(await getOwnRoleRequest('tok', CONFIG, pending)).toEqual({
      ok: true,
      value: { status: 'pending', createdAt: '2026-09-28T10:00:00Z', decidedAt: null },
    });
    expect(pending.mock.calls[0][0]).toBe('http://auth.internal:8010/auth/role-request');
    expect(pending.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    expect(await getOwnRoleRequest('tok', CONFIG, respond(200, { status: 'hacked' }))).toEqual({
      ok: false,
      error: 'unavailable',
    });
  });

  it('lista pendentes e decide; 409 = já decidido', async () => {
    const list = respond(200, {
      items: [
        {
          id: REQ_ID,
          user_id: 'u',
          email: 'p@e.com.br',
          username: 'pessoa',
          display_name: 'Pessoa',
          created_at: '2026-09-28T10:00:00Z',
          status: 'pending',
        },
      ],
      total: 1,
    });
    expect(await listRoleRequests('tok', CONFIG, { limit: 100, offset: 0 }, list)).toEqual({
      ok: true,
      value: {
        items: [
          {
            id: REQ_ID,
            userId: 'u',
            email: 'p@e.com.br',
            username: 'pessoa',
            displayName: 'Pessoa',
            createdAt: '2026-09-28T10:00:00Z',
          },
        ],
        total: 1,
      },
    });
    const ok = respond(200, { status: 'approved' });
    expect(await decideRoleRequest('tok', CONFIG, REQ_ID, 'approve', ok)).toEqual({ ok: true, value: null });
    expect(ok.mock.calls[0][0]).toBe(`http://auth.internal:8010/admin/role-requests/${REQ_ID}/approve`);
    expect(await decideRoleRequest('tok', CONFIG, REQ_ID, 'reject', respond(409, { error: { code: 'CONFLICT' } }))).toEqual({
      ok: false,
      error: 'already_decided',
    });
  });
});

describe('RoleRequestsManager (/admin/solicitacoes)', () => {
  const REQUEST = {
    id: REQ_ID,
    userId: 'u',
    email: 'pessoa@empresa.com.br',
    username: 'pessoa',
    displayName: 'Pessoa Silva',
    createdAt: '2026-09-28T13:00:00Z',
  };
  beforeEach(() => vi.clearAllMocks());

  it('lista vazia', () => {
    render(<RoleRequestsManager requests={[]} total={0} canManageUsers={false} />);
    expect(screen.getByText('Nenhum pedido pendente.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Usuários' })).toBeNull();
  });

  it('aprova e recusa pelo pedido certo; mostra o resultado', async () => {
    actions.decideRoleRequest.mockResolvedValue({ ok: true });
    render(<RoleRequestsManager requests={[REQUEST]} total={1} canManageUsers />);
    expect(screen.getByText(/28\/09\/2026, 10:00/)).toBeTruthy();
    expect(screen.getByText('Pessoa Silva')).toBeTruthy();
    expect(screen.getByText('@pessoa')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: `Aprovar ${REQUEST.email} como editor` }));
    await waitFor(() => expect(actions.decideRoleRequest).toHaveBeenCalledWith(REQ_ID, 'approve'));
    expect((await screen.findByRole('status')).textContent).toContain('agora é editor');

    fireEvent.click(screen.getByRole('button', { name: `Recusar pedido de ${REQUEST.email}` }));
    await waitFor(() => expect(actions.decideRoleRequest).toHaveBeenCalledWith(REQ_ID, 'reject'));
  });

  it('erros viram mensagem própria; sessão encerrada sai da tela', async () => {
    actions.decideRoleRequest.mockResolvedValue({ ok: false, error: 'already_decided' });
    const { unmount } = render(<RoleRequestsManager requests={[REQUEST]} total={1} canManageUsers={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Aprovar/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('já foi decidido');
    unmount();

    actions.decideRoleRequest.mockResolvedValue({ ok: false, error: 'unauthenticated' });
    render(<RoleRequestsManager requests={[REQUEST]} total={1} canManageUsers={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Recusar/ }));
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/login?next=%2Fadmin%2Fsolicitacoes'));
  });
});

describe('EditorAccessRequest (Minha conta, leitor)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('sem pedido: explica e envia; depois mostra pendente', async () => {
    client.requestEditorAccess.mockResolvedValue({ ok: true });
    render(<EditorAccessRequest initial={{ kind: 'none' }} />);
    expect(screen.getByText(/acesso de leitura/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar acesso de editor' }));
    expect((await screen.findByRole('status')).textContent).toContain('Pedido enviado');
    expect(screen.queryByRole('button', { name: 'Solicitar acesso de editor' })).toBeNull();
  });

  it('pendente: sem botão (não dá para pedir de novo)', () => {
    render(<EditorAccessRequest initial={{ kind: 'pending', since: '2026-09-28T13:00:00Z' }} />);
    expect(screen.getByRole('status').textContent).toContain('28/09/2026');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('recusado: avisa e permite pedir de novo', () => {
    render(<EditorAccessRequest initial={{ kind: 'rejected', decidedAt: '2026-09-28T13:00:00Z' }} />);
    expect(screen.getByText(/foi recusado/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Solicitar acesso de editor' })).toBeTruthy();
  });

  it.each([
    [{ ok: false, reason: 'already_pending' }, 'já tem um pedido pendente'],
    [{ ok: false, reason: 'unavailable' }, 'indisponível'],
  ])('erro %j vira mensagem própria', async (result, message) => {
    client.requestEditorAccess.mockResolvedValue(result);
    render(<EditorAccessRequest initial={{ kind: 'none' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar acesso de editor' }));
    expect((await screen.findByRole('alert')).textContent).toContain(message);
  });

  it('sessão encerrada: vai ao login e volta para a conta', async () => {
    client.requestEditorAccess.mockResolvedValue({ ok: false, reason: 'unauthenticated' });
    render(<EditorAccessRequest initial={{ kind: 'none' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar acesso de editor' }));
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/login?next=%2Fconta'));
  });
});
