import React from 'react';

const PGRContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">NR-01: PGR</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Programa de Gerenciamento de Riscos: A espinha dorsal da gestão de segurança moderna.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">O que mudou?</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <p className="mb-4 text-lg">
                        O <strong>PGR</strong> entrou em vigor em Janeiro de 2022, substituindo o antigo PPRA (NR-09).
                    </p>
                    <p className="mb-0">
                        A principal evolução é a abrangência: enquanto o PPRA focava apenas em riscos ambientais (Físicos, Químicos e Biológicos), o PGR exige a gestão de <strong>todos os cinco tipos de riscos</strong>, incluindo <strong>Ergonômicos</strong> e de <strong>Acidentes</strong>.
                    </p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Estrutura Obrigatória</h2>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                    O PGR não é apenas um "laudo de gaveta". Ele é um processo contínuo materializado em dois documentos principais que devem estar sempre disponíveis e atualizados:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition hover:shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-8xl">📋</span>
                        </div>
                        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4 relative z-10">1. Inventário de Riscos</h3>
                        <p className="text-gray-600 dark:text-gray-300 relative z-10 mb-4">
                            É o diagnóstico completo. Deve identificar perigos, avaliar riscos e classificar o nível de severidade e probabilidade de cada um.
                        </p>
                        <ul className="text-sm space-y-2 text-gray-500 dark:text-gray-400 relative z-10">
                            <li>• Descrição do processo produtivo</li>
                            <li>• Identificação de fontes geradoras</li>
                            <li>• Dados de exposição (medições)</li>
                            <li>• Categorização do Risco (Matriz de Risco)</li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition hover:shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-8xl">🚀</span>
                        </div>
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-4 relative z-10">2. Plano de Ação</h3>
                        <p className="text-gray-600 dark:text-gray-300 relative z-10 mb-4">
                            É o cronograma de melhoria contínua. Para cada risco identificado, deve haver uma medida de controle planejada.
                        </p>
                        <ul className="text-sm space-y-2 text-gray-500 dark:text-gray-400 relative z-10">
                            <li>• Medidas de eliminação ou mitigação</li>
                            <li>• Responsável pela execução</li>
                            <li>• Prazo para cumprimento</li>
                            <li>• Monitoramento dos resultados</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Validade e Revisão</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-center">
                        <span className="block text-4xl mb-2">🔄</span>
                        <h4 className="font-bold">2 Anos</h4>
                        <p className="text-sm text-gray-500">Prazo geral de revisão para maioria das empresas.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-center">
                        <span className="block text-4xl mb-2">🏆</span>
                        <h4 className="font-bold">3 Anos</h4>
                        <p className="text-sm text-gray-500">Para empresas com certificação em sistema de gestão de SST.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-center">
                        <span className="block text-4xl mb-2">⚡</span>
                        <h4 className="font-bold">Imediata</h4>
                        <p className="text-sm text-gray-500">Em caso de mudanças no processo, novos riscos ou acidentes.</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Microempresas (ME/EPP)</h2>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Declaração de Inexistência de Riscos (DIR)</h3>
                    <p className="mb-4">
                        Empresas ME e EPP de grau de risco 1 e 2 que <strong>não possuírem</strong> riscos físicos, químicos ou biológicos podem ser dispensadas do PGR.
                    </p>
                    <p className="text-sm italic text-gray-600 dark:text-gray-400">
                        ⚠️ Atenção: A dispensa do PGR não isenta a empresa de cuidar dos riscos ergonômicos e de acidentes, nem da emissão do PCMSO (salvo se também não houver riscos ergonômicos).
                    </p>
                </div>
            </section>
        </div>
    );
};

export default {
    content: PGRContent
};
