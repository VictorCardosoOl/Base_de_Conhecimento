import React from 'react';

interface ArticleContentProps {
  htmlContent: string;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({ htmlContent }) => {
  return (
    <div
      className="gsap-stagger-item article-content-render"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
