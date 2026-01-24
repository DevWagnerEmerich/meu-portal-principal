
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - Educatech",
    description: "Entre na sua conta Educatech para acessar jogos educativos exclusivos.",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
