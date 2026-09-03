
import React from 'react';

const RotinaSSTContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Rotina de Transmissão Automatizada - Eventos SST</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Envio automatizado via Serviço Mensageria do Sigo® conforme programação estabelecida
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Eventos de SST e Seus Prazos Legais</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* S-2210 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold m-0">S-2210</h3>
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">Crítico</span>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-4">Comunicação de Acidente de Trabalho</p>
                        <div className="mb-2 text-sm">
                            <strong>Prazo:</strong> 1º dia útil após ocorrência (em caso de morte: imediato)
                        </div>
                        <div className="mb-2 text-sm">
                            <strong>Transmissão:</strong> Imediata quando disponível
                        </div>
                        <div className="mb-4 text-sm">
                            <strong>Substitui:</strong> CAT física (exceto para MEI não obrigado no eSocial)
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded text-sm">
                            <h4 className="font-bold text-amber-600 dark:text-amber-400 mt-0 mb-2">Consequências por Não Envio:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Multas até R$ 10.037,35 (art. 286, Decreto 3.048/1999)</li>
                                <li>Fiscalização eletrônica automatizada</li>
                                <li>Impacto no FAP da empresa</li>
                                <li>Dificuldade de acesso a benefícios</li>
                            </ul>
                        </div>
                    </div>

                    {/* S-2220 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold m-0">S-2220</h3>
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">Periódico</span>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-4">Monitoramento da Saúde do Trabalhador</p>
                        <div className="mb-2 text-sm">
                            <strong>Prazo:</strong> Até dia 15 do mês subsequente ao exame
                        </div>
                        <div className="mb-4 text-sm">
                            <strong>Transmissão:</strong> A partir do 1º dia do mês subsequente
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded text-sm">
                            <h4 className="font-bold text-amber-600 dark:text-amber-400 mt-0 mb-2">Riscos por Não Envio:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Inconsistência no prontuário eletrônico</li>
                                <li>Autuação por falta de comprovação</li>
                                <li>Responsabilização solidária empregador-prestador</li>
                            </ul>
                        </div>
                    </div>

                    {/* S-2221 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold m-0">S-2221</h3>
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">Toxicológico</span>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-4">Exame Toxicológico do Motorista Profissional</p>
                        <div className="mb-2 text-sm">
                            <strong>Prazo:</strong> Até dia 15 do mês seguinte ao exame
                        </div>
                        <div className="mb-4 text-sm">
                            <strong>Aplica-se:</strong> Categorias C, D ou E (Lei 13.103/2015)
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded text-sm">
                            <h4 className="font-bold text-amber-600 dark:text-amber-400 mt-0 mb-2">Impactos por Não Envio:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Irregularidade perante Lei dos Caminhoneiros</li>
                                <li>Impedimento contratual</li>
                                <li>Ações fiscais por falta de controle</li>
                            </ul>
                        </div>
                    </div>

                    {/* S-2240 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold m-0">S-2240</h3>
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">Ambiental</span>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-4">Condições Ambientais do Trabalho</p>
                        <div className="mb-2 text-sm">
                            <strong>Prazo:</strong> Até dia 15 do mês subsequente à alteração
                        </div>
                        <div className="mb-4 text-sm">
                            <strong>Observação:</strong> Não se retifica - envia novo evento
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded text-sm">
                            <h4 className="font-bold text-amber-600 dark:text-amber-400 mt-0 mb-2">Consequências por Não Envio:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Multas por omissão de dados</li>
                                <li>Inconsistência no PPP eletrônico</li>
                                <li>Impacto em aposentadoria especial</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Responsabilidades no Envio</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <h3 className="font-bold text-lg mb-3">Empregador</h3>
                        <p className="text-sm">Responsável legal pelo envio, podendo delegar via procuração eletrônica no e-CAC</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-2 border-amber-400">
                        <h3 className="font-bold text-lg mb-3">Certificação Digital</h3>
                        <p className="text-sm mb-4">Obrigatório uso de e-CNPJ da empresa ou e-CPF com procuração válida</p>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-xs text-red-800 dark:text-red-200">
                            <strong>Proibição:</strong> Uso indevido de certificado do cliente por prestador gera responsabilização solidária
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <h3 className="font-bold text-lg mb-3">Prestador SST</h3>
                        <p className="text-sm">Quando autorizado, deve utilizar próprio e-CPF (nunca o certificado do cliente)</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Processo Automatizado via Mensageria Sigo®</h2>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 flex-wrap mb-8">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm text-center flex-1 min-w-[150px]">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">1</div>
                        <h3 className="font-bold mb-2">Verificação</h3>
                        <p className="text-sm">A cada 1 hora, o sistema rastreia eventos disponíveis</p>
                    </div>

                    <div className="text-2xl text-blue-500 font-bold hidden md:block">→</div>
                    <div className="text-2xl text-blue-500 font-bold md:hidden">↓</div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm text-center flex-1 min-w-[150px]">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">2</div>
                        <h3 className="font-bold mb-2">Validação XML</h3>
                        <p className="text-sm">Conferência automática da estrutura</p>
                    </div>

                    <div className="text-2xl text-blue-500 font-bold hidden md:block">→</div>
                    <div className="text-2xl text-blue-500 font-bold md:hidden">↓</div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm text-center flex-1 min-w-[150px]">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">3</div>
                        <h3 className="font-bold mb-2">Transmissão</h3>
                        <p className="text-sm">Envio ao Ambiente Nacional do eSocial</p>
                    </div>

                    <div className="text-2xl text-blue-500 font-bold hidden md:block">→</div>
                    <div className="text-2xl text-blue-500 font-bold md:hidden">↓</div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm text-center flex-1 min-w-[150px]">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">4</div>
                        <h3 className="font-bold mb-2">Confirmação</h3>
                        <p className="text-sm">Consulta do recibo de entrega</p>
                    </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border-l-4 border-green-500">
                    <h3 className="font-bold text-lg mb-2 text-green-800 dark:text-green-200">Validação de Preenchimento</h3>
                    <p>Eventos com erros ficam bloqueados para transmissão até correção via botão "Validar Preenchimento"</p>
                </div>
            </section>
        </div>
    );
};

export default {
    content: RotinaSSTContent
};
