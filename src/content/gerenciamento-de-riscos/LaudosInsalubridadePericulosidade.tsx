import React from 'react';

const LaudosInsalubridadePericulosidadeContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Laudos Técnicos: LI vs LP</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    O comparativo definitivo para entender a diferença entre Insalubridade e Periculosidade.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Conceitos Fundamentais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Insalubridade */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="bg-orange-100 dark:bg-orange-900/40 p-4 border-b border-orange-200 dark:border-orange-800">
                            <h3 className="text-xl font-bold m-0 text-orange-900 dark:text-orange-100">Insalubridade (LI)</h3>
                            <span className="text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wider">Norma Regulamentadora 15</span>
                        </div>
                        <div className="p-6">
                            <p className="mb-4 text-gray-700 dark:text-gray-300">
                                Relacionada à exposição a agentes nocivos à saúde (físicos, químicos ou biológicos) acima dos limites de tolerância. O dano costuma ser gradual e a longo prazo.
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                    <span className="font-semibold">Foco:</span>
                                    <span>Saúde (Doença)</span>
                                </li>
                                <li className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                    <span className="font-semibold">Base de Cálculo:</span>
                                    <span>Salário Mínimo*</span>
                                </li>
                                <li className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                    <span className="font-semibold">Eliminação:</span>
                                    <span>Possível (EPI/EPC)</span>
                                </li>
                            </ul>
                            <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 p-3 rounded text-center">
                                <span className="block text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Adicionais</span>
                                <div className="flex justify-center gap-4 mt-1 font-bold text-orange-800 dark:text-orange-100">
                                    <span>10%</span>
                                    <span>20%</span>
                                    <span>40%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Periculosidade */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="bg-red-100 dark:bg-red-900/40 p-4 border-b border-red-200 dark:border-red-800">
                            <h3 className="text-xl font-bold m-0 text-red-900 dark:text-red-100">Periculosidade (LP)</h3>
                            <span className="text-xs font-semibold text-red-800 dark:text-red-200 uppercase tracking-wider">Norma Regulamentadora 16</span>
                        </div>
                        <div className="p-6">
                            <p className="mb-4 text-gray-700 dark:text-gray-300">
                                Relacionada ao risco iminente de morte devido à natureza da atividade. O acidente, se ocorrer, pode ser fatal instantaneamente.
                            </p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                    <span className="font-semibold">Foco:</span>
                                    <span>Vida (Acidente Fatal)</span>
                                </li>
                                <li className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                    <span className="font-semibold">Base de Cálculo:</span>
                                    <span>Salário Base</span>
                                </li>
                                <li className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                                    <span className="font-semibold">Eliminação:</span>
                                    <span>Difícil (Risco Inerente)</span>
                                </li>
                            </ul>
                            <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-3 rounded text-center">
                                <span className="block text-xs font-bold text-red-600 dark:text-red-400 uppercase">Adicional Único</span>
                                <div className="flex justify-center gap-4 mt-1 font-bold text-red-800 dark:text-red-100">
                                    <span>30%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-xs text-gray-500 italic">*A base de cálculo da insalubridade pode variar conforme convenção coletiva ou decisão judicial, mas a regra geral da CLT é o salário mínimo.</p>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Quando Solicitar cada Laudo?</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-bold text-lg mb-3 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mr-2 text-sm">LI</span>
                            Laudo de Insalubridade
                        </h3>
                        <ul className="space-y-2">
                            <li className="flex items-start bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                <span className="mr-2">🧪</span>
                                <span><strong>Novos químicos:</strong> Introdução de solventes, colas, tintas ou ácidos no processo.</span>
                            </li>
                            <li className="flex items-start bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                <span className="mr-2">🏗️</span>
                                <span><strong>Alteração de layout:</strong> Mudança de máquinas que geram mais ruído ou calor.</span>
                            </li>
                            <li className="flex items-start bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                <span className="mr-2">⚖️</span>
                                <span><strong>Demandas Jurídicas:</strong> Para defesa em reclamatórias trabalhistas.</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-3 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 flex items-center justify-center mr-2 text-sm">LP</span>
                            Laudo de Periculosidade
                        </h3>
                        <ul className="space-y-2">
                            <li className="flex items-start bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                <span className="mr-2">⚡</span>
                                <span><strong>Eletricidade:</strong> Contratação de eletricistas (Sistema Elétrico de Potência).</span>
                            </li>
                            <li className="flex items-start bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                <span className="mr-2">⛽</span>
                                <span><strong>Inflamáveis:</strong> Instalação de geradores a diesel ou tanques de combustível.</span>
                            </li>
                            <li className="flex items-start bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                <span className="mr-2">🛵</span>
                                <span><strong>Motocicleta:</strong> Uso de moto para trabalho em vias públicas (Motoboy).</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Mitos e Verdades</h2>
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 border-l-4 border-green-500 p-4 shadow-sm">
                        <h4 className="font-bold text-green-700 dark:text-green-400">Verdade: Adicionais não se acumulam</h4>
                        <p className="text-sm mt-1">
                            Se um trabalhador estiver exposto a riscos insalubres E perigosos simultaneamente, ele (ou a empresa, dependendo da interpretação jurídica) deve optar pelo adicional mais vantajoso. <strong>Não se paga 70% (40% + 30%).</strong>
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 border-l-4 border-red-500 p-4 shadow-sm">
                        <h4 className="font-bold text-red-700 dark:text-red-400">Mito: Periculosidade depende do tempo de exposição</h4>
                        <p className="text-sm mt-1">
                            Diferente da insalubridade, a periculosidade não considera tempo de exposição ou limites de tolerância. Bastam minutos de exposição ao risco de morte (ex: entrar em área de explosivos) para caracterizar o direito ao adicional integral.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: LaudosInsalubridadePericulosidadeContent
};
