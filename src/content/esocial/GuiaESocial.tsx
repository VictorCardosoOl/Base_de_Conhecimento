
import React from 'react';

const GuiaESocialContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">eSocial</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Sistema de Escrituração Digital das Obrigações Fiscais, Previdenciárias e Trabalhistas
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">
                    1. Fundamentação Legal e Histórico
                </h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
                    <h3 className="text-xl font-semibold mt-0 mb-4">Criação e Marco Legal</h3>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li><strong>Data de fundação:</strong> 11 de dezembro de 2014</li>
                        <li><strong>Órgãos envolvidos:</strong> Receita Federal, INSS, Caixa Econômica Federal e Ministério do Trabalho</li>
                        <li><strong>Base tecnológica:</strong> Sistema Público de Escrituração Digital (SPED)</li>
                        <li><strong>Obrigatoriedade geral:</strong> 8 de janeiro de 2018 (com exceção inicial para eventos de SST)</li>
                    </ul>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded border-l-4 border-blue-600">
                        <h4 className="text-lg font-semibold mt-0 mb-2 text-blue-900 dark:text-blue-100">Principais Objetivos</h4>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Eliminar a multiplicidade de declarações</li>
                            <li>Reduzir custos de compliance para empresas</li>
                            <li>Aprimorar a fiscalização governamental</li>
                            <li>Garantir direitos trabalhistas e previdenciários</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">
                    2. Cronograma Detalhado de Implantação
                </h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
                    <h3 className="text-xl font-semibold mt-0 mb-6">Fases de Implementação</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Fase 1 - Eventos de Tabela</h4>
                            <p className="text-sm">Informações cadastrais do empregador</p>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Fase 2 - Eventos Não Periódicos</h4>
                            <p className="text-sm">Admissões, afastamentos e demissões</p>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Fase 3 - Eventos Periódicos</h4>
                            <p className="text-sm">Folhas de pagamento</p>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Fase 4 - Eventos de SST</h4>
                            <p className="text-sm">Saúde e Segurança no Trabalho</p>
                        </div>
                    </div>

                    <h3 className="text-xl font-semibold mb-4">Cronograma Específico para SST</h3>
                    <p className="text-sm text-gray-500 mb-4">(Portaria SEPRT/RFB/ME nº 71/2021)</p>

                    <div className="overflow-x-auto mb-8">
                        <table className="w-full border-collapse shadow-sm">
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th className="p-4 text-left w-[10%]">Grupo</th>
                                    <th className="p-4 text-left w-[60%]">Perfil das Empresas</th>
                                    <th className="p-4 text-left w-[30%]">Data Limite</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="p-4">1</td>
                                    <td className="p-4">Faturamento anual superior a R$78 milhões</td>
                                    <td className="p-4">13/10/2021</td>
                                </tr>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="p-4">2</td>
                                    <td className="p-4">Entidades com faturamento até R$78 milhões (não optantes pelo Simples Nacional)</td>
                                    <td className="p-4">10/01/2022</td>
                                </tr>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="p-4">3</td>
                                    <td className="p-4">Optantes pelo Simples Nacional, empregadores PF (exceto doméstico), produtor rural PF e entidades sem fins lucrativos</td>
                                    <td className="p-4">10/01/2022</td>
                                </tr>
                                <tr>
                                    <td className="p-4">4</td>
                                    <td className="p-4">Órgãos públicos e organizações internacionais</td>
                                    <td className="p-4">11/07/2022</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 border-l-4 border-amber-500 rounded my-8">
                    <h4 className="text-lg font-semibold mt-0 mb-2 text-amber-700 dark:text-amber-300">Situação Atual</h4>
                    <p>Desde 2022, a obrigatoriedade é universal para todas as empresas, com exceção de alguns órgãos públicos que possuem método de transmissão diferenciado.</p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">
                    3. eSocial Simplificado (S-1.0)
                </h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
                    <h3 className="text-xl font-semibold mt-0 mb-6">Principais Mudanças</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="border-l-4 border-green-500 pl-4">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Redução de Burocracia</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Eliminação de campos duplicados</li>
                                <li>Substituição da RAIS e CAGED</li>
                                <li>Simplificação de layouts</li>
                            </ul>
                        </div>

                        <div className="border-l-4 border-green-500 pl-4">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Benefícios</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Menor carga de trabalho para empresas</li>
                                <li>Redução de erros no preenchimento</li>
                                <li>Processamento mais rápido pelo governo</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded mt-5">
                        <h4 className="text-lg font-semibold mt-0 mb-2 text-green-700 dark:text-green-300">Impacto na Rotina</h4>
                        <p>As empresas passaram a enviar aproximadamente 30% menos informações, mantendo toda a qualidade dos dados necessários para fiscalização.</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">
                    4. Impacto nas Relações de Trabalho
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <h3 className="text-xl font-semibold mt-0 mb-4">Para os Trabalhadores</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Transparência:</strong> Registro imediato de admissões, alterações salariais e afastamentos</li>
                            <li><strong>Histórico unificado:</strong> Facilita comprovação para aposentadoria especial</li>
                            <li><strong>Garantia de direitos:</strong> FGTS, INSS e seguro-desemprego com menos inconsistências</li>
                            <li><strong>Banco de dados:</strong> Informações sobre exames médicos, condições de trabalho e acidentes</li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <h3 className="text-xl font-semibold mt-0 mb-4">Para as Empresas</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Fiscalização integrada:</strong> Cruzamento automático de informações entre órgãos</li>
                            <li><strong>Combate à sonegação:</strong> Identificação mais eficiente de irregularidades</li>
                            <li><strong>Redução de custos:</strong> Eliminação de múltiplos envios para diferentes sistemas</li>
                            <li><strong>Segurança jurídica:</strong> Registro oficial de todas as movimentações trabalhistas</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">
                    5. Dados Coletados e LGPD
                </h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
                    <h3 className="text-xl font-semibold mt-0 mb-6">Categorias de Informações</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <h4 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Dados Pessoais</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>CPF</li>
                                <li>Nome completo</li>
                                <li>Data de nascimento</li>
                                <li>Endereço</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Dados Contratuais</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Data de admissão</li>
                                <li>Cargo e função</li>
                                <li>Salário e benefícios</li>
                                <li>Jornada de trabalho</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Dados de SST</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Exames médicos (ASO)</li>
                                <li>Comunicação de Acidentes (CAT)</li>
                                <li>Condições ambientais</li>
                                <li>Exposição a agentes nocivos</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded border-l-4 border-purple-500 mt-8">
                        <h4 className="text-lg font-semibold mt-0 mb-2 text-purple-700 dark:text-purple-300">Conformidade com a LGPD</h4>
                        <p className="mb-2">O tratamento dos dados no eSocial segue rigorosamente os princípios da Lei Geral de Proteção de Dados (LGPD):</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Finalidade específica e legítima</li>
                            <li>Necessidade e adequação</li>
                            <li>Transparência</li>
                            <li>Segurança e prevenção</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">
                    6. Integração com o Sigo Web
                </h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
                    <h3 className="text-xl font-semibold mt-0 mb-4">Eventos de SST Transmitidos</h3>
                    <p className="mb-6">O sistema Sigo Web realiza a transmissão automática dos seguintes eventos para o eSocial:</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 border-t-4 border-t-blue-600">
                            <h4 className="text-lg font-semibold mt-0 mb-2">S-2210</h4>
                            <p className="font-medium mb-2">Comunicação de Acidente de Trabalho</p>
                            <p className="text-sm">Deve ser enviado em até 1 dia útil após o acidente, contendo dados do acidentado, tipo de lesão e CID.</p>
                        </div>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 border-t-4 border-t-blue-600">
                            <h4 className="text-lg font-semibold mt-0 mb-2">S-2220</h4>
                            <p className="font-medium mb-2">Monitoramento da Saúde do Trabalhador</p>
                            <p className="text-sm">Registra todos os exames ocupacionais realizados, vinculados ao PCMSO da empresa.</p>
                        </div>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 border-t-4 border-t-blue-600">
                            <h4 className="text-lg font-semibold mt-0 mb-2">S-2221</h4>
                            <p className="font-medium mb-2">Exame Toxicológico</p>
                            <p className="text-sm">Obrigatório para motoristas profissionais (Lei 13.103/2015). Resultados positivos geram bloqueio automático.</p>
                        </div>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 border-t-4 border-t-blue-600">
                            <h4 className="text-lg font-semibold mt-0 mb-2">S-2240</h4>
                            <p className="font-medium mb-2">Condições Ambientais do Trabalho</p>
                            <p className="text-sm">Comunica os riscos ambientais identificados no PGR e as medidas de controle adotadas.</p>
                        </div>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 border-t-4 border-t-blue-600">
                            <h4 className="text-lg font-semibold mt-0 mb-2">S-3000</h4>
                            <p className="font-medium mb-2">Exclusão de Eventos</p>
                            <p className="text-sm">Utilizado para tornar sem efeito (excluir) um evento que foi enviado incorretamente.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: GuiaESocialContent
};
