
import React from 'react';

const S2220Content = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Monitoramento da Saúde no eSocial</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Este guia foi criado para apresentar a importância do evento S-2220, que documenta a saúde ocupacional dos trabalhadores ao longo de sua trajetória na empresa. Uma ferramenta essencial para promover segurança, cumprir a legislação e proteger o trabalhador.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">O que é o Evento S-2220?</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-4">O <strong>evento S-2220</strong> é utilizado para registrar digitalmente as informações sobre o <strong>monitoramento da saúde do trabalhador</strong> durante todo seu vínculo com a empresa.</p>
                    <p className="mb-4">Esse evento detalha as avaliações clínicas e os exames complementares, com base no <strong>Atestado de Saúde Ocupacional (ASO)</strong>, e deve ser enviado sempre que um exame ocupacional for realizado.</p>

                    <h4 className="font-bold text-lg text-blue-800 dark:text-blue-300 mb-3">Exames que devem ser registrados:</h4>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                        <li>Admissional</li>
                        <li>Periódico</li>
                        <li>Retorno ao Trabalho</li>
                        <li>Mudança de Função ou Risco</li>
                        <li>Monitoração Pontual (quando houver ASO)</li>
                        <li>Demissional</li>
                    </ul>

                    <p className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded mt-4"><strong>Importante:</strong> mesmo exames solicitados fora da rotina periódica (monitoração pontual) devem ser enviados, desde que estejam registrados no ASO.</p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Relação com as Normas Regulamentadoras</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <h3 className="text-xl font-bold mt-0 mb-3 text-blue-800 dark:text-blue-300">NR-7</h3>
                    <p className="font-semibold mb-2">Programa de Controle Médico de Saúde Ocupacional (PCMSO)</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estabelece a obrigatoriedade de exames clínicos e complementares, visando preservar a saúde dos trabalhadores. O evento S-2220 é a forma digital de comprovar sua execução.</p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Impacto para o Trabalhador e Previdência</h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8 overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Ligação com o Perfil Profissiográfico Previdenciário (PPP)</h3>
                    <div className="p-6">
                        <p className="mb-4">O evento S-2220 alimenta diretamente o <strong>PPP em meio digital</strong>, documento exigido pelo INSS para comprovação do histórico laboral e da saúde do trabalhador.</p>

                        <h4 className="font-bold text-lg text-blue-800 dark:text-blue-300 mb-3">Benefícios do registro correto:</h4>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Comprovação de Doença Ocupacional:</strong> Históricos de exames ajudam a comprovar o nexo entre a doença e a atividade profissional.</li>
                            <li><strong>Aposentadoria Especial:</strong> O PPP digital, baseado no S-2220 e S-2240, é essencial para solicitação junto ao INSS.</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <h3 className="bg-gray-100 dark:bg-gray-700 p-4 font-bold text-lg m-0 border-b border-gray-200 dark:border-gray-600 text-blue-900 dark:text-blue-100">Monitoração Pontual - Como Funciona?</h3>
                    <div className="p-6">
                        <p className="mb-4">O evento S-2220 também cobre exames realizados fora da rotina, como os solicitados por critério médico. No entanto:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>O exame só deve ser enviado se estiver vinculado a um <strong>ASO emitido</strong>.</li>
                            <li>Exames avulsos, sem ASO, não devem ser registrados de forma isolada no S-2220.</li>
                        </ul>
                        <p className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded text-yellow-800 dark:text-yellow-200 border-l-4 border-yellow-500">Esses cuidados evitam inconsistências no histórico digital do trabalhador.</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Tabelas Técnicas Utilizadas no Evento S-2220</h2>
                <p className="mb-6">O correto preenchimento do S-2220 exige o uso de códigos e referências das tabelas do eSocial. Veja abaixo as principais:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 05</h4>
                        <p className="font-semibold mb-2">Tipos de Inscrição</p>
                        <p className="text-sm mb-3">Define o tipo de inscrição do estabelecimento de saúde onde o exame foi realizado. Ex: CNPJ, CAEPF, CNO.</p>
                        <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded inline-block">ideEstabSaude/tpInsc</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 01</h4>
                        <p className="font-semibold mb-2">Categoria do Trabalhador</p>
                        <p className="text-sm mb-3">Identifica a relação do trabalhador com a empresa (empregado, estagiário, servidor etc.).</p>
                        <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded inline-block">categoria</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-lg font-bold mb-2 text-blue-800 dark:text-blue-300">Tabela 27</h4>
                        <p className="font-semibold mb-2">Procedimentos Diagnósticos</p>
                        <p className="text-sm mb-3">Indica o tipo de exame realizado: clínico, audiometria, hemograma, espirometria, etc.</p>
                        <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded inline-block">procRealizado/codProcRealizado</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: S2220Content
};
