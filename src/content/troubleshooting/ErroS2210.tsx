
import React from 'react';

const ErroS2210Content = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-lg mb-10 text-center border-l-4 border-red-500">
                <h1 className="m-0 text-3xl font-bold text-red-900 dark:text-red-100">Erro no S-2210 (CAT)</h1>
                <p className="mt-2 text-lg text-red-800 dark:text-red-200">
                    Falha de Schema: Hora do Acidente inválida ou inconsistente com Tipo de CAT
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-red-500 pb-2 mb-6">Diagnóstico do Erro</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-red-400">
                    <p className="mb-4">O eSocial recusa o evento S-2210 quando a hora do acidente está em formato incorreto ou entra em conflito com o tipo de CAT selecionado.</p>

                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded font-mono text-sm mb-4">
                        <p className="text-red-600 dark:text-red-300">Erro 17: A estrutura do arquivo XML está em desacordo com o esquema XSD.</p>
                        <p className="mt-2">Elemento 'ideAcidente/hrAcidente': '00:00' is not a valid value of the atomic type 'THora'.</p>
                    </div>

                    <h4 className="font-bold text-lg mb-2">Causas Comuns:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Hora registrada como "00:00" em acidentes típicos</li>
                        <li>Campo vazio em situações obrigatórias</li>
                        <li>Incompatibilidade com CAT de Doença Ocupacional ou Trajeto</li>
                    </ul>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-green-500 pb-2 mb-6">Solução Passo a Passo</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <h3 className="font-bold text-lg mb-3 text-blue-600 dark:text-blue-400">1. Acidente Típico</h3>
                        <p className="text-sm mb-4">Em acidentes ocorridos na empresa ou a serviço dela.</p>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                            <strong>Ação:</strong> Informar a hora exata da ocorrência (HH:MM). O campo é obrigatório e não pode ser zerado sem justificativa.
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <h3 className="font-bold text-lg mb-3 text-blue-600 dark:text-blue-400">2. Doença Ocupacional</h3>
                        <p className="text-sm mb-4">Quando o afastamento ocorre por doença relacionada ao trabalho.</p>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                            <strong>Ação:</strong> Deixar o campo hora <strong>em branco</strong> ou preencher com "00:00" apenas se o sistema exigir, mas validar regra específica da versão S-1.1: Hora deve ser omitida para doenças.
                        </div>
                        <p className="text-xs mt-2 text-gray-500 italic">No Sigo: Campo "Hora" fica desabilitado para tipo "Doença".</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm col-span-1 md:col-span-2">
                        <h3 className="font-bold text-lg mb-3 text-blue-600 dark:text-blue-400">3. Acidente de Trajeto</h3>
                        <p className="text-sm mb-4">Ocorrido no deslocamento residência-trabalho (ou vice-versa).</p>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                            <strong>Ação:</strong> Informar hora aproximada do acidente. Se desconhecida, verificar possibilidade de uso de hora padrão acordada com jurídico (ex: hora de início/fim de jornada), mas priorizar dado real.
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-purple-600 pb-2 mb-6">Validação no Sistema</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <p className="mb-4">Para corrigir e retransmitir:</p>
                    <ol className="list-decimal pl-6 space-y-2 mb-6">
                        <li>Acesse o cadastro da CAT no Sigo</li>
                        <li>Verifique o campo <strong>"Tipo de Acidente"</strong></li>
                        <li>Ajuste o campo <strong>"Hora do Acidente"</strong> conforme regras acima</li>
                        <li>Salve e aguarde nova validação da mensageria (aprox. 1 hora)</li>
                    </ol>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-center">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Status esperado:</span> <span className="text-green-600 font-bold">Sucesso (201)</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: ErroS2210Content
};
