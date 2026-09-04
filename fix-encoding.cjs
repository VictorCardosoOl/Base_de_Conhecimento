const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const fixText = (content) => {
    // We try multiple variations of the corrupted text due to terminal/encoding mismatch
    // Standard UTF-8 mojibake
    content = content.replace(/NavegaÃ§Ã£o/g, 'Navegação');
    content = content.replace(/NAVEGAÃ§Ã£O/gi, 'NAVEGAÇÃO');
    content = content.replace(/MÃ³dulos/g, 'Módulos');
    content = content.replace(/MÃ³dulo/g, 'Módulo');
    content = content.replace(/IntroduÃ§Ã£o/g, 'Introdução');
    content = content.replace(/InformaÃ§Ãµes/g, 'Informações');
    content = content.replace(/InÃcio/g, 'Início');
    content = content.replace(/PrÃ³ximo/g, 'Próximo');
    content = content.replace(/VocÃª/g, 'Você');
    content = content.replace(/sÃ£o/g, 'são');
    content = content.replace(/estÃ¡/g, 'está');
    content = content.replace(/SaÃºde e SeguranÃ§a/g, 'Saúde e Segurança');
    content = content.replace(/PrevidÃªncia/g, 'Previdência');
    content = content.replace(/TambÃ©m/g, 'Também');
    content = content.replace(/tambÃ©m/g, 'também');
    content = content.replace(/seÃ§Ã£o/g, 'seção');
    content = content.replace(/SeÃ§Ã£o/g, 'Seção');
    content = content.replace(/RÃ¡pida/g, 'Rápida');
    
    // Also the raw byte representation that PowerShell might have written
    content = content.replace(/Navega(.*)o/g, (match, p1) => {
        if (p1.length < 5 && p1.length > 0 && !p1.includes('ç')) return 'Navegação';
        return match;
    });
    content = content.replace(/M(.*)dulos/g, (match, p1) => {
        if (p1.length < 5 && p1.length > 0 && !p1.includes('ó')) return 'Módulos';
        return match;
    });
    content = content.replace(/M(.*)dulo/g, (match, p1) => {
        if (p1.length < 5 && p1.length > 0 && !p1.includes('ó') && !p1.includes('dulos')) return 'Módulo';
        return match;
    });
    content = content.replace(/Informa(.*)es/g, (match, p1) => {
        if (p1.length < 5 && p1.length > 0 && !p1.includes('ç')) return 'Informações';
        return match;
    });
    content = content.replace(/Introdu(.*)o/g, (match, p1) => {
        if (p1.length < 5 && p1.length > 0 && !p1.includes('ç')) return 'Introdução';
        return match;
    });
    content = content.replace(/In(.*)cio/g, (match, p1) => {
        if (p1.length < 5 && p1.length > 0 && !p1.includes('í') && !p1.includes('n')) return 'Início';
        return match;
    });
    content = content.replace(/Pr(.*)ximo/g, (match, p1) => {
        if (p1.length < 5 && p1.length > 0 && !p1.includes('ó')) return 'Próximo';
        return match;
    });

    return content;
}

const files = walk('./src');
let changed = 0;
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const fixed = fixText(content);
    if(content !== fixed) {
        fs.writeFileSync(f, fixed, 'utf8');
        changed++;
        console.log("Fixed: " + f);
    }
});
console.log("Total files fixed: " + changed);

// Fix the missing IDs in Markdown
const walkMd = (dir) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkMd(file));
        } else if (file.endsWith('.md')) {
            results.push(file);
        }
    });
    return results;
}

const mdFiles = walkMd('./src/content/artigos');
let mdChanged = 0;
mdFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.startsWith('---') && !content.includes('id:')) {
        const lines = content.split('\n');
        const basename = path.basename(f, '.md');
        lines.splice(1, 0, `id: "${basename}"`);
        fs.writeFileSync(f, lines.join('\n'), 'utf8');
        mdChanged++;
        console.log("Fixed ID in: " + f);
    }
});
console.log("Total MD files fixed: " + mdChanged);

