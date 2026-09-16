const fs = require('fs');
['src/components/article/ArticleContent.tsx', 'src/components/article/ArticleHighlightsToolbar.tsx', 'src/components/article/ArticleLightbox.tsx'].forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
      fs.writeFileSync(f, '"use client";\n' + content, 'utf8');
      console.log('Added use client to ' + f);
    }
  }
});
