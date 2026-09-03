
import React from 'react';

const S2221Content = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-blue-900 dark:text-blue-100">Bem-vindo ao Guia sobre o Evento S-2221!</h1>
                <p className="mt-2 text-lg text-blue-800 dark:text-blue-200">
                    Este material foi desenvolvido para explicar de forma clara como funciona o envio do exame toxicológico de motoristas profissionais pelo evento S-2221 no eSocial, com instruções completas para uso do sistema.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">O que é o Evento S-2221?</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-4">O evento S-2221 é o registro eletrônico, enviado ao eSocial, que contém as informações do <strong>exame toxicológico</strong> realizado por motoristas profissionais empregados. Visa detectar o uso de substâncias psicoativas que comprometam a direção segura.</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Obrigatório desde 1º de agosto de 2024</li>
                        <li>Aplica-se a motoristas com CNH nas categorias C, D ou E</li>
                        <li>Exclusivo para atividades remuneradas de transporte rodoviário de cargas ou passageiros</li>
                    </ul>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Quem Deve Realizar o Exame?</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Motoristas de transporte rodoviário de passageiros</li>
                        <li>Motoristas de transporte rodoviário de cargas</li>
                        <li><strong>Importante:</strong> Aplica-se apenas às categorias C, D e E da CNH</li>
                    </ul>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Informações que Devem ser Informadas no Evento</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <ul className="list-disc pl-6 space-y-2">
                        <li>CPF do empregado</li>
                        <li>Matrícula</li>
                        <li>Data do exame</li>
                        <li>CNPJ do laboratório</li>
                        <li>Código sequencial (11 caracteres)</li>
                        <li>Nome e CRM do médico responsável</li>
                    </ul>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Prazo de Envio</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-6">O envio deve ocorrer até o dia 15 do mês subsequente ao exame. Se cair em dia não útil, antecipa-se para o último dia útil anterior.</p>

                    <h3 className="text-lg font-bold mb-3 text-blue-900 dark:text-blue-200">Momentos de Realização</h3>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li><strong>Admissional</strong>: Antes da contratação</li>
                        <li><strong>Periódico</strong>: A cada 30 meses por sorteio randômico</li>
                        <li><strong>Demissional</strong>: No desligamento</li>
                    </ul>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded text-blue-800 dark:text-blue-200">
                        <strong>Reaproveitamento:</strong> Se feito nos últimos 60 dias, pode ser usado para outro fim (admissional/demissional).
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Base Legal e Normas</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li><strong>Portaria MTP nº 672/2021</strong>: Confidencialidade e contraprova</li>
                        <li><strong>Portaria MTE nº 612/2024</strong>: Regras específicas para motoristas empregados</li>
                    </ul>
                    <p>Embora não esteja vinculado a uma NR específica, sua inclusão no PCMSO é prevista. O resultado <strong>não deve constar no ASO</strong>.</p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Impactos do Exame</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="text-lg font-bold mb-3 text-blue-900 dark:text-blue-200">Profissional</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Resultado positivo implica suspensão do direito de dirigir por 3 meses</li>
                            <li>Para retomar, deve apresentar novo exame negativo</li>
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <h3 className="text-lg font-bold mb-3 text-blue-900 dark:text-blue-200">Trabalhista e Previdenciário</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Empregado deve ser afastado</li>
                            <li>Empresa deve realizar avaliação clínica</li>
                            <li>Se houver dependência química: CAT, INSS e reavaliação do PGR</li>
                            <li className="font-semibold">Confidencialidade e direito à contraprova são garantidos</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Código Sequencial no eSocial</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-4">O laudo possui 17 caracteres. Para o eSocial, só os 11 finais são usados. Exemplo:</p>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded font-mono text-sm">
                        <p>Laudo: AAAAAAAA123456789</p>
                        <p>eSocial: AA123456789</p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Condutas em Caso de Resultado Positivo</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                    <ul className="list-disc pl-6 space-y-2 font-medium">
                        <li>Avaliação clínica</li>
                        <li>CAT (se houver suspeita ocupacional)</li>
                        <li>Afastamento</li>
                        <li>Encaminhamento ao INSS</li>
                        <li>Revalidação de riscos e medidas preventivas</li>
                    </ul>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Importante para o Suporte: Acesso ao e-CAC</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-amber-500">
                    <p className="mb-2">É obrigatória a permissão específica na procuração eletrônica no portal e-CAC para envio do evento S-2221.</p>
                    <p className="font-semibold text-amber-700 dark:text-amber-400">Sem essa permissão, mesmo com o sistema configurado corretamente, a transmissão não será autorizada.</p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">No Sistema - Parametrização</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-4">O exame toxicológico é identificado pelo <strong>ID 17</strong>. Para que ele seja transmitido corretamente:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li>Campo "S-2221" marcado como "Sim" no cadastro do funcionário</li>
                        <li>Opção "Seleção Randômica" habilitada</li>
                    </ul>
                    <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg text-center text-gray-400 italic">
                        [Imagem: Screenshot da tela de parametrização mostrando o ID 17 e a opção S-2221]
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Preenchimento do Exame</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-4">Campos obrigatórios para preenchimento:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li>CPF do empregado</li>
                        <li>Matrícula</li>
                        <li>Data de realização do exame</li>
                        <li>CNPJ do laboratório</li>
                        <li>Código sequencial</li>
                        <li>Nome e CRM do médico</li>
                    </ul>
                    <p className="mb-6 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded inline-block text-yellow-800 dark:text-yellow-200">O campo "Exibir no ASO" deve estar desmarcado.</p>
                    <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg text-center text-gray-400 italic">
                        [Imagem: Screenshot do formulário de preenchimento dos campos obrigatórios]
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-blue-600 pb-2 mb-6">Geração e Transmissão do Evento</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-6">Após finalizar o atendimento, o evento S-2221 é gerado automaticamente, desde que todos os parâmetros estejam configurados corretamente.</p>
                    <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg text-center text-gray-400 italic">
                        [Imagem: Screenshot mostrando a geração automática do evento]
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: S2221Content
};
