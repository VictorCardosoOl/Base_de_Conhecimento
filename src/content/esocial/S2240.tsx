
import React from 'react';

const S2240Content = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Evento S-2240: Condições Ambientais do Trabalho</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Este guia foi elaborado para integrar novos colaboradores ao universo do eSocial, com foco no evento S-2240, essencial para o histórico previdenciário do trabalhador.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">O que é o Evento S-2240?</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-4">O evento S-2240 registra, de forma eletrônica, as <strong>condições ambientais de trabalho</strong> de cada funcionário e detalha a exposição a <strong>agentes nocivos</strong> (físicos, químicos, biológicos ou mistos).</p>
                    <p className="mb-4">É a base para emissão do <strong>Perfil Profissiográfico Previdenciário (PPP)</strong> em meio eletrônico e responde a perguntas como:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Onde o trabalhador exerce suas funções?</li>
                        <li>Quais atividades realiza?</li>
                        <li>Está exposto a algum risco que possa gerar direito à aposentadoria especial?</li>
                        <li>Há medições? EPIs são fornecidos e eficazes?</li>
                    </ul>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Envio Obrigatório (Mesmo sem Riscos)</h2>
                <p className="mb-6">Todo trabalhador regido pela CLT deve ter um evento S-2240 ativo no eSocial.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="font-bold text-lg mb-2 text-blue-800 dark:text-blue-300">Funcionário exposto a riscos</h4>
                        <p className="text-sm">Informar os agentes nocivos conforme a Tabela 24 do eSocial, com base nos documentos ocupacionais da empresa.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="font-bold text-lg mb-2 text-blue-800 dark:text-blue-300">Funcionário sem exposição</h4>
                        <p className="text-sm">Deve-se utilizar o código <strong>09.01.001</strong> – "Ausência de fator de risco", formalizando a avaliação realizada.</p>
                    </div>
                </div>
                <p className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded text-blue-900 dark:text-blue-100">Esse envio é obrigatório, inclusive para cargos administrativos. Ele comprova que a empresa avaliou o ambiente de trabalho e garante a segurança jurídica da organização.</p>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Normas Regulamentadoras e Bases Legais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="text-xl font-bold mt-0 mb-3 text-blue-800 dark:text-blue-300">NR-01</h3>
                        <p className="font-semibold mb-2">Gerenciamento de Riscos Ocupacionais (PGR)</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Origem primária das informações transmitidas no S-2240. Apresenta o inventário de riscos e medidas de controle.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="text-xl font-bold mt-0 mb-3 text-blue-800 dark:text-blue-300">NR-09</h3>
                        <p className="font-semibold mb-2">Exposições Ocupacionais</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Orienta as avaliações qualitativas e quantitativas dos riscos ambientais descritos no evento.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="text-xl font-bold mt-0 mb-3 text-blue-800 dark:text-blue-300">NR-15 / NR-16</h3>
                        <p className="font-semibold mb-2">Insalubridade e Periculosidade</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Laudos auxiliares para identificação de riscos no S-2240. Não geram diretamente os adicionais, mas são fontes de referência.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="text-xl font-bold mt-0 mb-3 text-blue-800 dark:text-blue-300">Decreto 3.048/99</h3>
                        <p className="font-semibold mb-2">Anexo IV - Previdência</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Lista oficial de agentes nocivos que geram direito à aposentadoria especial.</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Impactos Previdenciários e Trabalhistas</h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8 overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Aposentadoria Especial</h3>
                    <div className="p-6">
                        <p className="mb-4">O evento S-2240 serve como prova documental de exposição a agentes nocivos. A Previdência usará esse histórico para conceder aposentadoria com tempo reduzido (15, 20 ou 25 anos).</p>
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Importante:</h4>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Sem o S-2240, o direito à aposentadoria especial pode ser negado.</li>
                            <li>O histórico é construído por envio contínuo de novos eventos, sem necessidade de retificação por mudança de função.</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8 overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Encargos para a Empresa</h3>
                    <div className="p-6">
                        <p className="mb-4">Empregadores que declaram exposição a riscos devem recolher uma contribuição adicional (GIIL-RAT), destinada ao financiamento da aposentadoria especial.</p>
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Consequências:</h4>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Alíquota de 6%, 9% ou 12% sobre a folha, conforme o risco.</li>
                            <li>Empresas que omitem riscos podem ser autuadas e obrigadas a arcar com o passivo.</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Segurança Jurídica e Compliance</h3>
                    <div className="p-6">
                        <p className="mb-4">O correto preenchimento do S-2240 protege tanto o colaborador quanto a empresa. Reduz ações trabalhistas, reforça a credibilidade da gestão e evita prejuízos futuros com passivos ocultos.</p>
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Boas Práticas:</h4>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Integrar PGR, LTCAT, PCMSO e S-2240 no sistema</li>
                            <li>Validar EPIs e registros de entrega</li>
                            <li>Registrar novas condições sempre que houver alterações</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: S2240Content
};
