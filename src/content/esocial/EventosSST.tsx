
import React from 'react';

const EventosSSTContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-gradient-to-br from-blue-500 to-blue-800 p-8 rounded-xl text-center text-white shadow-lg mb-10">
                <h1 className="text-3xl font-bold m-0 text-white border-none">Eventos de SST no eSocial</h1>
                <p className="mt-2 text-lg text-blue-100 max-w-3xl mx-auto">
                    Os eventos de Segurança e Saúde no Trabalho (SST) no eSocial substituem formulários tradicionais como a CAT e o PPP, garantindo conformidade legal e registro eletrônico unificado.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Definição Completa</h2>
                <div className="bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-lg shadow-sm border-l-4 border-blue-500 mb-6">
                    <p className="mb-4">São eventos obrigatórios para registro de informações trabalhistas relacionadas à saúde e segurança:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li><strong>S-2210</strong> - Comunicação de Acidente de Trabalho (Substitui a CAT física)</li>
                        <li><strong>S-2220</strong> - Monitoramento da Saúde do Trabalhador (Equivalente ao PPP)</li>
                        <li><strong>S-2221</strong> - Exame Toxicológico (Obrigatório para motoristas profissionais)</li>
                        <li><strong>S-2240</strong> - Condições Ambientais do Trabalho (Base para aposentadoria especial)</li>
                    </ul>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <h4 className="text-lg font-semibold mt-0 mb-3 text-blue-800 dark:text-blue-300">Finalidade Principal</h4>
                            <ul className="list-none space-y-2">
                                <li>- Substituição de formulários físicos (CAT, PPP)</li>
                                <li>- Histórico digitalizado de exposição a riscos</li>
                                <li>- Base para financiamento da aposentadoria especial</li>
                                <li>- Integração com demais eventos do eSocial</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <h4 className="text-lg font-semibold mt-0 mb-3 text-blue-800 dark:text-blue-300">Impactos Jurídicos</h4>
                            <ul className="list-none space-y-2">
                                <li>- Eliminação de autuações por falta de PPP/CAT</li>
                                <li>- Comprovação de conformidade com NRs</li>
                                <li>- Redução de passivos trabalhistas</li>
                                <li>- Fundamentação para defesas judiciais</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 bg-blue-600 text-white p-3 text-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 text-center">
                        Prazo: 1 dia útil após o acidente
                    </div>
                    <div className="pb-8">
                        <h4 className="text-xl font-bold mt-0 mb-2 text-blue-900 dark:text-blue-100">S-2210</h4>
                        <p className="font-semibold mb-4 text-gray-700 dark:text-gray-300">Comunicação de Acidente de Trabalho</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Substitui a CAT física (Comunicação de Acidente de Trabalho)</li>
                            <li>Obrigatório para todos os tipos de acidente (típico, de trajeto, doença ocupacional)</li>
                            <li>Informações essenciais:
                                <ul className="list-none mt-1 ml-2 space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>- Data, hora e local do acidente</li>
                                    <li>- Parte do corpo afetada</li>
                                    <li>- CID-10 relacionado</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-bold">Obrigatoriedade: Imediata</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 bg-blue-600 text-white p-3 text-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 text-center">
                        Inclui ASO, exames complementares e histórico médico ocupacional
                    </div>
                    <div className="pb-8">
                        <h4 className="text-xl font-bold mt-0 mb-2 text-blue-900 dark:text-blue-100">S-2220</h4>
                        <p className="font-semibold mb-4 text-gray-700 dark:text-gray-300">Monitoramento da Saúde do Trabalhador</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Registra todo o ciclo de exames ocupacionais</li>
                            <li>Substitui o Perfil Profissiográfico Previdenciário (PPP)</li>
                            <li>Tipos de exames abrangidos:
                                <ul className="list-none mt-1 ml-2 space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>- Admissional, periódico, retorno ao trabalho</li>
                                    <li>- Mudança de função, demissional</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-bold">Prazo: 15º dia do mês subsequente</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 bg-blue-600 text-white p-3 text-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 text-center">
                        Custos: Empresa arca com todos os exames | Periodicidade: A cada 2,5 anos
                    </div>
                    <div className="pb-8">
                        <h4 className="text-xl font-bold mt-0 mb-2 text-blue-900 dark:text-blue-100">S-2221</h4>
                        <p className="font-semibold mb-4 text-gray-700 dark:text-gray-300">Exame Toxicológico</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Exigido pela Lei 13.103/2015 (Lei do Caminhoneiro)</li>
                            <li>Categorias obrigatórias:
                                <ul className="list-none mt-1 ml-2 space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>- Motoristas profissionais (CNH C, D e E)</li>
                                    <li>- Operadores de máquinas perigosas</li>
                                </ul>
                            </li>
                            <li>Consequências de resultado positivo:
                                <ul className="list-none mt-1 ml-2 space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>- Afastamento imediato das atividades</li>
                                    <li>- Bloqueio no sistema até regularização</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-bold">Amostra: Cabelo/Unha</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 bg-blue-600 text-white p-3 text-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 text-center">
                        Tabela 24 do eSocial com 1.200+ agentes nocivos | Atualização trimestral obrigatória
                    </div>
                    <div className="pb-8">
                        <h4 className="text-xl font-bold mt-0 mb-2 text-blue-900 dark:text-blue-100">S-2240</h4>
                        <p className="font-semibold mb-4 text-gray-700 dark:text-gray-300">Condições Ambientais do Trabalho</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Mapeamento completo de agentes:
                                <ul className="list-none mt-1 ml-2 space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>- Físicos (ruído, calor, vibração)</li>
                                    <li>- Químicos (fumos, poeiras, gases)</li>
                                    <li>- Biológicos (vírus, bactérias, fungos)</li>
                                </ul>
                            </li>
                            <li>Informações sobre proteção:
                                <ul className="list-none mt-1 ml-2 space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>- EPIs fornecidos</li>
                                    <li>- EPCs instalados</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-bold">Base legal: Dec. 3.048/99</span>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Observações Técnicas Críticas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500 hover:-translate-y-1 hover:shadow-md transition-all">
                        <h4 className="text-lg font-semibold mt-0 mb-3 text-blue-800 dark:text-blue-300">Regras Gerais</h4>
                        <ul className="space-y-2 text-sm">
                            <li>• Estagiários (901) e aprendizes (1401) estão isentos</li>
                            <li>• Servidores públicos (RPPS): obrigatório apenas se previsto em norma específica</li>
                            <li>• Empresas sem exposição a riscos: envio do S-2240 com declaração negativa</li>
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500 hover:-translate-y-1 hover:shadow-md transition-all">
                        <h4 className="text-lg font-semibold mt-0 mb-3 text-blue-800 dark:text-blue-300">Integração de Dados</h4>
                        <ul className="space-y-2 text-sm">
                            <li>• S-2220 utiliza dados do S-2240 para compor o histórico</li>
                            <li>• S-2210 aciona automaticamente o S-2220 quando necessário</li>
                            <li>• Eventos interligados: S-2190, S-2300 e S-2400</li>
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500 hover:-translate-y-1 hover:shadow-md transition-all">
                        <h4 className="text-lg font-semibold mt-0 mb-3 text-blue-800 dark:text-blue-300">Responsabilidades</h4>
                        <ul className="space-y-2 text-sm">
                            <li>• Médico coordenador: validação técnica dos eventos</li>
                            <li>• RH: envio dentro dos prazos legais</li>
                            <li>• SESMT: fornecimento de dados técnicos</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Obrigatoriedade por Categoria de Trabalhador</h2>
                <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full border-collapse bg-white dark:bg-gray-800">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="p-4 text-left border-b border-blue-700">Código</th>
                                <th className="p-4 text-left border-b border-blue-700">Categoria</th>
                                <th className="p-4 text-left border-b border-blue-700">S-2210</th>
                                <th className="p-4 text-left border-b border-blue-700">S-2220</th>
                                <th className="p-4 text-left border-b border-blue-700">S-2221</th>
                                <th className="p-4 text-left border-b border-blue-700">S-2240</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { code: '101', cat: 'Empregado - CLT', s2210: 'Obrigatório', s2220: 'Obrigatório', s2221: 'Condicional*', s2240: 'Obrigatório' },
                                { code: '102', cat: 'Trabalhador Rural', s2210: 'Obrigatório', s2220: 'Obrigatório', s2221: 'Condicional*', s2240: 'Obrigatório' },
                                { code: '103', cat: 'Doméstico', s2210: 'Obrigatório', s2220: 'Obrigatório', s2221: 'Não', s2240: 'Obrigatório' },
                                { code: '104', cat: 'Aprendiz', s2210: 'Obrigatório', s2220: 'Obrigatório', s2221: 'Não', s2240: 'Obrigatório' },
                                { code: '105', cat: 'Avulso', s2210: 'Obrigatório', s2220: 'Obrigatório', s2221: 'Condicional*', s2240: 'Obrigatório' },
                                { code: '106', cat: 'Temporário', s2210: 'Obrigatório', s2220: 'Obrigatório', s2221: 'Condicional*', s2240: 'Obrigatório' },
                                { code: '111', cat: 'Cooperado', s2210: 'Obrigatório', s2220: 'Obrigatório', s2221: 'Condicional*', s2240: 'Obrigatório' },
                                { code: '201', cat: 'Servidor Público', s2210: 'Obrigatório', s2220: 'Obrigatório', s2221: 'Condicional*', s2240: 'Obrigatório' },
                                { code: '301', cat: 'Empresário', s2210: 'Facultativo', s2220: 'Facultativo', s2221: 'Não', s2240: 'Facultativo' },
                                { code: '401', cat: 'Dirigente', s2210: 'Facultativo', s2220: 'Facultativo', s2221: 'Não', s2240: 'Facultativo' },
                                { code: '701', cat: 'Autônomo', s2210: 'Facultativo', s2220: 'Facultativo', s2221: 'Não', s2240: 'Facultativo' },
                                { code: '721', cat: 'Dirigente Sindical', s2210: 'Facultativo', s2220: 'Facultativo', s2221: 'Não', s2240: 'Facultativo' },
                                { code: '731', cat: 'Trab. Cooperado', s2210: 'Facultativo', s2220: 'Facultativo', s2221: 'Condicional*', s2240: 'Obrigatório' },
                                { code: '901', cat: 'Estagiário', s2210: 'Não', s2220: 'Não', s2221: 'Não', s2240: 'Não' },
                                { code: '1401', cat: 'Aprendiz', s2210: 'Obrigatório', s2220: 'Obrigatório', s2221: 'Não', s2240: 'Obrigatório' },
                            ].map((row, index) => (
                                <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4">{row.code}</td>
                                    <td className="p-4">{row.cat}</td>
                                    <td className="p-4">{row.s2210}</td>
                                    <td className="p-4">{row.s2220}</td>
                                    <td className="p-4">{row.s2221}</td>
                                    <td className="p-4">{row.s2240}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-sm text-gray-500 italic">
                    <p>* Condicional: Obrigatório apenas para motoristas profissionais (Lei 13.103/2015)</p>
                    <p>Fonte: Instrução Normativa RFB nº 2.100/2022 e Manual do eSocial v. 1.7</p>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Consequências do Descumprimento</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all">
                        <h4 className="text-lg font-semibold mt-0 mb-3 text-red-600 dark:text-red-400">Multas Administrativas</h4>
                        <ul className="space-y-2 text-sm">
                            <li>• Atraso no S-2210: R$ 1.000,00 + R$ 100,00/dia</li>
                            <li>• Omisssão do S-2240: Até R$ 8.257,40 por trabalhador</li>
                            <li>• Erros recorrentes: Inclusão no "Cadastro de Empresas Infratoras"</li>
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all">
                        <h4 className="text-lg font-semibold mt-0 mb-3 text-red-600 dark:text-red-400">Riscos Trabalhistas</h4>
                        <ul className="space-y-2 text-sm">
                            <li>• Invalidação de demissões por justa causa</li>
                            <li>• Reversão do ônus da prova em ações judiciais</li>
                            <li>• Perda de direito a recursos administrativos</li>
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all">
                        <h4 className="text-lg font-semibold mt-0 mb-3 text-red-600 dark:text-red-400">Impactos Previdenciários</h4>
                        <ul className="space-y-2 text-sm">
                            <li>• Perda do direito à aposentadoria especial</li>
                            <li>• Reclassificação de grau de incapacidade</li>
                            <li>• Cobrança retroativa de diferenças de GFIP</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: EventosSSTContent
};
