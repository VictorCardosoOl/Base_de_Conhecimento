import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "artigos");

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  date?: string;
  lastReviewed?: string;
  validityMonths?: number;
  verifiedBy?: string;
  content?: string;
  excerpt?: string;
  searchText?: string;
}

function getFiles(dir: string, filesList: string[] = []) {
    if (!fs.existsSync(dir)) return filesList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, filesList);
        } else if (name.endsWith(".md")) {
            filesList.push(name);
        }
    }
    return filesList;
}

export function getAllArticles(): FAQItem[] {
  const files = getFiles(CONTENT_DIR);
  const catalog: FAQItem[] = [];

  files.forEach(filePath => {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent.trimStart());

      const fileId = data.id || path.basename(filePath, ".md");
      const question = data.question || data.title || path.basename(filePath, ".md");
      
      const plainText = content
          .replace(/!\[.*?\]\(.*?\)/g, "")
          .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
          .replace(/#{1,6}\s+/g, "")
          .replace(/(\*\*|__)(.*?)\1/g, "$2")
          .replace(/(\*|_)(.*?)\1/g, "$2")
          .replace(/`{3}[\s\S]*?`{3}/g, "")
          .replace(/`(.+?)`/g, "$1")
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const sanitizedId = path.basename(fileId).replace(/[^a-zA-Z0-9_-]/g, "");
      const excerpt = plainText.substring(0, 160).trim() + (plainText.length > 160 ? "..." : "");

      catalog.push({
          ...data,
          id: sanitizedId,
          question,
          content,
          excerpt,
          searchText: plainText,
          answer: data.answer || excerpt,
          category: data.category || "Geral"
      } as FAQItem);
  });

  return catalog;
}

export function getArticleById(id: string): FAQItem | null {
  const articles = getAllArticles();
  return articles.find(a => a.id === id) || null;
}
