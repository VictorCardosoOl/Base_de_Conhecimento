
import React from 'react';

const OrgaosPublicosContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center border-l-4 border-blue-800">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Eventos de SST no Âmbito dos Órgãos Públicos</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Este guia detalha as regras específicas para envio de eventos de Saúde e Segurança no Trabalho (SST) para servidores públicos e funcionários sem vínculo empregatício no sistema eSocial.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Identificação de Funcionários Públicos</h2>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg mb-8">
                    <p className="mb-4">Funcionários públicos são identificados pelo <strong>Código de Categoria do Trabalhador</strong> na Tabela 01 do eSocial:</p>

                    <div className="overflow-x-auto mb-6">
                        <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                            <thead>
                                <tr className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                                    <th className="p-3 text-center border border-gray-200 dark:border-gray-700">Códigos</th>
                                    <th className="p-3 text-center border border-gray-200 dark:border-gray-700">Categoria</th>
                                    <th className="p-3 text-center border border-gray-200 dark:border-gray-700">Classificação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-3 text-center border border-gray-200 dark:border-gray-700">301-314</td>
                                    <td className="p-3 text-center border border-gray-200 dark:border-gray-700">Todos os códigos neste intervalo</td>
                                    <td className="p-3 text-center border border-gray-200 dark:border-gray-700">Funcionário Público</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="p-3 text-center border border-gray-200 dark:border-gray-700">
                                        <strong>Link oficial:</strong> <a href="https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-v-1.3/tabelas.html#01" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Tabela 01 - Clique aqui</a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded text-amber-900 dark:text-amber-100">
                        <p><strong>Nota Importante:</strong> Estagiários não possuem obrigatoriedade de envio de eventos de SST, conforme destaque do manual do eSocial.</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Regimes Previdenciários e Impacto nos Eventos</h2>
                <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg mb-8">
                    <p className="mb-4">A obrigatoriedade do envio de eventos de SST depende do regime previdenciário do servidor:</p>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                            <thead>
                                <tr className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                                    <th className="p-3 text-left border border-gray-200 dark:border-gray-700">Tipo de Servidor</th>
                                    <th className="p-3 text-left border border-gray-200 dark:border-gray-700">Regime Previdenciário</th>
                                    <th className="p-3 text-left border border-gray-200 dark:border-gray-700">Eventos Obrigatórios</th>
                                    <th className="p-3 text-left border border-gray-200 dark:border-gray-700">Eventos Dispensados</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">Empregado CLT</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">RGPS</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/30 font-bold">Todos (S-2210, S-2220, S-2240)</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">Nenhum</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">Servidor Estatutário</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">RGPS</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/30 font-bold">S-2210 e S-2240</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">S-2220</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">Servidor com RPPS instituído</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">RGPS</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/30 font-bold">S-2210 e S-2240</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">S-2220</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">Servidor Estatutário</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">RPPS</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">Nenhum</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-700">Todos</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded mt-6 border-l-4 border-yellow-500">
                        <h3 className="font-bold text-lg mb-2 text-yellow-800 dark:text-yellow-200">Diretriz Fundamental</h3>
                        <p className="mb-2">A obrigatoriedade deve ser avaliada <strong>individualmente</strong> para cada servidor, considerando:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Regime jurídico (celetista ou estatutário)</li>
                            <li>Regime previdenciário (RGPS ou RPPS)</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Diretrizes para Envio de Eventos de SST</h2>

                <div className="space-y-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="font-bold text-xl mb-3 text-blue-800 dark:text-blue-300">1. Empregados CLT (RGPS)</h3>
                        <div className="space-y-2">
                            <p><strong>Eventos obrigatórios:</strong> S-2210, S-2220 e S-2240</p>
                            <p><strong>Contexto:</strong> Contratação pela CLT (emprego público)</p>
                            <p><strong>Abragência:</strong> Todos os eventos de SST devem ser enviados</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="font-bold text-xl mb-3 text-blue-800 dark:text-blue-300">2. Servidores Estatutários (RGPS)</h3>
                        <div className="space-y-2">
                            <p><strong>Eventos obrigatórios:</strong> S-2210 e S-2240</p>
                            <p><strong>Eventos dispensados:</strong> S-2220</p>
                            <p><strong>Contexto:</strong> Regime estatutário vinculado ao RGPS</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="font-bold text-xl mb-3 text-blue-800 dark:text-blue-300">3. Servidores com RPPS instituído (RGPS)</h3>
                        <div className="space-y-2">
                            <p><strong>Eventos obrigatórios:</strong> S-2210 e S-2240</p>
                            <p><strong>Eventos dispensados:</strong> S-2220</p>
                            <p><strong>Contexto:</strong> RPPS instituído mas vinculação ao RGPS</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="font-bold text-xl mb-3 text-blue-800 dark:text-blue-300">4. Servidores Estatutários (RPPS)</h3>
                        <div className="space-y-2">
                            <p><strong>Obrigatoriedade:</strong> Nenhum evento de SST</p>
                            <p><strong>Exceção:</strong> Pode ser enviado para cumprimento da Nota Técnica 2/2014/CGNAL/DRPSP/SPPS/MPS</p>
                            <p><strong>Contexto:</strong> Regime estatutário vinculado a RPPS</p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-800">
                    <h3 className="font-bold text-lg mb-2 text-blue-900 dark:text-blue-100">Exceção Legal</h3>
                    <p className="mb-4">Para servidores vinculados a RPPS, o envio de eventos pode ser realizado para cumprimento do disposto na:</p>
                    <div className="bg-blue-100 dark:bg-blue-800/40 p-4 rounded italic">
                        <p className="font-bold mb-1">Nota Técnica 2/2014/CGNAL/DRPSP/SPPS/MPS</p>
                        <p>"As informações são obrigatórias só para segurados vinculados ao RGPS, mas é possível a informação relativa a servidores vinculados a RPPS..."</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Exemplo Prático</h2>

                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg mb-4">Cenário:</h3>
                    <p className="mb-6">Órgão público com regime estatutário e RPPS possui:</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-700 p-5 rounded-lg shadow-sm">
                            <h4 className="font-bold text-lg mb-3">2 Servidores</h4>
                            <ul className="space-y-2 mb-4">
                                <li>• Cargos em comissão</li>
                                <li>• Sem vínculo efetivo</li>
                                <li>• Vinculados ao <strong>RGPS</strong></li>
                            </ul>
                            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded text-green-800 dark:text-green-200 font-bold">
                                Eventos obrigatórios: S-2210 e S-2240
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-700 p-5 rounded-lg shadow-sm">
                            <h4 className="font-bold text-lg mb-3">Demais Servidores</h4>
                            <ul className="space-y-2 mb-4">
                                <li>• Vínculo estatutário</li>
                                <li>• Vinculados ao <strong>RPPS</strong></li>
                            </ul>
                            <div className="bg-gray-200 dark:bg-gray-600 p-3 rounded text-gray-800 dark:text-white font-bold">
                                Nenhum evento obrigatório
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-bold mb-2">Fundamentação Técnica:</h4>
                        <p>O PPP (Perfil Profissiográfico Previdenciário) e a CAT (Comunicação de Acidente de Trabalho) são obrigações aplicáveis exclusivamente a segurados do RGPS, substituídas pelo eSocial.</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Orientações para Implementação</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-green-500">
                        <h3 className="font-bold text-lg mb-2">Passo 1: Classificação</h3>
                        <p className="text-sm">Identificar o código de categoria (301-314) e regime previdenciário de cada servidor</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-green-500">
                        <h3 className="font-bold text-lg mb-2">Passo 2: Mapeamento</h3>
                        <p className="text-sm">Definir quais eventos são obrigatórios conforme tabela de diretrizes</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-green-500">
                        <h3 className="font-bold text-lg mb-2">Passo 3: Configuração</h3>
                        <p className="text-sm">Ajustar o sistema para envio seletivo conforme perfil de cada servidor</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-green-500">
                        <h3 className="font-bold text-lg mb-2">Passo 4: Validação</h3>
                        <p className="text-sm">Testar no ambiente Restrita (Teste) antes do envio à Produção</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: OrgaosPublicosContent
};
