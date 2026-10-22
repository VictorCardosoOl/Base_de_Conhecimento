/**
 * Termos de Uso e Política de Privacidade, com versão.
 *
 * As versões precisam ser IGUAIS a TERMS_VERSION e PRIVACY_POLICY_VERSION do AuthService:
 * o cadastro envia a versão que a pessoa leu, e o AuthService só aceita as vigentes
 * (ADR-0014). Ao mudar um texto, troque a versão aqui e lá, na mesma entrega.
 *
 * O conteúdo descreve apenas o que o código faz (ver docs/PAGINAS_INSTITUCIONAIS.md,
 * com a origem de cada afirmação e as pendências de confirmação e revisão jurídica).
 */
import { INSTITUTIONAL, OFFICIAL_SOURCES } from './institutional';

export const TERMS_VERSION = '2026-10-10';
export const PRIVACY_VERSION = '2026-10-10';

export interface LegalLink {
  label: string;
  href: string;
}

export interface LegalSection {
  /** Âncora estável (índice da página e links diretos). */
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
  /** Parágrafos depois da lista. */
  after?: string[];
  links?: LegalLink[];
}

export interface LegalDocument {
  title: string;
  version: string;
  /** Data da última revisão do texto, por extenso. */
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
  references?: LegalLink[];
}

const CONTACT = INSTITUTIONAL.contactEmail;

export const TERMS_OF_USE: LegalDocument = {
  title: 'Termos de Uso',
  version: TERMS_VERSION,
  updatedAt: '10 de outubro de 2026',
  intro:
    'Estes Termos de Uso estabelecem as condições para utilizar a Base SST, plataforma de consulta sobre Saúde e Segurança do Trabalho (SST) e eSocial. A leitura dos artigos é livre. Ao criar uma conta, você declara que leu e aceita estes termos e a Política de Privacidade.',
  sections: [
    {
      id: 'servico',
      title: '1. O serviço',
      paragraphs: [
        'A Base SST reúne artigos sobre SST, eSocial, gerenciamento de riscos ocupacionais (GRO) e temas relacionados, organizados por módulo e disponíveis para consulta.',
        'O conteúdo tem caráter informativo. Ele não substitui a legislação oficial, as normas regulamentadoras nem a orientação de um profissional habilitado para a análise do seu caso.',
      ],
    },
    {
      id: 'acesso',
      title: '2. Acesso e conta',
      paragraphs: [
        'Os artigos podem ser lidos sem cadastro. Avaliar artigos, sugerir correções, comentar e acompanhar suas contribuições exigem uma conta.',
        'A conta pode ser criada com e-mail e senha ou, quando disponível, com uma conta Google ou GitHub. Ao criá-la, você se compromete a:',
      ],
      items: [
        'informar dados verdadeiros e mantê-los atualizados;',
        'manter sua senha em sigilo e não compartilhar o acesso, pois a conta é pessoal e intransferível;',
        'escolher um nome de usuário que não imite a equipe nem o sistema (nomes como “admin” e “suporte” são reservados);',
        `comunicar o suporte (${CONTACT}) se suspeitar de uso indevido da sua conta.`,
      ],
      after: [
        'Toda conta começa com acesso de leitura. O acesso de editor é concedido pela equipe, mediante solicitação feita em Minha conta, e pode ser retirado.',
      ],
    },
    {
      id: 'uso-aceitavel',
      title: '3. Uso aceitável',
      paragraphs: ['Ao utilizar a Base SST, não é permitido:'],
      items: [
        'tentar acessar áreas, contas ou dados sem autorização;',
        'automatizar acessos de forma abusiva ou que prejudique o funcionamento do serviço;',
        'publicar conteúdo ilícito, ofensivo, discriminatório ou que viole direitos de terceiros;',
        'publicar dados pessoais de outras pessoas, propaganda ou mensagens repetitivas (spam).',
      ],
    },
    {
      id: 'participacao',
      title: '4. Comentários, avaliações e sugestões de correção',
      paragraphs: [
        'Os comentários são públicos: o texto, o nome de exibição e o nome de usuário de quem comentou ficam visíveis para qualquer visitante. Os comentários aceitam apenas texto simples, com até 2.000 caracteres e até 2 links.',
        'Quem escreveu um comentário pode editá-lo ou removê-lo. Editores e administradores podem remover comentários que descumpram estes termos. Para evitar abusos, a plataforma limita a quantidade de envios em sequência e recusa comentários repetidos.',
        'As avaliações (de 1 a 5) são individuais e podem ser alteradas ou removidas a qualquer momento; a média exibida considera todas as avaliações registradas. As sugestões de correção são analisadas pela equipe editorial, que decide se serão aplicadas. A situação de cada sugestão pode ser acompanhada em Minha conta.',
      ],
    },
    {
      id: 'propriedade-intelectual',
      title: '5. Conteúdo e propriedade intelectual',
      paragraphs: [
        'Os textos, a organização do conteúdo, o código e a identidade visual da Base SST pertencem aos seus autores. Você pode consultá-los e citá-los, desde que indique a fonte.',
        'Ao publicar um comentário ou enviar uma sugestão de correção, você autoriza a Base SST a exibir o comentário na plataforma e a utilizar a sugestão na revisão dos artigos.',
      ],
    },
    {
      id: 'disponibilidade',
      title: '6. Disponibilidade e limitações',
      paragraphs: [
        'A Base SST busca manter o serviço disponível e o conteúdo atualizado. Os artigos passam por revisões periódicas, mas podem ocorrer interrupções (por manutenção ou falhas de terceiros) e defasagens em relação a normas recentes.',
        'Antes de tomar decisões com base no conteúdo, confira a legislação vigente. A Base SST não responde por decisões tomadas exclusivamente a partir do conteúdo informativo, nos limites da legislação aplicável.',
      ],
    },
    {
      id: 'suspensao',
      title: '7. Suspensão e encerramento',
      paragraphs: [
        `Contas que descumpram estes termos podem ser desativadas. Você pode solicitar o encerramento da sua conta a qualquer momento pelo e-mail ${CONTACT}.`,
      ],
    },
    {
      id: 'alteracoes',
      title: '8. Alterações destes termos',
      paragraphs: [
        'Quando estes termos forem alterados, a versão e a data de revisão exibidas no topo desta página serão atualizadas. Em caso de alteração relevante, um novo aceite poderá ser solicitado.',
      ],
    },
    {
      id: 'lei-contato',
      title: '9. Legislação aplicável e contato',
      paragraphs: [
        `Estes termos são regidos pela legislação brasileira. Dúvidas sobre eles podem ser enviadas para ${CONTACT}.`,
      ],
      links: [{ label: 'Política de Privacidade', href: '/privacidade' }],
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Política de Privacidade',
  version: PRIVACY_VERSION,
  updatedAt: '10 de outubro de 2026',
  intro:
    'Esta política explica quais dados pessoais a Base SST trata, para quais finalidades, por quanto tempo, com quem eles podem ser compartilhados e como você pode exercer seus direitos, conforme a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).',
  sections: [
    {
      id: 'responsavel',
      title: '1. Responsável e contato',
      paragraphs: [
        'A Base SST é responsável pelas decisões sobre o tratamento dos dados pessoais descritos nesta política.',
        `Para dúvidas, solicitações sobre seus dados ou comunicações relacionadas à privacidade, escreva para ${CONTACT}.`,
      ],
    },
    {
      id: 'dados',
      title: '2. Dados que tratamos',
      paragraphs: ['Tratamos apenas os dados necessários para oferecer o serviço e protegê-lo:'],
      items: [
        'Conta: e-mail, nome de usuário, nome de exibição, perfil de acesso (leitor, editor ou administrador) e situação da conta. A senha nunca é armazenada em texto: guardamos somente um resumo criptográfico gerado com o algoritmo Argon2id.',
        'Perfil complementar (opcional): organização e área de atuação, informadas no cadastro. Você pode deixá-los em branco.',
        'Login social (se você o utilizar): o identificador da sua conta no Google ou no GitHub e o e-mail confirmado pelo provedor. A Base SST não recebe a senha desses serviços.',
        'Participação: as avaliações que você registra, as sugestões de correção que envia (tipo, descrição e trecho indicado) e os comentários e respostas que publica, com as respectivas datas.',
        'Segurança: dados das sessões abertas (endereço IP, identificação do navegador e datas) e contadores de tentativas de acesso e de envio. Os contadores são guardados como resumo criptográfico, sem o IP ou o e-mail em texto.',
        'Aceite dos documentos: data, versões aceitas dos Termos de Uso e desta política, forma de cadastro e endereço IP.',
        'Dados guardados no seu navegador: preferências e listas que ficam apenas no seu aparelho, descritas em Preferências de Cookie.',
      ],
    },
    {
      id: 'finalidades',
      title: '3. Finalidades e bases legais',
      paragraphs: ['Cada tratamento tem uma finalidade definida e uma base legal prevista no art. 7º da LGPD:'],
      items: [
        'Criar e manter sua conta, autenticar o acesso e oferecer os recursos de avaliação, sugestão de correção e comentários: execução de contrato (art. 7º, V).',
        'Exibir publicamente seus comentários, com nome de exibição e nome de usuário: execução de contrato (art. 7º, V), pois a publicação ocorre por sua iniciativa.',
        'Proteger as contas e o serviço (sessões, limites de tentativas e e-mails de segurança, como o aviso de troca de senha): legítimo interesse (art. 7º, IX).',
        'Guardar a prova do aceite dos Termos de Uso e desta política: exercício regular de direitos (art. 7º, VI).',
        'Monitorar erros e desempenho da aplicação, quando esse recurso estiver ativado: consentimento (art. 7º, I), que pode ser revogado a qualquer momento em Preferências de Cookie.',
      ],
    },
    {
      id: 'compartilhamento',
      title: '4. Compartilhamento',
      paragraphs: ['A Base SST não vende dados pessoais. Os dados podem ser compartilhados somente nas seguintes situações:'],
      items: [
        'com fornecedores de infraestrutura necessários ao funcionamento do serviço, como hospedagem, banco de dados e envio de e-mails;',
        'com o Google ou o GitHub, quando você escolhe entrar com uma dessas contas;',
        'com o serviço de monitoramento de erros Sentry, somente se você permitir e se esse recurso estiver ativado nesta instalação;',
        'com autoridades públicas, quando houver obrigação legal ou ordem judicial.',
      ],
      after: [
        'Lembre-se de que os comentários são públicos: o texto, o nome de exibição e o nome de usuário ficam visíveis para qualquer visitante.',
      ],
    },
    {
      id: 'retencao',
      title: '5. Armazenamento e retenção',
      paragraphs: [],
      items: [
        'Dados da conta, do perfil, dos aceites, das avaliações e dos comentários são mantidos enquanto a conta existir. Com a exclusão da conta, esses registros são eliminados.',
        'Comentários removidos deixam de ser exibidos imediatamente; o registro permanece vinculado à conta, para fins de moderação, até a exclusão da conta.',
        'Sugestões de correção são mantidas como histórico editorial. Com a exclusão da conta, deixam de ser associadas a você.',
        'Sessões vencidas ou encerradas são eliminadas por uma rotina periódica de limpeza, em até 30 dias após o encerramento.',
        'Links enviados por e-mail valem uma única vez e expiram: o de redefinição de senha em 30 minutos e o de confirmação de e-mail em 24 horas.',
        'Os contadores de tentativas são eliminados ao fim do intervalo de controle.',
        'Os dados guardados no seu navegador permanecem até que você os apague.',
      ],
    },
    {
      id: 'seguranca',
      title: '6. Segurança',
      paragraphs: ['Adotamos medidas técnicas para proteger os dados pessoais, entre elas:'],
      items: [
        'senhas protegidas com Argon2id;',
        'sessões em cookies inacessíveis a scripts da página, enviados somente por conexão segura;',
        'credenciais de acesso de curta duração, com renovação controlada e possibilidade de encerrar sessões;',
        'encerramento das demais sessões quando a senha é trocada ou redefinida;',
        'limites de tentativas, verificação da origem das requisições e confirmação de e-mail;',
        'exibição de comentários e sugestões como texto simples, sem execução de código.',
      ],
      after: [
        'Nenhum sistema é totalmente imune a falhas. Se ocorrer um incidente de segurança que possa acarretar risco ou dano relevante, a ANPD e os titulares afetados serão comunicados, conforme o art. 48 da LGPD.',
      ],
    },
    {
      id: 'direitos',
      title: '7. Seus direitos',
      paragraphs: ['Conforme o art. 18 da LGPD, você pode solicitar a qualquer momento:'],
      items: [
        'a confirmação da existência de tratamento e o acesso aos seus dados;',
        'a correção de dados incompletos, inexatos ou desatualizados;',
        'a anonimização, o bloqueio ou a eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei;',
        'a portabilidade dos dados, nos termos da regulamentação da ANPD;',
        'a eliminação dos dados tratados com base no seu consentimento;',
        'informações sobre as entidades com as quais os dados foram compartilhados;',
        'informações sobre a possibilidade de não consentir e sobre as consequências da recusa;',
        'a revogação do consentimento.',
      ],
      after: [
        `Para exercer esses direitos, inclusive a exclusão da sua conta, escreva para ${CONTACT}. Algumas ações podem ser feitas diretamente na plataforma: trocar a senha em Minha conta, editar ou remover seus comentários, alterar ou remover suas avaliações e revogar o consentimento em Preferências de Cookie.`,
        'Você também pode apresentar petição à Autoridade Nacional de Proteção de Dados (ANPD), conforme o art. 18, § 1º, da LGPD.',
      ],
    },
    {
      id: 'cookies',
      title: '8. Cookies e armazenamento no navegador',
      paragraphs: [
        'A Base SST utiliza cookies essenciais para manter a sessão e guarda algumas preferências no seu navegador. O monitoramento de erros e desempenho depende do seu consentimento. A lista completa e os controles estão em Preferências de Cookie.',
      ],
      links: [{ label: 'Preferências de Cookie', href: '/cookies' }],
    },
    {
      id: 'alteracoes',
      title: '9. Alterações desta política',
      paragraphs: [
        'Quando esta política for alterada, a versão e a data de revisão exibidas no topo desta página serão atualizadas. Alterações relevantes serão informadas com destaque e, quando necessário, um novo aceite será solicitado.',
      ],
    },
  ],
  references: [OFFICIAL_SOURCES.lgpd, OFFICIAL_SOURCES.anpd],
};
