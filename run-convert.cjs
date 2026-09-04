const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const TurndownService = require('turndown');
const pdfParse = require('pdf-parse');

const turndownService = new TurndownService();
const projectDir = __dirname;
const sourceDir = path.join(projectDir, 'Artigos');
const destDir = path.join(projectDir, 'src', 'content', 'artigos');

const categoryMap = {
    'Coletivo': 'Coletivo',
    'eSocial': 'eSocial',
    'Eventos SST': 'Eventos',
    'Financeiro': 'Financeiro',
    'Gerenciamento de Riscos': 'GRO',
    'Informacoes': 'Informações'
};

const folderMap = {
    'Coletivo': 'Coletivo',
    'eSocial': 'eSocial',
    'Eventos': 'Eventos',
    'Financeiro': 'Financeiro',
    'GRO': 'GRO',
    'Informações': 'Informacoes'
};

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.docx') || file.endsWith('.pdf')) {
            results.push(fullPath);
        }
    });
    return results;
}

function sanitizeId(filename) {
    return filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}

async function convert() {
    const files = walk(sourceDir);
    console.log("Found " + files.length + " files.");
    for (const file of files) {
        const ext = path.extname(file);
        const basename = path.basename(file, ext);
        const parentFolder = path.basename(path.dirname(file));
        
        const category = categoryMap[parentFolder] || parentFolder;
        const targetFolderName = folderMap[category] || category.replace(/[^a-zA-Z0-9]/g, '');
        const targetFolder = path.join(destDir, targetFolderName);

        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }
        
        const targetFile = path.join(targetFolder, basename + '.md');
        let markdownContent = '';

        try {
            if (ext === '.docx') {
                const result = await mammoth.convertToHtml({path: file});
                markdownContent = turndownService.turndown(result.value);
            } else if (ext === '.pdf') {
                const dataBuffer = fs.readFileSync(file);
                const data = await pdfParse(dataBuffer);
                markdownContent = data.text;
            }

            const id = sanitizeId(basename);
            const frontmatter = [
                '---',
                'id: "' + id + '"',
                'question: "' + basename + '"',
                'category: "' + category + '"',
                'date: "04 Sep 2026"',
                'tags: ["Importado"]',
                'answer: "Artigo importado automaticamente."',
                '---',
                '',
                markdownContent
            ].join('\n');
            fs.writeFileSync(targetFile, frontmatter, 'utf8');
            console.log('Converted: ' + basename + ext + ' -> ' + targetFolderName + '/' + basename + '.md');
        } catch (e) {
            console.error('Failed to convert ' + file + ':', e.message);
        }
    }
}

convert();