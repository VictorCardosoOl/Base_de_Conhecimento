
import React from 'react';

const S2210Content = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Bem-vindo à Comunicação de Acidente de Trabalho</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Este conteúdo foi elaborado para você compreender a importância da Comunicação de Acidente de Trabalho (CAT) e como ela é feita através do evento S-2210 no eSocial. Um processo essencial para garantir os direitos do trabalhador e manter a empresa em conformidade com a legislação.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">O que é o Evento S-2210?</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-4">O evento <strong>S-2210</strong> é utilizado para comunicar oficialmente um <strong>acidente de trabalho</strong>, uma <strong>doença ocupacional</strong> ou um <strong>acidente de trajeto</strong>, ainda que não haja afastamento do colaborador.</p>
                    <p className="mb-2">Essa comunicação é obrigatória para:</p>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                        <li>Empregadores do regime CLT;</li>
                        <li>Órgãos públicos que contratam servidores pelo RGPS;</li>
                        <li>OGMO (Órgão Gestor de Mão de Obra);</li>
                        <li>Sindicatos que atuam com trabalhadores avulsos.</li>
                    </ul>
                    <p>No sistema do eSocial, o número de recibo do evento passa a ser o <strong>número oficial da CAT</strong>, eliminando a necessidade de emissão em papel.</p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Base Legal e Normas Relacionadas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="text-xl font-bold mt-0 mb-3 text-blue-800 dark:text-blue-300">Lei nº 8.213/1991 - Art. 22</h3>
                        <p className="mb-2">Estabelece a obrigatoriedade da comunicação do acidente de trabalho à Previdência Social até o primeiro dia útil seguinte ao da ocorrência.</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">O não cumprimento implica em penalidade ao empregador.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="text-xl font-bold mt-0 mb-3 text-blue-800 dark:text-blue-300">CLT - Art. 169</h3>
                        <p className="mb-2">Prevê a notificação compulsória das doenças profissionais e das relacionadas às condições especiais de trabalho.</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Complementa a legislação previdenciária com foco na saúde ocupacional.</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Impacto Direto para o Trabalhador</h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8 overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Direitos Garantidos com a Emissão da CAT</h3>
                    <div className="p-6">
                        <p className="mb-4">A CAT é o documento que formaliza o acidente ou doença como sendo de natureza ocupacional. Sua emissão garante ao trabalhador os seguintes direitos:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Auxílio por Incapacidade Temporária Acidentária (B91):</strong> O trabalhador passa a receber pelo INSS a partir do 16º dia de afastamento.</li>
                            <li><strong>Estabilidade Provisória:</strong> Ao retornar de um afastamento superior a 15 dias por acidente de trabalho, o empregado tem estabilidade de 12 meses.</li>
                            <li><strong>FGTS Durante o Afastamento:</strong> O empregador deve continuar depositando o FGTS durante todo o período.</li>
                            <li><strong>Aposentadoria por Incapacidade Permanente ou Pensão por Morte:</strong> Em caso de óbito ou invalidez permanente, a CAT é base essencial para garantir esses benefícios.</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Consequências da Não Comunicação</h3>
                    <div className="p-6">
                        <p className="mb-4">Deixar de transmitir o evento S-2210 acarreta penalidades:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li><strong>Multa:</strong> Pode variar entre o limite mínimo e o limite máximo do salário de contribuição, conforme os artigos 286 e 336 do Decreto nº 3.048/1999.</li>
                            <li><strong>Multa Agravada:</strong> Em caso de reincidência, a penalidade pode ser ampliada.</li>
                        </ul>
                        <p className="bg-red-50 dark:bg-red-900/20 p-4 rounded text-red-800 dark:text-red-200 border-l-4 border-red-500"><strong>Responsabilidade Exclusiva:</strong> A obrigação de envio é da empresa ou dos órgãos competentes (OGMO, sindicato, etc.).</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Detalhes Técnicos do Evento no Sistema</h2>
                <p className="mb-6">O evento S-2210 exige preenchimento rigoroso com base em tabelas do eSocial. Abaixo, apresentamos as mais relevantes:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 01</h4>
                        <p className="font-semibold mb-2">Categoria de Trabalhador</p>
                        <p className="text-sm">Exemplo: 101 – Empregado, 111 – Trabalhador Temporário.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 05</h4>
                        <p className="font-semibold mb-2">Tipo de Inscrição</p>
                        <p className="text-sm">Define o tipo de local do acidente (CNPJ, CAEPF, CNO).</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 13</h4>
                        <p className="font-semibold mb-2">Parte do Corpo Atingida</p>
                        <p className="text-sm">Exemplo: cabeça, tronco, membros superiores/inferiores.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 14</h4>
                        <p className="font-semibold mb-2">Agente Causador</p>
                        <p className="text-sm">Exemplo: ferramenta, máquina, produto químico, veículo.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 15</h4>
                        <p className="font-semibold mb-2">Situação Geradora</p>
                        <p className="text-sm">Exemplo: queda, explosão, esforço físico, contato com material cortante.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 17</h4>
                        <p className="font-semibold mb-2">Natureza da Lesão</p>
                        <p className="text-sm">Exemplo: fratura, queimadura, corte, contusão, entorse.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500 col-span-1 md:col-span-2 lg:col-span-1">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 20</h4>
                        <p className="font-semibold mb-2">Tipo de Logradouro</p>
                        <p className="text-sm">Preenchimento correto do endereço onde ocorreu o acidente.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: S2210Content
};
