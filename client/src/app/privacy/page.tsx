import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Política de Privacidade',
    description: 'Política de Privacidade e proteção de dados da plataforma BrincaBytes.',
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-slate-950 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidade</h1>
                <div className="prose prose-invert max-w-none text-slate-300">
                    <p className="mb-4 text-lg">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                    <p className="mb-6">Sua privacidade é importante para nós. É política da BrincaBytes respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site BrincaBytes e outros sites que possuímos e operamos.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">1. Informações que Coletamos</h2>
                    <p className="mb-6">Solicitamos informações pessoais, como nome, e-mail e dados da instituição de ensino (para perfis de professores/escolas) apenas quando realmente precisamos delas para lhe fornecer um serviço, como a criação de conta ou assinatura premium. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">2. Uso das Informações (Foco em Crianças)</h2>
                    <p className="mb-6">A BrincaBytes é uma plataforma educacional segura. Não vendemos dados de crianças. As estatísticas de jogo e progresso são coletadas exclusivamente para fornecer feedback ao aluno e aos responsáveis (pais ou professores) sobre o desenvolvimento educacional.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">3. Armazenamento Seguro</h2>
                    <p className="mb-6">Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">4. Compartilhamento de Dados</h2>
                    <p className="mb-6">Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei, ou para processadores de pagamento seguros durante transações financeiras (como a compra de pacotes premium).</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">5. Cookies</h2>
                    <p className="mb-6">Utilizamos cookies apenas para fins de gestão de sessão (manter você logado) e estatísticas anônimas de tráfego do site para melhorar a usabilidade da plataforma. Não utilizamos cookies invasivos de publicidade de terceiros direcionada a crianças.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">6. Seus Direitos (LGPD)</h2>
                    <p className="mb-6">Você é livre para recusar a nossa solicitação de informações pessoais, compreender também como seus dados são armazenados, e solicitar a exclusão total da sua conta e progresso educacional a qualquer momento entrando em contato com o nosso suporte.</p>

                    <p className="mt-12 text-sm text-slate-500">O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se tiver alguma dúvida sobre como lidamos com os dados de usuários e crianças, por favor entre em contato.</p>
                </div>
            </div>
        </main>
    );
}
