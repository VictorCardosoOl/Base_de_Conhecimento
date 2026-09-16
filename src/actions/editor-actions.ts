"use server";

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "artigos");

export async function saveArticle(formData: FormData) {
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const content = formData.get("content") as string;

    if (!title || !category || !content) {
        return { success: false, error: "Preencha todos os campos." };
    }

    try {
        const fileId = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]/g, "-");
        const filePath = path.join(CONTENT_DIR, `${fileId}.md`);

        const frontmatter = {
            id: fileId,
            title: title,
            category: category,
            question: title,
        };

        const fileContent = matter.stringify(content, frontmatter);

        if (!fs.existsSync(CONTENT_DIR)) {
            fs.mkdirSync(CONTENT_DIR, { recursive: true });
        }

        fs.writeFileSync(filePath, fileContent, "utf-8");
        
        return { success: true, id: fileId };
    } catch (e) {
        console.error("Failed to save article", e);
        return { success: false, error: "Erro interno ao salvar." };
    }
}
