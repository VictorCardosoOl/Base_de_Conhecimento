
import React from 'react';

const ECACeSocialContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center shadow-sm">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Domine o e-CAC: Guia Completo para Colaboradores Wise</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Este guia aprofundado explica o e-CAC como pilar fundamental para a gestão das obrigações do eSocial, com ênfase nos processos de procuração eletrônica e certificação digital.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">O e-CAC em Detalhe: Centro Virtual de Atendimento ao Contribuinte</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500 mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded border-l-4 border-blue-500 mb-6">
                        <p className="mb-3">O <strong>e-CAC</strong> (Centro Virtual de Atendimento ao Contribuinte) é a principal plataforma digital da Receita Federal para:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Centralizar todos os serviços fiscais em um único ambiente seguro</li>
                            <li>Eliminar a necessidade de deslocamento físico às unidades da RFB</li>
                            <li>Garantir autenticidade e validade jurídica através de certificação digital</li>
                        </ul>
                    </div>

                    <h3 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">Serviços Essenciais do e-CAC para Operações SST</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Consulta Fiscal Integrada</h4>
                            <p className="text-sm">Verificação em tempo real de débitos e pendências tributárias vinculadas a CPF/CNPJ</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Gestão de Declarações</h4>
                            <p className="text-sm">Envio e retificação de DCTF, EFD-Reinf e outras obrigações acessórias</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Regularização Fiscal</h4>
                            <p className="text-sm">Emissão de DARF e opções de parcelamento de débitos</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                            <h4 className="text-lg font-semibold mt-0 mb-2 text-blue-900 dark:text-blue-100">Procuração Eletrônica</h4>
                            <p className="text-sm">Cadastro e gestão de autorizações para terceiros atuarem em nome da empresa</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-semibold mt-0 mb-2">Comunicação Digital</h4>
                            <p className="text-sm">Acesso a documentos oficiais transmitidos via SPED e eSocial</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Integração Estratégica: e-CAC como Gateway do eSocial</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500 mb-8">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md text-center min-w-[120px]">
                            <h4 className="font-bold text-lg m-0 text-blue-900 dark:text-blue-100">e-CAC</h4>
                            <p className="text-xs mt-1">Portal de Controle</p>
                        </div>
                        <div className="hidden md:block flex-1 border-t-2 border-dashed border-blue-400 relative">
                            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-blue-500">→</span>
                        </div>
                        <div className="md:hidden text-blue-500 font-bold">↓</div>
                        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md text-center min-w-[120px]">
                            <h4 className="font-bold text-lg m-0 text-blue-900 dark:text-blue-100">Procuração</h4>
                            <p className="text-xs mt-1">Validação Jurídica</p>
                        </div>
                        <div className="hidden md:block flex-1 border-t-2 border-dashed border-blue-400 relative">
                            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-blue-500">→</span>
                        </div>
                        <div className="md:hidden text-blue-500 font-bold">↓</div>
                        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg shadow-md text-center min-w-[120px] border border-blue-300 dark:border-blue-700">
                            <h4 className="font-bold text-lg m-0 text-blue-900 dark:text-blue-100">eSocial</h4>
                            <p className="text-xs mt-1">Transmissão</p>
                        </div>
                    </div>

                    <div className="flex-[2]">
                        <h3 className="text-xl font-semibold mb-3">Mecanismo de Autorização</h3>
                        <p className="mb-4">O e-CAC atua como <strong>controlador de acesso</strong> para o eSocial, garantindo que:</p>
                        <ul className="list-disc pl-6 space-y-1 mb-6">
                            <li>Apenas procuradores devidamente autorizados possam enviar eventos</li>
                            <li>Cada transação tenha validade jurídica através de certificação digital</li>
                            <li>As permissões sejam específicas por tipo de evento (ex: Grupo SST)</li>
                        </ul>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded">
                            <strong>Ponto Crítico:</strong> Sem procuração eletrônica válida no e-CAC, nenhum terceiro (incluindo a Wise) pode legalmente transmitir eventos ao eSocial em nome do cliente.
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Fluxo Detalhado: Cadastro de Procuração Eletrônica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm relative">
                        <div className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">1</div>
                        <h3 className="text-lg font-bold mt-2 mb-3 pl-2">Acesso com Certificado</h3>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                            <li>Login no e-CAC usando <strong>e-CNPJ A1 ou A3</strong></li>
                            <li>Conta Gov.br (Prata/Ouro) também aceita</li>
                            <li>Representante legal deve acessar</li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm relative">
                        <div className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">2</div>
                        <h3 className="text-lg font-bold mt-2 mb-3 pl-2">Módulo de Procurações</h3>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                            <li>Buscar "procuração" na pesquisa</li>
                            <li>Selecionar: <em>"CADASTRO, CONSULTA E CANCELAMENTO..."</em></li>
                            <li>Cancelar procurações antigas não usadas</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg shadow-sm relative border border-blue-200 dark:border-blue-800">
                        <div className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">3</div>
                        <h3 className="text-lg font-bold mt-2 mb-3 pl-2 text-blue-900 dark:text-blue-100">Preenchimento dos Dados</h3>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                            <li><strong>Outorgante:</strong> Automático (cliente)</li>
                            <li><strong>Procurador:</strong> CNPJ/CPF da Wise ou designado</li>
                            <li><strong>Vigência:</strong> Alinhar com contrato</li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm relative">
                        <div className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">4</div>
                        <h3 className="text-lg font-bold mt-2 mb-3 pl-2">Definição de Permissões</h3>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                            <li>Marcar <strong>"eSocial - Grupo SST"</strong></li>
                            <li>Incluir <strong>"eSocial - Download"</strong></li>
                            <li>Para toxicológico: <strong>"eSocial - Toxicológico"</strong></li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm relative md:col-span-2">
                        <div className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">5</div>
                        <h3 className="text-lg font-bold mt-2 mb-3 pl-2">Finalização e Validação</h3>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                            <li>Definir possibilidade de substabelecimento</li>
                            <li>Resolver Captcha de segurança</li>
                            <li>Clicar em <strong>"Cadastrar Procuração"</strong> para concluir</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg italic text-gray-700 dark:text-gray-300">
                    <p><strong>Observação:</strong> Todo o processo deve ser realizado pelo representante legal da empresa cliente. A Wise pode fornecer orientações, mas não pode executar esta etapa diretamente.</p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Certificação Digital: Requisitos Técnicos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-t-4 border-t-blue-500">
                        <h3 className="text-lg font-bold mb-3">e-CNPJ (Cliente)</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li><strong>Obrigatório</strong> para outorgar procurações</li>
                            <li><strong>Tipo A1:</strong> Arquivo no computador</li>
                            <li><strong>Tipo A3:</strong> Token/Cartão físico</li>
                            <li>Validade: 1-3 anos (Sigo usa A1)</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg shadow-sm border-t-4 border-t-blue-500">
                        <h3 className="text-lg font-bold mb-3 text-blue-900 dark:text-blue-100">e-CPF (Wise)</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Assinar eventos como procurador</li>
                            <li>Vinculado à procuração eletrônica</li>
                            <li>Permite transmissão em nome do cliente</li>
                            <li>Níveis: A1 ou A3</li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-t-4 border-t-blue-500">
                        <h3 className="text-lg font-bold mb-3">Conta Gov.br</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Alternativa para acesso ao e-CAC</li>
                            <li>Nível <strong>Prata</strong> ou <strong>Ouro</strong> exigido</li>
                            <li>Não substitui certificado para algumas funções</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Fluxo Operacional Wise: e-CAC + eSocial</h2>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 flex-wrap mt-8">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm text-center flex-1 min-w-[200px] border border-gray-200 dark:border-gray-700">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">1</div>
                        <h3 className="font-bold mb-2">Onboarding</h3>
                        <p className="text-sm">Cliente cadastra procuração para Wise no e-CAC com permissões SST</p>
                    </div>

                    <div className="text-2xl text-blue-500 font-bold hidden md:block">→</div>
                    <div className="text-2xl text-blue-500 font-bold md:hidden">↓</div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm text-center flex-1 min-w-[200px] border border-gray-200 dark:border-gray-700">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">2</div>
                        <h3 className="font-bold mb-2">Transmissão</h3>
                        <p className="text-sm">Wise envia eventos (S-2210, etc.) usando e-CPF do responsável</p>
                    </div>

                    <div className="text-2xl text-blue-500 font-bold hidden md:block">→</div>
                    <div className="text-2xl text-blue-500 font-bold md:hidden">↓</div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg shadow-sm text-center flex-1 min-w-[200px] border border-blue-200 dark:border-blue-800">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">3</div>
                        <h3 className="font-bold mb-2">Correções</h3>
                        <p className="text-sm">Para erros: envio de S-3000 (exclusão) e retransmissão correta</p>
                    </div>

                    <div className="text-2xl text-blue-500 font-bold hidden md:block">→</div>
                    <div className="text-2xl text-blue-500 font-bold md:hidden">↓</div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm text-center flex-1 min-w-[200px] border border-gray-200 dark:border-gray-700">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">4</div>
                        <h3 className="font-bold mb-2">Verificação</h3>
                        <p className="text-sm">Cliente consulta recibo de entrega no eSocial via e-CAC</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: ECACeSocialContent
};
