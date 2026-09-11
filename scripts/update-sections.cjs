const fs = require('fs');
const path = require('path');

const artigosDir = path.join(__dirname, 'src', 'content', 'artigos');

const troubleshootingDir = path.join(artigosDir, 'Troubleshooting');
if (fs.existsSync(troubleshootingDir)) {
    fs.rmSync(troubleshootingDir, { recursive: true, force: true });
    console.log('Deleted Troubleshooting folder.');
}

const renames = [
    { old: 'SST', new: 'GRO' },
    { old: 'Previdenciario', new: 'Informacoes' }
];

for (const r of renames) {
    const oldPath = path.join(artigosDir, r.old);
    const newPath = path.join(artigosDir, r.new);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log('Renamed ' + r.old + ' to ' + r.new);
    }
}

const newDirs = ['Introducao', 'Coletivo', 'Eventos'];
for (const dir of newDirs) {
    const dirPath = path.join(artigosDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        console.log('Created ' + dir);
    }
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.md')) {
            results.push(file);
        }
    });
    return results;
}

const allMdFiles = walk(artigosDir);

const categoryMap = {
    'Saúde e Segurança': 'GRO',
    'Previdenciário': 'Informações',
    'eSocial e Governo': 'eSocial'
};

allMdFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let updated = false;
    for (const [oldCat, newCat] of Object.entries(categoryMap)) {
        const regex = new RegExp('category:\\s*[\\\'\"]?' + oldCat + '[\\\'\"]?', 'g');
        if (regex.test(content)) {
            content = content.replace(regex, 'category: ' + newCat);
            updated = true;
        }
    }
    if (updated) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated frontmatter in ' + path.basename(file));
    }
});
