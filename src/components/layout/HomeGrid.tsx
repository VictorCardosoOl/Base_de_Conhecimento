"use client";
import React, { useMemo } from "react";
import { ArticleGrid } from './ArticleGrid';
import { FAQ_DATA } from '@/config/index';

export function HomeGrid({ categoryParam }: { categoryParam: string | null }) {
  const articles = useMemo(() => {
    if (!categoryParam) return FAQ_DATA;
    return FAQ_DATA.filter((a) => a.category === categoryParam);
  }, [categoryParam]);

  return <ArticleGrid items={articles} />;
}
