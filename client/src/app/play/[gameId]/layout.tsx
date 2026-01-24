import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Jogar - Meu Portal de Jogos",
    description: "Divirta-se jogando os melhores jogos educativos!",
};

export default function PlayLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
