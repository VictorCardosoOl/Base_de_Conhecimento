import React from 'react';

interface ArticleContentProps {
  htmlContent: string;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({ htmlContent }) => {
  return (
    <div
      className="gsap-stagger-item article-content-render max-w-4xl mx-auto"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
