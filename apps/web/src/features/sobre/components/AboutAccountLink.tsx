'use client';
import React from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { useCurrentSession } from '@/features/auth/use-session-summary';

/** Com sessão, leva à conta; sem sessão, ao cadastro. Enquanto a sessão carrega, à conta. */
export function AboutAccountLink() {
  const session = useCurrentSession();
  const signedOut = session?.authenticated === false;
  return signedOut ? (
    <ButtonLink href="/cadastro">Criar conta</ButtonLink>
  ) : (
    <ButtonLink href="/conta">Minha conta</ButtonLink>
  );
}
