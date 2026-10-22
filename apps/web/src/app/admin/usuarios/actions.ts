'use server';

import { refresh } from 'next/cache';
import {
  createUserAction,
  resetPasswordAction,
  updateUserAction,
  type UserActionResult,
} from '@/features/auth/user-actions';

// Casca das Server Actions: a autorização e as regras estão em features/auth/user-actions.
// refresh() devolve a lista atualizada na mesma resposta da ação.

export async function createUser(input: {
  email: string;
  role: string;
  username: string;
  displayName: string;
}): Promise<UserActionResult> {
  const result = await createUserAction(input);
  if (result.ok) refresh();
  return result;
}

export async function updateUser(
  userId: string,
  changes: { role?: string; isActive?: boolean }
): Promise<UserActionResult> {
  const result = await updateUserAction(userId, changes);
  if (result.ok) refresh();
  return result;
}

export async function resetPassword(userId: string): Promise<UserActionResult> {
  const result = await resetPasswordAction(userId);
  if (result.ok) refresh();
  return result;
}
