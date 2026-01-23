
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Checkout Seguro - Educatech",
    description: "Finalize sua assinatura e desbloqueie acesso ilimitado.",
};

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
