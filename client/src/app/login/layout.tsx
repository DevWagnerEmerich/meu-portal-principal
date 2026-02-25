
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - BrincaBytes",
    description: "Entre na sua conta BrincaBytes para acessar jogos educativos exclusivos.",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
