import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "artigos");
const DATA_DIR = path.join(process.cwd(), "src", "data");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFiles(dir, filesList = []) {
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

const files = getFiles(CONTENT_DIR);
const catalog = [];
const mappingLines = ["export const ARTICLE_CONTENT_MAP: Record<string, any> = {};"];

files.forEach(filePath => {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent.trimStart());

    const fileId = data.id || path.basename(filePath, ".md");
    const question = data.question || data.title || path.basename(filePath, ".md");
    
    const plainText = content.replace(/!\[.*?\]\(.*?\)/g, "").replace(/\[([^\]]+)\]\(.*?\)/g, "$1").replace(/#{1,6}\s+/g, "").replace(/(\*\*|__)(.*?)\1/g, "$2").replace(/(\*|_)(.*?)\1/g, "$2").replace(/`{3}[\s\S]*?`{3}/g, "").replace(/`(.+?)`/g, "$1").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const sanitizedId = path.basename(fileId).replace(/[^a-zA-Z0-9_-]/g, "");
    const excerpt = plainText.substring(0, 160).trim() + (plainText.length > 160 ? "..." : "");

    catalog.push({
        ...data,
        id: sanitizedId,
        question,
        excerpt,
        searchText: plainText,
        answer: data.answer || excerpt,
        category: data.category || "Geral"
    });
    
    mappingLines.push(`ARTICLE_CONTENT_MAP["${sanitizedId}"] = () => Promise.resolve({ default: { content: ${JSON.stringify(content)} } });`);
});

fs.writeFileSync(path.join(DATA_DIR, "catalog.json"), JSON.stringify(catalog, null, 2));
fs.writeFileSync(path.join(DATA_DIR, "mapping.ts"), mappingLines.join("\n"));
console.log("Catalog regenerated for client!");
