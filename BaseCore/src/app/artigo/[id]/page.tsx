import { Metadata } from 'next';
import { getArticleById, getAllArticles } from '@/lib/markdown';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { marked } from 'marked';

const ArticleContent = dynamic(
  () => import('@/components/article/ArticleContent').then((mod) => mod.ArticleContent),
  { loading: () => <div className="animate-pulse h-32 bg-stone-100 dark:bg-stone-900 rounded-xl" /> }
);

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

  // Parse markdown on the server for bots
  const htmlContent = await marked.parse(article.content);

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
    <article className="max-w-4xl mx-auto p-6 md:p-12 lg:p-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />
      <h1 className="text-3xl font-serif text-text-main mb-8">
        {article.question}
      </h1>
      <div className="prose dark:prose-invert max-w-none">
        <ArticleContent htmlContent={htmlContent} articleId={article.id} />
      </div>
    </article>
  );
}
