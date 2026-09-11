import { describe, it, expect, beforeEach } from 'vitest';
import { ReadingExperienceService } from '../readingExperienceService';

describe('ReadingExperienceService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve gerenciar preferências tipográficas com valores padrão', () => {
    const defaultTypo = ReadingExperienceService.getTypography();
    expect(defaultTypo.fontFamily).toBe('serif');
    expect(defaultTypo.fontSize).toBe('base');
    expect(defaultTypo.lineHeight).toBe('relaxed');

    ReadingExperienceService.setTypography({
      fontFamily: 'dyslexic',
      fontSize: 'lg',
      lineHeight: 'loose'
    });

    const updated = ReadingExperienceService.getTypography();
    expect(updated.fontFamily).toBe('dyslexic');
    expect(updated.fontSize).toBe('lg');
  });

  it('deve contabilizar tempo silencioso de leitura e disparar conclusão na meta', () => {
    ReadingExperienceService.setReadingGoalTarget(60); // 60 minutos
    let goal = ReadingExperienceService.getReadingGoal();
    expect(goal.targetMinutes).toBe(60);
    expect(goal.elapsedSeconds).toBe(0);
    expect(goal.completedNotified).toBe(false);

    // Adiciona 3599 segundos (1 segundo antes de completar 60min)
    let res = ReadingExperienceService.addReadingTime(3599);
    expect(res.completedNow).toBe(false);

    // Adiciona 1 segundo e atinge os 3600 segundos (60min)
    res = ReadingExperienceService.addReadingTime(1);
    expect(res.completedNow).toBe(true);
    expect(res.goal.completedNotified).toBe(true);
  });

  it('deve salvar e remover marcações de texto (highlights) por artigo', () => {
    const h1 = ReadingExperienceService.addHighlight('art-1', 'Trecho importante de NR-01', 'yellow');
    const h2 = ReadingExperienceService.addHighlight('art-1', 'Outro ponto relevante', 'green');
    ReadingExperienceService.addHighlight('art-2', 'Artigo diferente', 'pink');

    const art1Highlights = ReadingExperienceService.getHighlights('art-1');
    expect(art1Highlights).toHaveLength(2);
    expect(art1Highlights[0].text).toBe('Outro ponto relevante');

    ReadingExperienceService.removeHighlight(h1.id);
    const updated = ReadingExperienceService.getHighlights('art-1');
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe(h2.id);
  });

  it('deve registrar e limitar a 5 buscas e artigos recentes', () => {
    ['SST', 'PCMSO', 'LTCAT', 'eSocial', 'CIPA', 'PGR'].forEach(q => {
      ReadingExperienceService.addRecentSearch(q);
    });

    const recent = ReadingExperienceService.getRecentSearches();
    expect(recent).toHaveLength(5);
    expect(recent[0]).toBe('PGR'); // mais recente no topo
  });
});
