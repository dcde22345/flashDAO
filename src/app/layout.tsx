import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import ClientHeader from "@/components/ClientHeader";
import { Toaster } from "sonner";
import { PrivyProvider } from "@/context/PrivyProvider";
import { TokenProvider } from "@/context/TokenContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlashDAO",
  description:
    "Self-organized resources and talent across borders within seconds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={inter.className}>
      <head />
      <body suppressHydrationWarning={true}>
        <PrivyProvider>
          <TokenProvider>
            <ClientHeader />
            <main>{children}</main>
            <Toaster position="top-right" richColors closeButton />
          </TokenProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
