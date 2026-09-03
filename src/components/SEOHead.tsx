
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title?: string;
    description?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
    title = "SST FAQ | Base de Conhecimento",
    description = "Base de conhecimento sobre Saúde e Segurança do Trabalho, eSocial e Previdência."
}) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
        </Helmet>
    );
};
