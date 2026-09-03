import React from 'react';

const IntroducaoSSTContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Saúde e Segurança no Trabalho (SST)</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    O guia fundamental para entender como proteger a integridade dos colaboradores e garantir a conformidade legal da empresa.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">O que é SST?</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-4 text-lg">
                        <strong>Saúde e Segurança no Trabalho (SST)</strong> é um conjunto multidisciplinar de normas, procedimentos e práticas técnicas exigidas legalmente.
                    </p>
                    <p className="mb-4">
                        Seu objetivo vai muito além de evitar multas: trata-se de criar um ambiente onde a integridade física e mental do trabalhador seja preservada, prevenindo acidentes e doenças ocupacionais.
                    </p>

                    <h3 className="font-bold text-lg mt-6 mb-3 text-blue-800 dark:text-blue-300">Pilares Fundamentais:</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <li className="flex items-start">
                            <span className="text-blue-500 mr-2">✓</span>
                            <span><strong>Prevenção:</strong> Antecipar e controlar riscos ambientais.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-500 mr-2">✓</span>
                            <span><strong>Legalidade:</strong> Cumprir as exigências do Ministério do Trabalho e Previdência.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-500 mr-2">✓</span>
                            <span><strong>Produtividade:</strong> Reduzir custos com afastamentos e aumentar a qualidade de vida.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-500 mr-2">✓</span>
                            <span><strong>Cultura:</strong> Promover a conscientização coletiva sobre segurança.</span>
                        </li>
                    </ul>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Principais Normas Regulamentadoras (NRs)</h2>
                <p className="mb-6">As NRs são as leis que regem a SST no Brasil. Abaixo, detalhamos as que mais impactam o dia a dia das empresas:</p>

                <div className="space-y-6">
                    {/* NR-01 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition hover:shadow-md border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center mb-3">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-bold px-3 py-1 rounded-full mr-3">NR-01</span>
                            <h3 className="text-xl font-bold m-0 text-gray-900 dark:text-white">Disposições Gerais e GRO</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                            A norma "mãe". Ela estabelece o <strong>Gerenciamento de Riscos Ocupacionais (GRO)</strong> e obriga a elaboração do <strong>PGR (Programa de Gerenciamento de Riscos)</strong>, que é o inventário completo dos perigos da empresa.
                        </p>
                    </div>

                    {/* NR-05 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition hover:shadow-md border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center mb-3">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-bold px-3 py-1 rounded-full mr-3">NR-05</span>
                            <h3 className="text-xl font-bold m-0 text-gray-900 dark:text-white">CIPA (Comissão Interna de Prevenção de Acidentes e Assédio)</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                            Define a obrigatoriedade de constituir uma comissão de funcionários para atuar na prevenção. O dimensionamento depende do grau de risco e número de funcionários.
                        </p>
                        <ul className="list-disc pl-5 text-sm space-y-1 text-gray-500 dark:text-gray-400">
                            <li>Inclui obrigatoriedade de combate ao assédio sexual e moral.</li>
                            <li>Empresas menores podem indicar apenas um "Designado CIPA".</li>
                        </ul>
                    </div>

                    {/* NR-07 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition hover:shadow-md border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center mb-3">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-bold px-3 py-1 rounded-full mr-3">NR-07</span>
                            <h3 className="text-xl font-bold m-0 text-gray-900 dark:text-white">PCMSO (Saúde Ocupacional)</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                            Programa de Controle Médico de Saúde Ocupacional. É aqui que são definidos os exames médicos (Admissional, Periódico, Demissional) e emitidos os ASOs (Atestados de Saúde Ocupacional).
                        </p>
                    </div>

                    {/* NR-15 e NR-16 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg border-t-4 border-red-500">
                            <div className="flex items-center mb-3">
                                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 text-xs font-bold px-3 py-1 rounded-full mr-3">NR-15</span>
                                <h3 className="text-lg font-bold m-0">Insalubridade</h3>
                            </div>
                            <p className="text-sm">
                                Trata das atividades que expõem o trabalhador a agentes nocivos (ruído, calor, químicos, biológicos) acima dos limites de tolerância. Gera adicional de 10%, 20% ou 40%.
                            </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg border-t-4 border-red-500">
                            <div className="flex items-center mb-3">
                                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 text-xs font-bold px-3 py-1 rounded-full mr-3">NR-16</span>
                                <h3 className="text-lg font-bold m-0">Periculosidade</h3>
                            </div>
                            <p className="text-sm">
                                Foca em atividades com risco iminente de morte, como explosivos, inflamáveis, eletricidade ou segurança patrimonial. Gera adicional de 30% sobre o salário base.
                            </p>
                        </div>
                    </div>

                    {/* NR-17 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition hover:shadow-md border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center mb-3">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-bold px-3 py-1 rounded-full mr-3">NR-17</span>
                            <h3 className="text-xl font-bold m-0 text-gray-900 dark:text-white">Ergonomia</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Visa adaptar o trabalho às características psicofisiológicas dos trabalhadores, proporcionando conforto, segurança e desempenho eficiente. Envolve desde mobiliário até organização do trabalho.
                        </p>
                    </div>

                    {/* NR-35 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm transition hover:shadow-md border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center mb-3">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-bold px-3 py-1 rounded-full mr-3">NR-35</span>
                            <h3 className="text-xl font-bold m-0 text-gray-900 dark:text-white">Trabalho em Altura</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Estabelece requisitos mínimos para qualquer trabalho realizado acima de <strong>2,00 metros</strong> do nível inferior, onde haja risco de queda. Exige treinamento e EPI específico (cinto paraquedista).
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Por que a SST é Vital?</h2>
                <div className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 rounded-lg shadow-sm">
                    <p className="mb-4 text-lg">
                        Investir em SST não é apenas uma obrigação burocrática, é uma <strong>estratégia de sustentabilidade</strong> do negócio.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="text-center p-4">
                            <div className="text-4xl mb-2">🛡️</div>
                            <h4 className="font-bold mb-2">Proteção Legal</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Evita multas pesadas e processos trabalhistas regressivos.</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="text-4xl mb-2">📉</div>
                            <h4 className="font-bold mb-2">Redução de Custos</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Diminui o absenteísmo e os custos com FAP/RAT na folha de pagamento.</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="text-4xl mb-2">⭐</div>
                            <h4 className="font-bold mb-2">Reputação</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Empresas seguras atraem e retêm melhores talentos.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: IntroducaoSSTContent
};
