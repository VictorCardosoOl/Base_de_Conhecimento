import React from "react";
import { IntroHero } from "@/components/article/IntroHero";

export const metadata = {
  title: "Sobre | SST FAQ",
  description: "A história e arquitetura do projeto Base de Conhecimento.",
};

export default function SobrePage() {
  return (
    <div className="w-full flex flex-col min-h-[80vh] items-center justify-center animate-in fade-in duration-700">
      <IntroHero />
    </div>
  );
}
