
import React from 'react';

const FuncionariosDeclarantesContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Identificação no eSocial</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Este guia explica as regras de identificação de funcionários e declarantes para integração com o eSocial.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Funcionários</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500 mb-8">
                    <p className="mb-6">No eSocial, os funcionários têm como <strong>identificador obrigatório o CPF</strong>, com as seguintes regras:</p>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-lg mb-3 text-blue-900 dark:text-blue-200">Regras Chave:</h4>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Um CPF pode ter múltiplos vínculos com o mesmo declarante</li>
                            <li>Cada vínculo é identificado por um número de matrícula único</li>
                            <li>A matrícula é obrigatória para eventos de SST</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8 overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Casos Especiais - TSVE (Trabalhador Sem Vínculo)</h3>
                    <div className="p-6">
                        <p className="mb-4">Quando a matrícula não foi informada no evento S-2300:</p>

                        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-lg border-l-4 border-amber-500 mb-6">
                            <h4 className="font-bold text-lg mb-3 text-amber-800 dark:text-amber-200">Procedimento Obrigatório:</h4>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Acessar <strong>Funcionários » Aba Dados Pessoais</strong></li>
                                <li>Habilitar a opção <strong>"TSVE sem Matrícula"</strong></li>
                                <li>Selecionar o código da <strong>Categoria do Trabalhador</strong> (Tabela 01 do eSocial)</li>
                            </ol>
                        </div>

                        <h4 className="font-bold text-lg mb-3">Regras de Matrícula:</h4>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Deve corresponder à matrícula informada nos eventos S-2190, S-2200 ou S-2300</li>
                            <li>Transferências entre departamentos <strong>não alteram</strong> a matrícula</li>
                            <li>Readmissão gera <strong>nova matrícula</strong> (novo vínculo)</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Gerenciamento de Matrículas no Sigo®</h3>
                    <div className="p-6">
                        <p className="mb-2">A matrícula é informada em:</p>
                        <p className="mb-6 font-semibold bg-gray-100 dark:bg-gray-700 p-2 rounded inline-block">Funcionários » Aba Registros de Admissões</p>

                        <h4 className="font-bold text-lg mb-3">Fluxo para Admissão/Readmissão:</h4>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>Criar registro de admissão</li>
                            <li>Preencher número de matrícula</li>
                            <li>Ativar vínculo do trabalhador</li>
                        </ol>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Declarantes</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="font-bold text-lg mb-2">Pessoa Jurídica</h3>
                        <p className="mb-2">Identificada apenas pelo <strong>CNPJ</strong></p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No XML: &#123;nrInsc&#125; = CNPJ-Raiz (8 posições)</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="font-bold text-lg mb-2">Pessoa Física</h3>
                        <p className="mb-2">Identificada apenas pelo <strong>CPF</strong></p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Utilizar <strong>CAEPF</strong> como estabelecimento</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="font-bold text-lg mb-2">Administração Pública</h3>
                        <p className="mb-2">Identificada pelo <strong>CNPJ completo (14 posições)</strong></p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Exige parametrização especial</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8 overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Regras Específicas para Declarantes</h3>
                    <div className="p-6 overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 text-left">
                                    <th className="p-3 border border-gray-200 dark:border-gray-600">Tipo</th>
                                    <th className="p-3 border border-gray-200 dark:border-gray-600">Identificador</th>
                                    <th className="p-3 border border-gray-200 dark:border-gray-600">Casos Aplicáveis</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="p-3 border border-gray-200 dark:border-gray-600 font-semibold">Pessoa Física com Atividade Econômica</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-600">CAEPF (antigo CEI)</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-600">
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            <li>Contribuinte individual (408-1)</li>
                                            <li>Produtor rural (412-0)</li>
                                            <li>Segurado especial (402-2)</li>
                                            <li>Encarregado de consórcios rurais (228-3)</li>
                                            <li>Titular de cartório (303-4)</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-gray-200 dark:border-gray-600 font-semibold">Obras de Construção Civil</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-600">CNO</td>
                                    <td className="p-3 border border-gray-200 dark:border-gray-600">Vinculado a CNPJ ou CPF</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Configuração para Administração Pública</h3>
                    <div className="p-6">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-lg border-l-4 border-amber-500 mb-6">
                            <h4 className="font-bold text-lg mb-3 text-amber-800 dark:text-amber-200">Parametrização Obrigatória:</h4>
                            <p className="mb-2">Para clientes com natureza jurídica de Administração Pública Federal:</p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Acessar <strong>Clientes - Empresas » Aba Geral</strong></li>
                                <li>Habilitar <strong>"Natureza Jurídica de Adm Pública"</strong></li>
                            </ol>
                        </div>

                        <p>Esta configuração garante que o campo <strong>&#123;nrInsc&#125;</strong> no XML seja preenchido com o CNPJ completo (14 posições).</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: FuncionariosDeclarantesContent
};
