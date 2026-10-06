import React from 'react';
import { EditorialChapter } from '@/data/sobre-chapters';

export const EditorialSection = ({ chapter }: { chapter: EditorialChapter }) => {
  return (
    <section id={chapter.id} className="py-24 px-6 md:px-12 w-full max-w-5xl mx-auto border-t border-black/10">
      <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-start">
        {/* Left Column: Number & Subtitle */}
        <div className="w-full md:w-1/3 flex flex-col pt-2">
          <span className="font-mono text-sm tracking-widest opacity-40 mb-4">{chapter.number}</span>
          <h2 className="font-serif text-3xl md:text-5xl text-[#1a1a1a] leading-tight mb-4">
            {chapter.title}
          </h2>
          {chapter.subtitle && (
            <p className="font-mono text-[10px] md:text-xs tracking-widest uppercase opacity-60 leading-relaxed border-t border-black/10 pt-4 mt-2">
              {chapter.subtitle}
            </p>
          )}
        </div>

        {/* Right Column: Content */}
        <div className="w-full md:w-2/3 flex flex-col font-sans font-light text-base md:text-lg text-[#1a1a1a] leading-relaxed opacity-90">
          <div className="space-y-6">
            {chapter.content.map((paragraph, idx) => (
              typeof paragraph === 'string' ? (
                <p key={idx}>{paragraph}</p>
              ) : (
                <div key={idx}>{paragraph}</div>
              )
            ))}
          </div>

          {chapter.callout && (
            <div className="mt-12 pt-8 border-t border-black/10 font-sans">
              {chapter.callout}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
