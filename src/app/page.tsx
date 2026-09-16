import React from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { HomeGrid } from "@/components/layout/HomeGrid";
import { IntroHero } from "@/components/article/IntroHero";

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const categoryParam = typeof searchParams?.category === 'string' ? searchParams.category : null;

  return (
    <div className="w-full">
      <div className="mb-8 mt-4">
        <SearchBar />
      </div>

      {categoryParam === 'Introdução' && <IntroHero />}

      <div className="mt-12">
        <HomeGrid categoryParam={categoryParam} />
      </div>
    </div>
  );
}
