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

const replacements = {
  "M\uFFFDdulos": "Módulos",
  "M\uFFFD\uFFFDdulos": "Módulos",
  "M\uFFFD\uFFFD\uFFFDdulos": "Módulos",
  "Notifica\uFFFD\uFFFDes": "Notificações",
  "Notifica\uFFFD\uFFFD\uFFFDes": "Notificações",
  "Atualiza\uFFFD\uFFFDes": "Atualizações",
  "Atualiza\uFFFD\uFFFD\uFFFDes": "Atualizações",
  "posi\uFFFD\uFFFDo": "posição",
  "Posi\uFFFD\uFFFDo": "Posição",
  "n\uFFFD\uFFFDo": "não",
  "Voc\uFFFD\uFFFD": "Você",
  "receber\uFFFD\uFFFD": "receberá",
  "Sensa\uFFFD\uFFFDo": "Sensação",
  "Aten\uFFFD\uFFFDo": "Atenção",
  "Se\uFFFD\uFFFDo": "Seção",
  "Informa\uFFFD\uFFFDes": "Informações",
  "Padr\uFFFD\uFFFDo": "Padrão",
  "Op\uFFFD\uFFFDo": "Opção",
  "op\uFFFD\uFFFDes": "opções",
  "f\uFFFD\uFFFDsica": "física",
  "r\uFFFD\uFFFDpida": "rápida",
  "vis\uFFFD\uFFFDvel": "visível",
  "cabe\uFFFD\uFFFDalhos": "cabeçalhos",
  "exclus\uFFFD\uFFFDo": "exclusão",
  "avalia\uFFFD\uFFFDo": "avaliação",
  "usu\uFFFD\uFFFDrio": "usuário",
  "N\uFFFD\uFFFDo": "Não",
  "\uFFFD\uFFFDe\uFFFDo": "Seção",

  "M\uFFFDdulos": "Módulos",
  "Notifica\uFFFDes": "Notificações",
  "Atualiza\uFFFDes": "Atualizações",
  "posi\uFFFDo": "posição",
  "Posi\uFFFDo": "Posição",
  "n\uFFFDo": "não",
  "Voc\uFFFD": "Você",
  "receber\uFFFD": "receberá",
  "Sensa\uFFFDo": "Sensação",
  "Aten\uFFFDo": "Atenção",
  "Se\uFFFDo": "Seção",
  "Informa\uFFFDes": "Informações",
  "Padr\uFFFDo": "Padrão",
  "Op\uFFFDo": "Opção",
  "op\uFFFDes": "opções",
  "f\uFFFDsica": "física",
  "r\uFFFDpida": "rápida",
  "vis\uFFFDvel": "visível",
  "cabe\uFFFDalhos": "cabeçalhos",
  "exclus\uFFFDo": "exclusão",
  "avalia\uFFFDo": "avaliação",
  "usu\uFFFDrio": "usuário",
  "N\uFFFDo": "Não",

  "\uFFFDcone": "Ícone"
};

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // First apply explicit replacements
    for (const [bad, good] of Object.entries(replacements)) {
      content = content.split(bad).join(good);
    }

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed', file);
    }
  }
});
