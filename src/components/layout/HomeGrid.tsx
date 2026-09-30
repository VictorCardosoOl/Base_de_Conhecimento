'use client';
import React, { useMemo } from 'react';
import { ArticleGrid } from './ArticleGrid';
import { FAQ_DATA } from '@/config/index';
import { IntroHero } from '../article/IntroHero';
import { Category } from '@/types/index';

export function HomeGrid({ categoryParam }: { categoryParam: string | null }) {
  const articles = useMemo(() => {
    if (!categoryParam) return FAQ_DATA;
    return FAQ_DATA.filter((a) => a.category === categoryParam);
  }, [categoryParam]);

  if (categoryParam === Category.SOBRE) {
    return (
      <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-700">
        <IntroHero />
      </div>
    );
  }

  return <ArticleGrid items={articles} />;
}
