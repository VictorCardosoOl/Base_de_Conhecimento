const fs = require('fs');

const files = [
  "src/app/minha-lista/page.tsx",
  "src/app/ClientLayout.tsx",
  "src/components/article/ArticleHighlightsToolbar.tsx",
  "src/components/article/ArticleLightbox.tsx",
  "src/components/article/ArticleReadingControls.tsx",
  "src/components/layout/ArticleModal.tsx",
  "src/components/ui/CommandPalette.tsx",
  "src/components/ui/CookieBanner.tsx",
  "src/components/ui/LegalModal.tsx",
  "src/components/ui/SearchBar.tsx"
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Safety check: if the file has typical mojibake (like ã or ó), we restore it.
      // If the file was not mangled, converting it will throw or result in bad chars.
      // We know these specific files were mangled because they were run through the PS script.
      const restored = Buffer.from(content, 'latin1').toString('utf8');
      
      // Extra safety check: did restoring produce invalid replacement characters \uFFFD?
      if (!restored.includes('\uFFFD')) {
         fs.writeFileSync(file, restored, 'utf8');
         console.log('Restored', file);
      } else {
         console.log('Skipped (invalid chars produced)', file);
      }
    } catch (e) {
      console.error('Failed to restore', file, e);
    }
  }
});
