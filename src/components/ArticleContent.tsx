import React from 'react';
import { motion } from 'framer-motion';

interface ArticleContentProps {
  htmlContent: string;
  variants: any;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({ htmlContent, variants }) => {
  return (
    <motion.div
      variants={variants}
      className="article-content-render prose prose-lg prose-slate max-w-none
        prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-gray-900
        prose-p:leading-8 prose-p:text-gray-600 prose-p:font-light
        prose-strong:font-semibold prose-strong:text-gray-800
        prose-blockquote:border-l-2 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-li:marker:text-gray-400 prose-img:rounded-lg prose-img:shadow-sm
        first-letter:float-left first-letter:text-[4.5rem] first-letter:leading-[0.8] first-letter:font-serif first-letter:mr-3 first-letter:text-gray-900 first-letter:font-medium"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
