"use server";

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import glossaryData from "../data/glossary.json";

// We need JSDOM to use DOMPurify on the server
const window = new JSDOM("").window;
const purify = DOMPurify(window as unknown as Window);

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "artigos");

export async function fetchParsedArticleHtml(id: string): Promise<string | null> {
    try {
        const filePath = path.join(CONTENT_DIR, `${id}.md`);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { content } = matter(fileContent.trimStart());

        let rawHtml = await marked.parse(content, { headerIds: false });

        // Injetar Glossario
        const glossaryEntries = Object.entries(glossaryData || {});
        if (glossaryEntries.length > 0) {
            const sortedTerms = glossaryEntries.map(([t]) => t).sort((a, b) => b.length - a.length);
            const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const combinedRegex = new RegExp(`(?![^<]*>)\\b(${sortedTerms.map(escapeRegExp).join('|')})\\b`, 'gi');
            
            const escapeHtml = (str: string) =>
                str.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#39;');

            const termToDef = Object.fromEntries(
                glossaryEntries.map(([t, d]) => [t.toLowerCase(), escapeHtml(d as string)])
            );

            rawHtml = rawHtml.replace(combinedRegex, (match) => {
                const safeDef = termToDef[match.toLowerCase()];
                return safeDef ? `<span class="glossary-term" data-tooltip="${safeDef}">${match}</span>` : match;
            });
        }

        // Sanitizar
        return purify.sanitize(rawHtml, { ADD_ATTR: ['data-tooltip'] });
    } catch (e) {
        console.error("Failed to parse article", e);
        return null;
    }
}
