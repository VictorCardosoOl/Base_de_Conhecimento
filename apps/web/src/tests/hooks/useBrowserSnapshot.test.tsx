import { describe, it, expect, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { useBrowserSnapshot } from '@/hooks/use-browser-snapshot';

const EMPTY: string[] = [];
let stored: string[] = ['a', 'b'];
const readStored = () => stored;

function Count() {
  const items = useBrowserSnapshot(readStored, EMPTY);
  return <p>itens: {items.length}</p>;
}

let reads = 0;
// Como os dados de demonstração do analytics: cada leitura gera um valor novo.
const readNonDeterministic = () => {
  reads += 1;
  return [{ at: Date.now() + reads }];
};
const NONE: { at: number }[] = [];
function Unstable() {
  const items = useBrowserSnapshot(readNonDeterministic, NONE);
  return <p>instável: {items.length}</p>;
}

async function hydrate(element: React.ReactElement) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
  const serverHtml = container.innerHTML;
  const recoverable = vi.fn();
  await act(async () => {
    hydrateRoot(container, element, { onRecoverableError: recoverable });
  });
  return { container, serverHtml, recoverable };
}

describe('useBrowserSnapshot', () => {
  it('servidor e hidratação usam o mesmo valor; depois aparece o do navegador', async () => {
    stored = ['a', 'b'];
    const { container, serverHtml, recoverable } = await hydrate(<Count />);
    expect(serverHtml).toContain('itens: <!-- -->0');
    expect(recoverable).not.toHaveBeenCalled(); // sem erro de hidratação (#418)
    expect(container.textContent).toBe('itens: 2');
  });

  it('leitura não determinística não vira atualização infinita', async () => {
    reads = 0;
    const { container, recoverable } = await hydrate(<Unstable />);
    expect(recoverable).not.toHaveBeenCalled();
    expect(container.textContent).toBe('instável: 1');
    expect(reads).toBeLessThanOrEqual(2);
  });

  it('relê quando o storage muda em outra aba', async () => {
    stored = ['a'];
    const { container } = await hydrate(<Count />);
    expect(container.textContent).toBe('itens: 1');
    stored = ['a', 'b', 'c'];
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage'));
    });
    expect(container.textContent).toBe('itens: 3');
  });
});
