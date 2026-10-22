import { describe, it, expect, vi, afterEach } from 'vitest';
import { hardNavigate } from '@/lib/navigation';

describe('hardNavigate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('substitui o documento atual (sem entrada nova no histórico)', () => {
    const replace = vi.fn();
    vi.stubGlobal('location', { replace });
    hardNavigate('/admin/editor?id=pgr');
    expect(replace).toHaveBeenCalledWith('/admin/editor?id=pgr');
  });
});
