
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Criar Conta - BrincaBytes",
    description: "Crie sua conta no BrincaBytes e tenha acesso a diversos jogos educativos.",
};

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
