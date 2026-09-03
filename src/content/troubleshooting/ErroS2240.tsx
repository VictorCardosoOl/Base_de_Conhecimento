
import React from 'react';

const ErroS2240Content = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-lg mb-10 text-center border-l-4 border-red-500">
                <h1 className="m-0 text-3xl font-bold text-red-900 dark:text-red-100">Erro no S-2240 (Ambiente)</h1>
                <p className="mt-2 text-lg text-red-800 dark:text-red-200">
                    Ocorrência de erro "Grupo 'Agentes Nocivos' não preenchido" ou incompatibilidade de datas
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-red-500 pb-2 mb-6">Diagnóstico do Erro</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-red-400">
                    <p className="mb-4">O evento S-2240 é rejeitado quando o sistema detecta ausência de informações obrigatórias sobre riscos ou conflito temporal.</p>

                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded font-mono text-sm mb-4">
                        <p className="text-red-600 dark:text-red-300">Erro: O grupo 'Agentes Nocivos' deve ser preenchido.</p>
                        <p className="mt-2">Causa: Tentativa de envio sem informar risco ou sem código de ausência de risco.</p>
                    </div>

                    <h4 className="font-bold text-lg mb-2">Outros erros comuns:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Data de início da condição anterior à data de admissão</li>
                        <li>Responsável Técnico pelo registro ambiental não informado</li>
                        <li>Código da atividade (Tabela 24) inválido</li>
                    </ul>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-green-500 pb-2 mb-6">Solução Passo a Passo</h2>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                        <h3 className="font-bold text-lg mb-3 text-green-700 dark:text-green-300">Cenário 1: Funcionário SEM Riscos</h3>
                        <p className="text-sm mb-4">Mesmo sem riscos, o envio é obrigatório.</p>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-800">
                            <strong>Correção:</strong> Selecionar o código <strong>09.01.001 (Ausência de Fator de Risco)</strong>.
                            <br />
                            <span className="text-xs mt-1 block">Não deixe a lista de riscos vazia, insira explicitamente este código.</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                        <h3 className="font-bold text-lg mb-3 text-green-700 dark:text-green-300">Cenário 2: Data Inválida</h3>
                        <p className="text-sm mb-4">Data de início da condição ambiental (iniCondicao) anterior à admissão.</p>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-800">
                            <strong>Correção:</strong> A data de início das condições deve ser <strong>igual ou posterior</strong> à data de admissão do trabalhador.
                            <br />
                            <span className="text-xs mt-1 block">Exceção: Transferência de empresa (sucessão), onde se mantém histórico.</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                        <h3 className="font-bold text-lg mb-3 text-green-700 dark:text-green-300">Cenário 3: Responsável Técnico Ausente</h3>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-800">
                            <strong>Correção:</strong> Cadastrar e vincular o Responsável Técnico (Engenheiro ou Médico) com CPF e registro de classe (CREA/CRM) válidos na aba de SST/LTCAT.
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-purple-600 pb-2 mb-6">Dica de Prevenção</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <p className="mb-4">No Sigo, utilize o relatório de <strong>"Pré-validação de Eventos SST"</strong> antes de autorizar o envio em massa.</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Identifica funcionários sem riscos vinculados</li>
                        <li>Verifica consistência de datas</li>
                        <li>Alerta sobre falta de Responsável Técnico</li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default {
    content: ErroS2240Content
};
