import { NextResponse } from 'next/server';
import { isAuthConfigured } from '@/features/auth/config';
import { AuthServiceUnavailableError, loadSessionDeps } from '@/features/auth/session';
import { summarizeSession, type SessionSummary } from '@/features/auth/session-summary';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Sem AuthService configurado (ex.: npm run dev só da BaseCore), todo visitante é anônimo.
  if (!isAuthConfigured()) return respond({ authenticated: false });
  let summary: SessionSummary;
  try {
    summary = await summarizeSession(await loadSessionDeps());
  } catch (error) {
    // Configuração incompleta: não há sessão a reconhecer (loadSessionDeps já registrou o motivo).
    if (!(error instanceof AuthServiceUnavailableError)) throw error;
    summary = { authenticated: false };
  }
  return respond(summary);
}

function respond(summary: SessionSummary) {
  return NextResponse.json(summary, { headers: { 'Cache-Control': 'private, no-store' } });
}
