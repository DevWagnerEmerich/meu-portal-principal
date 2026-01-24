
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Criar Conta - Educatech",
    description: "Crie sua conta no Educatech e tenha acesso a diversos jogos educativos.",
};

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
