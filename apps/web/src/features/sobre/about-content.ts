/**
 * Conteúdo da página "Sobre". Cada afirmação corresponde a algo verificável no projeto
 * (código, README ou dados da equipe); o que depende de confirmação está listado em
 * docs/PAGINA_SOBRE.md e não aparece aqui como fato.
 */

export interface AboutFeature {
  id: string;
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}

export interface AboutCommitment {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}

/** Origem do projeto (README, seção "A origem do projeto"), em linguagem institucional. */
export const ORIGIN = [
  'A Base SST surgiu dentro de uma equipe que lidava diariamente com rotinas de Saúde e Segurança do Trabalho e eSocial. Os processos eram transmitidos principalmente de forma oral, o que gerava ruídos de comunicação, respostas mais lentas e dificuldade para integrar novos colaboradores.',
  'Para reduzir essa dependência, a equipe passou a documentar os fluxos de trabalho de forma colaborativa. O material reunido deu origem a um portal único de consulta, que hoje está disponível para consulta aberta.',
];

/** Áreas de atuação previstas no cadastro (AuthService, ProfessionalArea). */
export const AUDIENCE = [
  'Segurança do trabalho',
  'Saúde ocupacional',
  'Recursos humanos e departamento pessoal',
  'Contabilidade e financeiro',
  'Jurídico',
  'Tecnologia da informação',
  'Gestão',
];

export const FEATURES: AboutFeature[] = [
  {
    id: 'modulos',
    title: 'Artigos organizados por módulo',
    description: 'Conteúdo sobre eSocial, GRO, eventos de SST e temas relacionados, agrupado por módulo e com filtro e ordenação na página inicial.',
    href: '/',
    linkLabel: 'Ver os módulos',
  },
  {
    id: 'busca',
    title: 'Busca tolerante a erros',
    description: 'A busca encontra artigos mesmo com erros de digitação. Ela fica na lupa do cabeçalho e também abre pelo atalho Ctrl + K.',
  },
  {
    id: 'leitura',
    title: 'Leitura com orientação',
    description: 'Os artigos trazem indicador de progresso, tempo estimado de leitura, índice das seções em telas maiores e ajustes de fonte e entrelinha.',
  },
  {
    id: 'lista',
    title: 'Minha Lista e trilhas',
    description: 'Salve artigos para ler depois, acompanhe trilhas de leitura sugeridas e defina uma meta de tempo de leitura.',
    href: '/minha-lista',
    linkLabel: 'Abrir Minha Lista',
  },
  {
    id: 'participacao',
    title: 'Avaliação, correções e comentários',
    description: 'Com uma conta, você pode avaliar os artigos, sugerir correções à equipe editorial e participar das discussões.',
    href: '/cadastro',
    linkLabel: 'Criar conta',
  },
  {
    id: 'revisao',
    title: 'Revisão periódica',
    description: 'Os artigos têm data de publicação e ciclo de revisão; os que se aproximam do vencimento são sinalizados à equipe editorial.',
    href: '#manutencao',
    linkLabel: 'Como o conteúdo é mantido',
  },
];

/** Como o conteúdo é mantido (editor do painel, catálogo e fila de correções). */
export const MAINTENANCE = [
  'Os artigos são escritos em Markdown e versionados no repositório do projeto, o que mantém o histórico de todas as alterações.',
  'Cada artigo informa a data de publicação e segue um ciclo de revisão, de 12 meses por padrão. O painel editorial sinaliza os artigos vencidos ou próximos do vencimento.',
  'As sugestões de correção enviadas pelos leitores entram em uma fila de revisão da equipe editorial, e quem enviou acompanha a situação em Minha conta.',
];

export const DISCLAIMER =
  'O conteúdo tem caráter informativo e não substitui a legislação oficial, as normas regulamentadoras nem a orientação de um profissional habilitado.';

export const COMMITMENTS: AboutCommitment[] = [
  {
    title: 'Transparência sobre o conteúdo',
    description: 'Datas visíveis, ciclo de revisão e um caminho direto para apontar erros: o leitor sabe de quando é a informação e como corrigi-la.',
  },
  {
    title: 'Privacidade por padrão',
    description: 'O monitoramento de erros só é ativado com o seu consentimento, e as preferências de leitura ficam apenas no seu aparelho.',
    href: '/privacidade',
    linkLabel: 'Política de Privacidade',
  },
  {
    title: 'Acessibilidade',
    description: 'As telas são verificadas por testes automatizados com base nas diretrizes WCAG 2.1, nível AA, e foram projetadas para uso também pelo teclado.',
  },
  {
    title: 'Código aberto para consulta',
    description: 'O código-fonte da plataforma está disponível publicamente no GitHub.',
    href: 'https://github.com/VictorCardosoOl/Base_de_Conhecimento',
    linkLabel: 'Repositório no GitHub',
  },
];

/** Tipo de destino do link de cada pessoa: define o rótulo e o ícone do botão. */
export type ProfileLinkKind = 'portfolio' | 'links' | 'linkedin' | 'github';

export interface ProfileLink {
  kind: ProfileLinkKind;
  url: string;
}

interface PersonBase {
  id: string;
  name: string;
  role: string;
  /** Foto autorizada em /public (ex.: '/equipe/victor.webp'); sem ela, exibem-se as iniciais. */
  photo?: string;
  link: ProfileLink;
}

/** Quem desenvolve a plataforma. */
export interface Maintainer extends PersonBase {
  /** Parágrafos curtos sobre o papel e a contribuição. */
  about: string[];
  /** Contribuições concretas, registradas no histórico do repositório. */
  highlights: string[];
}

/** Quem contribuiu com conhecimento técnico. */
export interface Consultant extends PersonBase {
  contributions: string[];
}

/**
 * Fontes: README (Créditos), dados da equipe que já existiam no projeto e o histórico do
 * git (autoria dos commits). Formação, trajetória e fotos ainda não foram fornecidas
 * (ver docs/PAGINA_SOBRE.md) e, por isso, não aparecem.
 */
export const MAINTAINERS: Maintainer[] = [
  {
    id: 'victor-cardoso',
    name: 'Victor Cardoso',
    role: 'Idealizador e arquiteto',
    link: { kind: 'portfolio', url: 'https://victor-cardoso.vercel.app' },
    about: [
      'Victor Cardoso idealizou a Base SST. Ao perceber que os processos da equipe eram transmitidos principalmente de forma oral, iniciou a documentação dos fluxos de trabalho que deu origem ao portal.',
      'É responsável pela arquitetura da plataforma, pelo design de interface e pelo desenvolvimento front-end.',
    ],
    highlights: [
      'Estrutura inicial da aplicação e organização do catálogo de artigos',
      'Testes automatizados com Vitest e integração contínua',
      'Modo foco, controles tipográficos e demais recursos de leitura',
      'Primeiras versões das telas de login e cadastro',
    ],
  },
  {
    id: 'guilherme-cruz',
    name: 'Guilherme Cruz',
    role: 'Idealizador e desenvolvedor',
    link: { kind: 'links', url: 'https://gcruz.dev.br/links' },
    about: [
      'Guilherme Cruz é coidealizador da Base SST e atua na engenharia de software da plataforma, com foco na estrutura técnica, nas regras do sistema e na consistência entre as telas.',
      'Também desenvolve o serviço de contas, que concentra o login, o cadastro, os perfis de acesso e as interações dos leitores com os artigos.',
    ],
    highlights: [
      'Serviço de contas: login, cadastro, recuperação de senha e login social',
      'Integração do login com a plataforma e proteção da área administrativa',
      'Correções de segurança e privacidade, como a sanitização dos artigos',
      'Design system atual, avaliações, comentários e páginas institucionais',
    ],
  },
];

export const CONSULTANTS: Consultant[] = [
  {
    id: 'sabrina-fraguela',
    name: 'Sabrina Fraguela',
    role: 'Consultora técnica',
    link: { kind: 'linkedin', url: 'https://br.linkedin.com/in/sabrinaalvesfraguela' },
    contributions: ['Curadoria do conteúdo operacional', 'Revisão do conteúdo operacional publicado'],
  },
  {
    id: 'joao-sanchez',
    name: 'João Sanchez',
    role: 'Consultor técnico',
    link: { kind: 'github', url: 'https://github.com/Juao-crtl-c' },
    contributions: [
      'Revisão e organização do material técnico publicado',
      'Apoio na estruturação e na precisão dos fluxos e procedimentos',
    ],
  },
];
