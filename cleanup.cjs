const fs = require('fs');

const files = [
  "src/app/minha-lista/page.tsx",
  "src/app/ClientLayout.tsx",
  "src/components/article/ArticleHighlightsToolbar.tsx",
  "src/components/article/ArticleLightbox.tsx",
  "src/components/article/ArticleReadingControls.tsx",
  "src/components/layout/ArticleModal.tsx",
  "src/components/layout/Sidebar.tsx",
  "src/components/ui/CommandPalette.tsx",
  "src/components/ui/CookieBanner.tsx",
  "src/components/ui/LegalModal.tsx",
  "src/components/ui/SearchBar.tsx"
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix Node
    content = content.replace(/ReactN\uFFFDode/g, 'ReactNode');
    
    // Fix Notification
    content = content.replace(/N\uFFFDotification/g, 'Notification');
    content = content.replace(/N\uFFFDotifications/g, 'Notifications');
    content = content.replace(/N\uFFFDo/g, 'Não');
    
    // Fix nao
    content = content.replace(/n\uFFFDo-scrollbar/g, 'no-scrollbar');
    content = content.replace(/n\uFFFDo/g, 'não');
    content = content.replace(/n\uFFFDormas/g, 'normas');
    content = content.replace(/n\uFFFDowrap/g, 'nowrap');
    content = content.replace(/n\uFFFDone/g, 'none');

    // Fix Você receberá
    content = content.replace(/Voc\uFFFDê/g, 'Você');
    content = content.replace(/receber\uFFFDá/g, 'receberá');

    // Fix ternary ?
    content = content.replace(/\uFFFD /g, '? ');
    content = content.replace(/ \uFFFD/g, ' ?');
    
    // Fix comments and generic missing
    content = content.replace(/\uFFFD/g, '—'); // Fallback for other stuff like "—" or "Í"
    
    // Fix Módulos again
    content = content.replace(/M—dulos/g, 'Módulos');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Cleaned', file);
  }
});
