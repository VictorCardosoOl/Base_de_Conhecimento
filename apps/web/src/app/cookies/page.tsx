import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/features/legal/components/LegalPageLayout';
import { OFFICIAL_SOURCES } from '@/features/legal/institutional';
import { CookiePreferences } from '@/features/consent/components/CookiePreferences';
import {
  ESSENTIAL_ITEMS,
  FEATURE_ITEMS,
  MONITORING_ITEMS,
  STORAGE_KIND_LABEL,
  type StorageItem,
} from '@/features/consent/storage-inventory';

export const metadata: Metadata = {
  title: 'Preferências de Cookie | Base SST',
  description: 'Cookies e dados guardados no navegador pela Base SST, suas finalidades e o controle do monitoramento opcional.',
};

const TOC = [
  { id: 'o-que-sao', title: '1. O que são cookies' },
  { id: 'essenciais', title: '2. Essenciais' },
  { id: 'recursos', title: '3. Recursos que você aciona' },
  { id: 'monitoramento', title: '4. Monitoramento (opcional)' },
  { id: 'preferencias', title: '5. Suas preferências' },
  { id: 'efeitos', title: '6. Efeitos das suas escolhas' },
];

function StorageTable({ items, caption }: { items: StorageItem[]; caption: string }) {
  return (
    <>
      {/* Telas estreitas: um cartão por item, sem rolagem lateral. */}
      <ul aria-label={caption} className="my-4 space-y-3 sm:hidden">
        {items.map((item) => (
          <li key={item.name} className="glass-flat p-4">
            <p className="font-mono text-xs break-all text-text-main">{item.name}</p>
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="inline font-semibold text-text-main">Tipo: </dt>
                <dd className="inline">{STORAGE_KIND_LABEL[item.kind]}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-text-main">Finalidade: </dt>
                <dd className="inline">{item.purpose}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-text-main">Duração: </dt>
                <dd className="inline">{item.duration}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      {/* A partir de telas médias: tabela; se precisar rolar, a área recebe foco pelo teclado. */}
      <div className="ui-table-wrap my-4 max-sm:hidden" role="region" aria-label={caption} tabIndex={0}>
        <table className="ui-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Tipo</th>
              <th scope="col">Finalidade</th>
              <th scope="col">Duração</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.name}>
                <td className="font-mono text-xs break-all text-text-main">{item.name}</td>
                <td>{STORAGE_KIND_LABEL[item.kind]}</td>
                <td>{item.purpose}</td>
                <td>{item.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function CookiesPage() {
  return (
    <LegalPageLayout
      current="/cookies"
      title="Preferências de Cookie"
      meta="Última revisão do texto em 10 de outubro de 2026"
      intro={
        <p>
          Esta página explica quais cookies e dados a Base SST guarda no seu navegador, para que servem e como você pode
          controlar o que é opcional. As escolhas feitas aqui valem para este navegador.
        </p>
      }
      toc={TOC}
      references={[OFFICIAL_SOURCES.anpdCookies, OFFICIAL_SOURCES.lgpd]}
    >
      <section id="o-que-sao" aria-labelledby="o-que-sao-title" className="legal-section">
        <h2 id="o-que-sao-title">1. O que são cookies e tecnologias semelhantes</h2>
        <p>
          Cookies são pequenos arquivos que o navegador guarda a pedido de um site e envia de volta a ele nas próximas
          requisições. O armazenamento local e o armazenamento da sessão são recursos semelhantes: guardam informações no
          navegador, mas não as enviam automaticamente ao site.
        </p>
        <p>A Base SST usa essas tecnologias em três categorias, descritas a seguir.</p>
      </section>

      <section id="essenciais" aria-labelledby="essenciais-title" className="legal-section">
        <h2 id="essenciais-title">2. Essenciais (sempre ativos)</h2>
        <p>
          São necessários para o login seguro e para registrar a sua escolha sobre o monitoramento. Os cookies de sessão só
          são criados quando você entra na sua conta, são inacessíveis a scripts da página e trafegam apenas por conexão
          segura. Como o serviço não funciona sem eles, não podem ser desativados nesta página.
        </p>
        <StorageTable items={ESSENTIAL_ITEMS} caption="Cookies e dados essenciais" />
      </section>

      <section id="recursos" aria-labelledby="recursos-title" className="legal-section">
        <h2 id="recursos-title">3. Recursos que você aciona</h2>
        <p>
          São criados somente quando você usa o recurso correspondente, como trocar o tema ou salvar um artigo em Minha
          Lista. Ficam apenas neste aparelho e não são enviados à Base SST nem a terceiros. Você pode apagá-los a qualquer
          momento na seção <a href="#preferencias" className="ui-link">Suas preferências</a>.
        </p>
        <StorageTable items={FEATURE_ITEMS} caption="Dados de recursos guardados no navegador" />
      </section>

      <section id="monitoramento" aria-labelledby="monitoramento-title" className="legal-section">
        <h2 id="monitoramento-title">4. Monitoramento de erros e desempenho (opcional)</h2>
        <p>
          Quando ativado nesta instalação e permitido por você, o serviço Sentry recebe relatórios de erros da aplicação,
          medições de desempenho de uma parte das visitas e gravações técnicas de uma parte das sessões, usadas para
          entender falhas. Nas gravações, todos os textos e campos de formulário são mascarados e as imagens e vídeos são
          bloqueados.
        </p>
        <p>
          Esse monitoramento depende do seu consentimento e não é iniciado antes dele. Sem permissão, nada é enviado ao
          Sentry.
        </p>
        <StorageTable items={MONITORING_ITEMS} caption="Dados do monitoramento opcional" />
      </section>

      <section id="preferencias" aria-labelledby="preferencias-title" className="legal-section">
        <h2 id="preferencias-title">5. Suas preferências</h2>
        <p>Revise ou altere sua escolha. A alteração é aplicada imediatamente.</p>
        <div className="mt-4">
          <CookiePreferences />
        </div>
      </section>

      <section id="efeitos" aria-labelledby="efeitos-title" className="legal-section">
        <h2 id="efeitos-title">6. Efeitos das suas escolhas</h2>
        <ul>
          <li>
            <strong>Permitir:</strong> o monitoramento passa a funcionar neste navegador, se estiver ativado nesta
            instalação.
          </li>
          <li>
            <strong>Não permitir:</strong> nenhum dado de monitoramento é enviado. Se o monitoramento estava em
            funcionamento, ele é encerrado imediatamente.
          </li>
          <li>
            <strong>Apagar minha escolha:</strong> o aviso de cookies volta a ser exibido para que você escolha novamente.
          </li>
          <li>
            <strong>Apagar dados locais:</strong> remove os dados de recursos deste aparelho, como Minha Lista e as
            preferências de tema e de leitura. Sua conta não é afetada.
          </li>
        </ul>
        <p>
          As escolhas ficam guardadas apenas neste navegador; em outro aparelho ou navegador, será necessário escolher
          novamente. Você também pode bloquear cookies nas configurações do navegador, mas, nesse caso, não será possível
          entrar na sua conta. Para saber como tratamos dados pessoais, consulte a{' '}
          <Link href="/privacidade" className="ui-link">
            Política de Privacidade
          </Link>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
