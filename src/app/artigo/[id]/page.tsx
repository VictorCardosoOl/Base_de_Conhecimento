import { Metadata } from 'next';
import { getArticleById, getAllArticles } from '@/lib/markdown';
import { notFound } from 'next/navigation';
import { ArticleContent } from '@/components/article/ArticleContent';
import { marked } from 'marked';

interface Props {
  params: {
    id: string;
  };
}

// Generate static parameters for all articles at build time
export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    id: article.id,
  }));
}

// Generate dynamic metadata for SEO and Social Sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await Promise.resolve(params);
  const article = getArticleById(id);
  
  if (!article) {
    return {
      title: 'Artigo não encontrado',
    };
  }

  return {
    title: `${article.question} | SST FAQ`,
    description: article.excerpt || article.answer,
    openGraph: {
      title: article.question,
      description: article.excerpt || article.answer,
      type: 'article',
      tags: article.tags,
      publishedTime: article.date,
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await Promise.resolve(params);
  const article = getArticleById(id);

  if (!article || !article.content) {
    notFound();
  }

  // Parse markdown on the server for bots
  const htmlContent = await marked.parse(article.content);

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-12 lg:p-16">
      <h1 className="text-3xl font-serif text-text-main mb-8">{article.question}</h1>
      <div className="prose dark:prose-invert max-w-none">
        <ArticleContent htmlContent={htmlContent} articleId={article.id} />
      </div>
    </main>
  );
}
