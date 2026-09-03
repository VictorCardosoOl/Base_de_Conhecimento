import React from 'react';

const PPPContent = () => {
    return (
        <div className="space-y-8 text-[var(--text-main)]">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-8 rounded-lg mb-10 text-center">
                <h1 className="m-0 text-3xl font-bold text-orange-900 dark:text-orange-100">PPP: Perfil Profissiográfico Previdenciário</h1>
                <p className="mt-2 text-lg text-orange-800 dark:text-orange-200">
                    O histórico laboral completo do trabalhador para fins de aposentadoria especial.
                </p>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-orange-600 pb-2 mb-6">A Era Digital (eSocial)</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <p className="mb-4 text-lg">
                        Desde <strong>01/01/2023</strong>, o PPP físico (papel) foi substituído pelo <strong>PPP Eletrônico</strong>.
                    </p>
                    <p className="mb-0">
                        Agora, as informações são alimentadas automaticamente pelos envios do evento <strong>S-2240</strong> do eSocial. O trabalhador acessa seu histórico diretamente pelo aplicativo ou site <strong>Meu INSS</strong>.
                    </p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-orange-600 pb-2 mb-6">O que consta no PPP?</h2>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                    O documento deve ser um espelho fiel das condições de trabalho ao longo do tempo. Seus campos principais são preenchidos com base no <strong>LTCAT</strong>:
                </p>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition">
                        <h3 className="font-bold text-lg text-orange-700 dark:text-orange-300 mb-2">1. Dados Administrativos</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            CNPJ da empresa, setor de trabalho, descrição das atividades cargo (CBO) e períodos de lotação.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition">
                        <h3 className="font-bold text-lg text-orange-700 dark:text-orange-300 mb-2">2. Registros Ambientais</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            É o coração do PPP. Lista os fatores de risco (físicos, químicos, biológicos) aos quais o trabalhador esteve exposto.
                        </p>
                        <ul className="text-xs text-gray-500 dark:text-gray-500 list-disc pl-4">
                            <li>Tipo do agente (ex: Ruído)</li>
                            <li>Intensidade/Concentração (ex: 85 dB(A))</li>
                            <li>Técnica de medição utilizada</li>
                            <li>Eficácia do EPI (Se neutralizou o risco ou não)</li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition">
                        <h3 className="font-bold text-lg text-orange-700 dark:text-orange-300 mb-2">3. Responsáveis Técnicos</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Nome e registro profissional (CREA/CRM) dos profissionais que assinaram os laudos ambientais (LTCAT) e biológicos (PCMSO) em cada período.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold border-b-2 border-orange-600 pb-2 mb-6">Dúvidas Frequentes</h2>
                <div className="space-y-4">
                    <div className="collapse collapse-arrow bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <input type="checkbox" />
                        <div className="collapse-title text-lg font-medium">
                            A empresa precisa fornecer o papel na demissão?
                        </div>
                        <div className="collapse-content">
                            <p className="text-sm">Para períodos trabalhados <strong>a partir de 2023</strong>, não. O trabalhador acessa online. Para períodos <strong>anteriores a 2023</strong>, a empresa ainda é obrigada a fornecer a via impressa/digitalizada do PPP antigo.</p>
                        </div>
                    </div>
                    <div className="collapse collapse-arrow bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <input type="checkbox" />
                        <div className="collapse-title text-lg font-medium">
                            Quem assina o PPP?
                        </div>
                        <div className="collapse-content">
                            <p className="text-sm">O representante legal da empresa. Ele assina com base nas informações técnicas fornecidas pelo Engenheiro de Segurança ou Médico do Trabalho no LTCAT.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default {
    content: PPPContent
};
