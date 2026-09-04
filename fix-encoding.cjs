const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'content', 'artigos');
function walk(dir) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
        else if (file.endsWith('.md')) results.push(file);
    });
    return results;
}
walk(dir).forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    content = content.replace(/category:\s*["']Saúde e Segurança["']/g, 'category: "GRO"');
    content = content.replace(/category:\s*["']Previdenciário["']/g, 'category: "Informações"');
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed encoding issue in: ' + path.basename(file));
    }
});
