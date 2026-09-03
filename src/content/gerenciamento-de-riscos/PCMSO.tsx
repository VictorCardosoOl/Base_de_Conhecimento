import React from 'react';

const PCMSOContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-teal-50 dark:bg-teal-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-teal-900 dark:text-teal-100">NR-07: PCMSO</h1>
                <p className="mt-2 text-lg text-teal-800 dark:text-teal-200">
                    Programa de Controle Médico de Saúde Ocupacional: O monitoramento biológico da saúde do trabalhador.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-teal-600 pb-2 mb-6">Integração PGR x PCMSO</h2>
                <div className="flex flex-col md:flex-row items-center gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex-1">
                        <p className="text-lg mb-4">
                            O PCMSO não trabalha sozinho. Ele <strong>depende</strong> diretamente do PGR.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            O médico do trabalho precisa saber exatamente a quais riscos o trabalhador está exposto (informação que vem do PGR) para definir quais exames são necessários. Se o PGR diz que há ruído, o PCMSO pede audiometria.
                        </p>
                    </div>
                    <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="text-center font-bold text-gray-500">
                            PGR (Riscos) <br /> ⬇️ <br /> PCMSO (Exames) <br /> ⬇️ <br /> ASO (Atestado)
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-teal-600 pb-2 mb-6">Os 5 Exames Obrigatórios</h2>
                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold mr-4">1</div>
                        <div>
                            <h3 className="font-bold text-lg">Admissional</h3>
                            <p className="text-gray-600 dark:text-gray-400">Deve ser realizado <strong>antes</strong> do trabalhador assumir suas atividades.</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold mr-4">2</div>
                        <div>
                            <h3 className="font-bold text-lg">Periódico</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                <strong>Anual:</strong> Para menores de 18, maiores de 45 ou expostos a riscos.<br />
                                <strong>Bienal:</strong> Para trabalhadores entre 18 e 45 anos, sem riscos graves.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold mr-4">3</div>
                        <div>
                            <h3 className="font-bold text-lg">Retorno ao Trabalho</h3>
                            <p className="text-gray-600 dark:text-gray-400">Obrigatório no primeiro dia de volta após afastamento (doença ou acidente) igual ou superior a 30 dias. Parto também exige.</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold mr-4">4</div>
                        <div>
                            <h3 className="font-bold text-lg">Mudança de Risco</h3>
                            <p className="text-gray-600 dark:text-gray-400">Só é necessário se a mudança de função/setor implicar em exposição a <strong>novos riscos</strong>.</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold mr-4">5</div>
                        <div>
                            <h3 className="font-bold text-lg">Demissional</h3>
                            <p className="text-gray-600 dark:text-gray-400">Até 10 dias do término do contrato. Pode ser dispensado se houve exame periódico recente (135 ou 90 dias, conforme grau de risco).</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-teal-600 pb-2 mb-6">O que é o ASO?</h2>
                <div className="bg-gradient-to-r from-teal-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 rounded-lg shadow-sm">
                    <h3 className="font-bold text-xl mb-3">Atestado de Saúde Ocupacional</h3>
                    <p className="mb-4">
                        É o documento final que diz se o funcionário está <span className="text-green-600 font-bold">APTO</span> ou <span className="text-red-500 font-bold">INAPTO</span>. O ASO não contém detalhes clínicos (sigilo médico), apenas a conclusão administrativa.
                    </p>
                    <div className="p-4 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-bold uppercase text-gray-400 mb-2">Checklist do ASO Válido:</h4>
                        <ul className="text-sm space-y-1">
                            <li>✅ Nome e dados do trabalhador</li>
                            <li>✅ Riscos Ocupacionais (ou ausência)</li>
                            <li>✅ Exames realizados e datas</li>
                            <li>✅ Definição de Aptidão</li>
                            <li>✅ Assinatura e Carimbo do Médico</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: PCMSOContent
};
