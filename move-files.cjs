const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'content', 'artigos');

const fileMoves = {
    'eSocial/evento-s2210-comunicacao-cat.md': { dest: 'Eventos', category: 'Eventos' },
    'eSocial/evento-s2220-monitoramento-saude.md': { dest: 'Eventos', category: 'Eventos' },
    'eSocial/evento-s2221-exame-toxicologico.md': { dest: 'Eventos', category: 'Eventos' },
    'eSocial/evento-s2240-condicoes-ambientais.md': { dest: 'Eventos', category: 'Eventos' },
    'eSocial/eventos-sst-esocial.md': { dest: 'Eventos', category: 'Eventos' },
    'eSocial/eventos-sst-orgaos-publicos.md': { dest: 'Eventos', category: 'Eventos' },
    'GRO/intro-sst.md': { dest: 'Introducao', category: 'Introdução' },
    'GRO/introducao-sst-novos-funcionarios.md': { dest: 'Introducao', category: 'Introdução' }
};

for (const [oldRelPath, info] of Object.entries(fileMoves)) {
    const oldPath = path.join(srcDir, oldRelPath);
    const newDir = path.join(srcDir, info.dest);
    const newPath = path.join(newDir, path.basename(oldPath));
    
    if (fs.existsSync(oldPath)) {
        if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
        }
        
        let content = fs.readFileSync(oldPath, 'utf8');
        // Update category in frontmatter
        content = content.replace(/category:\s*".*?"/, \category: "\"\);
        
        fs.writeFileSync(newPath, content, 'utf8');
        fs.unlinkSync(oldPath);
        console.log(\Moved \ to \ and updated category to \\);
    } else {
        console.log(\File not found: \\);
    }
}
