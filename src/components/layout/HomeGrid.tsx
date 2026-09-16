"use client";
import React, { useMemo } from "react";
import { MasterDetailGrid } from "./MasterDetailGrid";
import { FAQ_DATA } from "@/constants/index";

export function HomeGrid({ categoryParam }: { categoryParam: string | null }) {
  const articles = useMemo(() => {
    if (!categoryParam) return FAQ_DATA;
    return FAQ_DATA.filter((a) => a.category === categoryParam);
  }, [categoryParam]);

  return <MasterDetailGrid items={articles} />;
}
