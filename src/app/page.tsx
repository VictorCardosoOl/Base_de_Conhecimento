"use client";
import React, { useMemo, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/ui/SearchBar";
import { MasterDetailGrid } from "@/components/layout/MasterDetailGrid";
import { IntroducaoHero } from "@/components/article/IntroducaoHero";
import { FAQ_DATA } from "@/constants/index";
import { Category, FAQItem } from "@/types/index";
import { ReadingExperienceService } from "@/services/readingExperienceService";

import { Suspense } from 'react';

function HomeContent() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams ? searchParams.get("category") : null;
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [recentArticles, setRecentArticles] = useState<FAQItem[]>([]);

    useEffect(() => {
        setRecentSearches(ReadingExperienceService.getRecentSearches());
        const ids = ReadingExperienceService.getRecentArticles();
        setRecentArticles(ids.map(id => FAQ_DATA.find(a => a.id === id)).filter(Boolean) as FAQItem[]);
    }, []);

    const articles = useMemo(() => {
        if (!categoryParam) return FAQ_DATA;
        return FAQ_DATA.filter(a => a.category === categoryParam);
    }, [categoryParam]);

    return (
        <div className="w-full">
            <div className="mb-8 mt-4">
                <SearchBar onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "/", metaKey: true }))} />
            </div>

            {categoryParam === 'Introdução' && <IntroducaoHero />}

            <div className="mt-12">
                <MasterDetailGrid 
                    items={articles} 
                    recentSearches={recentSearches}
                    recentArticles={recentArticles}
                />
            </div>
        </div>
    );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
