import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CardItem } from '@/features/articles/components/ArticleGrid';
import { Category, type FAQItem } from '@/features/articles/types';

const ITEM: FAQItem = {
  id: 'aposentadoria-especial',
  category: Object.values(Category)[0],
  question: 'Aposentadoria Especial',
  answer: 'Resumo do artigo.',
  date: '28 Set 2026',
};

describe('CardItem: botão da lista de leitura', () => {
  it('nome acessível diz qual artigo e o estado (salvo ou não)', () => {
    const { rerender } = render(
      <CardItem item={ITEM} onClick={vi.fn()} isInQueue={false} onToggleQueue={vi.fn()} />
    );
    const save = screen.getByRole('button', { name: 'Salvar "Aposentadoria Especial" na lista de leitura' });
    expect(save.getAttribute('aria-pressed')).toBe('false');

    rerender(<CardItem item={ITEM} onClick={vi.fn()} isInQueue onToggleQueue={vi.fn()} />);
    const remove = screen.getByRole('button', { name: 'Remover "Aposentadoria Especial" da lista de leitura' });
    expect(remove.getAttribute('aria-pressed')).toBe('true');
  });

  it('visível no toque e no foco do teclado, não só no hover', () => {
    render(<CardItem item={ITEM} onClick={vi.fn()} isInQueue={false} onToggleQueue={vi.fn()} />);
    const save = screen.getByRole('button', { name: /^Salvar/ });
    expect(save.className).toContain('focus-visible:opacity-100');
    expect(save.className).toContain('[@media(hover:none)]:opacity-100');
  });

  it('salvar não abre o artigo', () => {
    const onClick = vi.fn();
    const onToggleQueue = vi.fn();
    render(<CardItem item={ITEM} onClick={onClick} isInQueue={false} onToggleQueue={onToggleQueue} />);
    fireEvent.click(screen.getByRole('button', { name: /^Salvar/ }));
    expect(onToggleQueue).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});
