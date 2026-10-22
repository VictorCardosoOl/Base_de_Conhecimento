'use server';

import { refresh } from 'next/cache';
import { decideRoleRequestAction, type UserActionResult } from '@/features/auth/user-actions';

// Casca da Server Action: autorização (admin ou editor) e regras em features/auth/user-actions.
export async function decideRoleRequest(
  requestId: string,
  decision: 'approve' | 'reject'
): Promise<UserActionResult> {
  const result = await decideRoleRequestAction(requestId, decision);
  if (result.ok) refresh();
  return result;
}
