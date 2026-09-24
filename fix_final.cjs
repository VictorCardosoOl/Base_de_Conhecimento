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
    
    content = content.replace(/\uFFFD\./g, '?.');
    content = content.replace(/\uFFFD:/g, '?:');
    content = content.replace(/N\uFFFDo/g, 'No');
    content = content.replace(/n\uFFFDo/g, 'no');
    content = content.replace(/\uFFFD/g, ''); // delete remaining garbage

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
