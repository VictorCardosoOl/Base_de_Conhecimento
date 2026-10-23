import { Metadata } from 'next';
import { getArticleById, getAllArticles } from '@/features/articles/article-files';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { sanitizeArticleHtml } from '@/features/articles/sanitize-html';
import { ArticleHero } from '@/features/articles/components/ArticleHero';
import { ArticleReader } from '@/features/articles/components/ArticleReader';
import { ArticleActions } from '@/features/articles/components/ArticleActions';
import { readingMinutes } from '@/features/articles/article-meta';

interface Props {
  params: Promise<{ id: string }>;
}

/** Serializa JSON-LD com segurança para inline em <script> (evita quebra por "</script>"). */
const toJsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, '\\u003c');

// Generate static parameters for all articles at build time
export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    id: article.id,
  }));
}

// Generate dynamic metadata for SEO and Social Sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = getArticleById(id);

  if (!article) {
    return {
      title: 'Artigo não encontrado',
    };
  }

  return {
    title: `${article.question} | SST FAQ`,
    description: article.excerpt || article.answer,
    alternates: { canonical: `/artigo/${article.id}` },
    openGraph: {
      title: article.question,
      description: article.excerpt || article.answer,
      type: 'article',
      tags: article.tags,
      publishedTime: article.date,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = getArticleById(id);

  if (!article || !article.content) {
    notFound();
  }

  // Markdown → HTML → sanitização no servidor, antes de qualquer renderização
  const htmlContent = sanitizeArticleHtml(await marked.parse(article.content));

  // Dados estruturados para motores de busca e de resposta (AEO)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.question,
        description: article.excerpt || article.answer,
        inLanguage: 'pt-BR',
        articleSection: article.category,
        keywords: article.tags?.join(', '),
        datePublished: article.date,
        dateModified: article.lastReviewed || article.date,
        ...(article.author && { author: { '@type': 'Person', name: article.author } }),
        ...(article.verifiedBy && {
          reviewedBy: { '@type': 'Person', name: article.verifiedBy },
        }),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: article.question,
            acceptedAnswer: { '@type': 'Answer', text: article.answer },
          },
        ],
      },
    ],
  };

  return (
    <article className="w-full max-w-[1700px] mx-auto space-y-12 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />
      {/* Top Editorial Hero */}
      <ArticleHero
        article={article}
        minutes={readingMinutes(article.searchText)}
        actions={<ArticleActions articleId={article.id} title={article.question} summary={article.answer} />}
      />

      {/* Main Reading Flow & Side Index */}
      <ArticleReader
        htmlContent={htmlContent}
        articleId={article.id}
        title={article.question}
        summary={article.answer}
      />
    </article>
  );
}
