import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title?: string;
    description?: string;
    isArticle?: boolean;
    url?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
    title = "SST FAQ | Base de Conhecimento",
    description = "Base de conhecimento sobre Saúde e Segurança do Trabalho, eSocial e Previdência.",
    isArticle = false,
    url = typeof window !== 'undefined' ? window.location.href : ''
}) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const defaultImage = `${origin}/pwa-512x512.png`;

    const schemaOrgJSONLD = isArticle ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
            "@type": "Question",
            "name": title,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": description
            }
        }]
    } : {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "url": url,
        "name": title,
        "description": description
    };

    const safeJsonLd = JSON.stringify(schemaOrgJSONLD).replace(/</g, '\\u003c');

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />
            
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={isArticle ? "article" : "website"} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={defaultImage} />
            
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={defaultImage} />

            <script type="application/ld+json">
                {safeJsonLd}
            </script>
        </Helmet>
    );
};
