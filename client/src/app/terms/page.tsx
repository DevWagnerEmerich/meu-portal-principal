import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Termos de Uso',
    description: 'Termos de Uso da plataforma BrincaBytes.',
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-slate-950 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-4xl font-bold text-white mb-8">Termos de Uso</h1>
                <div className="prose prose-invert max-w-none text-slate-300">
                    <p className="mb-4 text-lg">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                    <p className="mb-6">Bem-vindo ao BrincaBytes. Ao acessar e usar nossa plataforma de jogos educativos, você concorda em cumprir e ficar vinculado aos seguintes termos e condições de uso.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">1. Aceitação dos Termos</h2>
                    <p className="mb-6">Ao acessar o site BrincaBytes, você concorda em cumprir os presentes termos de serviço, todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">2. Uso Educacional</h2>
                    <p className="mb-6">Os materiais (jogos, conteúdos, dinâmicas) no site da BrincaBytes são fornecidos para fins educacionais e lúdicos. Concedemos permissão para uso pessoal ou no ambiente escolar, desde que mantida a integridade da plataforma.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">3. Contas de Usuário Institucional e Individual</h2>
                    <p className="mb-6">Para acessar áreas premium ou salvar progresso, é necessário criar uma conta. Você é responsável por manter a confidencialidade de sua conta e senha. Educadores são responsáveis por gerenciar o acesso de seus alunos, se aplicável, seguindo as diretrizes escolares.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">4. Assinaturas e Pagamentos</h2>
                    <p className="mb-6">A BrincaBytes oferece planos gratuitos e premium (assinaturas). Os detalhes sobre faturamento, renovação automática e políticas de cancelamento são apresentados durante o processo de finalização de compra (checkout).</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">5. Propriedade Intelectual</h2>
                    <p className="mb-6">A marca BrincaBytes, os códigos dos jogos, os designs gráficos e todo o conteúdo original são de propriedade intelectual da plataforma. Modificações ou cópias não autorizadas do software são estritamente proibidas.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">6. Isenção de Garantias</h2>
                    <p className="mb-6">Os materiais no site da BrincaBytes são fornecidos 'como estão'. A BrincaBytes não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias.</p>

                    <h2 className="text-2xl font-semibold text-white mt-10 mb-4">7. Modificações dos Termos</h2>
                    <p className="mb-6">A BrincaBytes pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.</p>

                    <p className="mt-12 text-sm text-slate-500">Para dúvidas ou questionamentos sobre os Termos de Uso, entre em contato pelo e-mail fornecido em nosso rodapé.</p>
                </div>
            </div>
        </main>
    );
}
